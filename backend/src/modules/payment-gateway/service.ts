import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { holdFromInvoice } from "@/modules/deposits/holding.js";
import {
  createPaymentLink,
  fetchPaymentLink,
  gatewayConfig,
  verifyWebhookSignature,
} from "./payos.js";

const Decimal = Prisma.Decimal;

/**
 * What the tenant's bank statement will show.
 *
 * payOS documents a 9-character limit for accounts not linked to a payOS bank
 * account, which would have left room for nothing a person could recognise.
 * Probed against this account during implementation: 25 characters were
 * accepted, so the limit does not apply here and the description can be worth
 * reading. Capped at 25 anyway rather than pushed further — the field is a
 * VietQR transfer note and 25 is the length that is safe across banks.
 *
 * The invoice number leads, because it is what an owner reconciles by; the room
 * follows, because it is what a tenant recognises.
 */
const DESCRIPTION_MAX = 25;

function paymentDescription(invoiceId: number, roomCode: string): string {
  return `HD${invoiceId} ${roomCode}`.slice(0, DESCRIPTION_MAX);
}

/**
 * Creates a payment attempt for an invoice.
 *
 * The order is deliberate: write the pending payment first so it has an id, use
 * that id as the gateway's reference, then ask the gateway — and delete the
 * payment if the gateway does not accept it. A pending payment for a request
 * that was never made would sit in the record as an attempt in progress
 * forever, and would tell a tenant they had already started paying.
 */
export async function createGatewayPayment(invoiceId: number, urls: { returnUrl: string; cancelUrl: string }) {
  const config = gatewayConfig();
  if (!config) {
    throw new ValidationError("Online payment is not configured");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      leaseId: true,
      totalAmount: true,
      paymentStatus: true,
      voidedAt: true,
      lease: { select: { room: { select: { roomCode: true } } } },
    },
  });
  if (!invoice || invoice.voidedAt !== null) {
    throw new NotFoundError("Invoice not found");
  }
  if (invoice.paymentStatus === "paid") {
    throw new ConflictError("That invoice has already been paid");
  }

  // A bill already has a live link? Hand back the same one.
  //
  // Creating a second link for one debt gives the tenant two QR codes and the
  // owner a dashboard full of duplicates, one of which will be paid and the
  // rest of which will sit there looking unpaid.
  //
  // But a stored link may have died since — the tenant cancelled it on the
  // gateway's page, or it expired — and handing back a dead QR is worse than
  // making a new one. So the gateway is asked, and its answer decides.
  const existing = await prisma.payment.findFirst({
    where: { invoiceId: invoice.id, method: "gateway", state: "pending" },
    orderBy: { id: "desc" },
  });

  if (existing?.gatewayOrderCode != null) {
    const reused = await reuseOrRetire(existing, invoice);
    if (reused) {
      return reused;
    }
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      method: "gateway",
      state: "pending",
      // No date: no money has moved. The gateway supplies one when it does.
      paidAt: null,
    },
  });

  // The reference is this attempt's own id, never the invoice's. A link that
  // expires and is replaced would otherwise reuse a reference the gateway has
  // already seen, and a confirmation for either would be ambiguous.
  const orderCode = payment.id;

  try {
    const link = await createPaymentLink(config, {
      orderCode,
      amount: Number(invoice.totalAmount),
      description: paymentDescription(invoice.id, invoice.lease.room.roomCode),
      returnUrl: urls.returnUrl,
      cancelUrl: urls.cancelUrl,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayOrderCode: orderCode,
        gatewayPaymentId: link.paymentLinkId,
        // Kept so returning to this bill hands back the same link.
        gatewayCheckoutUrl: link.checkoutUrl,
        gatewayQrCode: link.qrCode,
      },
    });

    return { paymentId: payment.id, qrCode: link.qrCode, checkoutUrl: link.checkoutUrl };
  } catch (error) {
    // Nothing pending is left behind for a request the gateway refused.
    await prisma.payment.delete({ where: { id: payment.id } });
    throw error;
  }
}

interface WebhookBody {
  code?: unknown;
  desc?: unknown;
  success?: unknown;
  data?: unknown;
  signature?: unknown;
}

/**
 * Applies a confirmation from the gateway.
 *
 * The order of the checks is the security of this endpoint, and is not
 * negotiable:
 *
 *   1. the signature, BEFORE anything else in the payload is read;
 *   2. the reference resolves to a payment;
 *   3. the amount equals the invoice's total.
 *
 * Reading a reference out of an unverified payload and looking it up is already
 * trusting it enough to let somebody probe which references exist.
 *
 * Every outcome is recorded and every rejection answers the same way. The
 * endpoint is public; telling a prober whether their signature was wrong, or
 * their reference unknown, or merely their amount off, is telling them how to
 * get closer.
 */
export async function applyWebhook(body: WebhookBody) {
  const config = gatewayConfig();
  if (!config) {
    throw new ValidationError("Online payment is not configured");
  }

  const raw = body as Prisma.InputJsonValue;
  const data = body.data;

  const isObject = typeof data === "object" && data !== null && !Array.isArray(data);
  const verified =
    isObject && verifyWebhookSignature(data as Record<string, unknown>, body.signature, config.checksumKey);

  if (!verified) {
    await recordRejection(null, raw);
    return { applied: false as const };
  }

  const fields = data as Record<string, unknown>;
  const orderCode = Number(fields.orderCode);
  if (!Number.isInteger(orderCode)) {
    await recordRejection(null, raw);
    return { applied: false as const };
  }

  const payment = await prisma.payment.findUnique({
    where: { gatewayOrderCode: orderCode },
    include: {
      invoice: { include: { lineItems: { select: { kind: true, amount: true } } } },
    },
  });
  if (!payment) {
    await recordRejection(null, raw);
    return { applied: false as const };
  }

  // A confirmation is applied only to an attempt still waiting. One arriving
  // for an attempt that already succeeded, was cancelled or expired changes
  // nothing — which is what makes a retried delivery harmless without any
  // separate record of what has been seen.
  if (payment.state !== "pending") {
    await prisma.payment.update({ where: { id: payment.id }, data: { gatewayPayload: raw } });
    return { applied: false as const, alreadySettled: true as const };
  }

  const reported = new Decimal(String(fields.amount ?? "0"));
  if (!reported.equals(payment.invoice.totalAmount)) {
    await recordRejection(payment.id, raw);
    return { applied: false as const };
  }

  const paidAt = parseDate(fields.transactionDateTime) ?? new Date();
  await settle(payment.id, payment.invoiceId, payment.invoice.leaseId, payment.invoice.lineItems, paidAt, raw);
  return { applied: true as const };
}

/**
 * Marks a pending attempt as having been paid.
 *
 * Shared by the two places that can learn it: the confirmation arriving, and
 * the tenant coming back to a bill whose confirmation never arrived. One
 * transaction either way — an invoice recorded as paid whose deposit was not
 * moved reports the same money twice.
 */
async function settle(
  paymentId: number,
  invoiceId: number,
  leaseId: number,
  lineItems: { kind: string; amount: Prisma.Decimal }[],
  paidAt: Date,
  raw: Prisma.InputJsonValue | undefined,
) {
  await prisma.$transaction(async (tx) => {
    // Whatever deposit this invoice charged becomes money held, now that it has
    // been paid — the same rule as any other way of paying it.
    await holdFromInvoice(tx, leaseId, lineItems);

    await tx.payment.update({
      where: { id: paymentId },
      data: { state: "succeeded", paidAt, ...(raw === undefined ? {} : { gatewayPayload: raw }) },
    });

    await tx.invoice.update({ where: { id: invoiceId }, data: { paymentStatus: "paid" } });
  });
}

/**
 * Keeps the payload of a confirmation that was not applied.
 *
 * A signature that will not verify is either an attack or a mistake in this
 * implementation, and only the payload tells them apart. Where the reference
 * did not resolve there is no payment to attach it to, so it is logged instead.
 */
async function recordRejection(paymentId: number | null, raw: Prisma.InputJsonValue) {
  if (paymentId === null) {
    console.warn("Rejected payment gateway webhook", { payload: raw });
    return;
  }
  await prisma.payment.update({ where: { id: paymentId }, data: { gatewayPayload: raw } });
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Asks the gateway what it believes about a payment, and REPORTS a
 * disagreement rather than resolving it.
 *
 * Confirmations get lost — a deployment, a network fault, a retry budget spent.
 * A system that only ever learns by being told cannot notice that it was not
 * told, so there has to be a way to ask.
 *
 * Not correcting automatically is deliberate for a first version: acting on a
 * single reading is how one wrong answer becomes a wrong record, and the owner
 * is better placed to judge which side is wrong.
 */
export async function reconcilePayment(paymentId: number) {
  const config = gatewayConfig();
  if (!config) {
    throw new ValidationError("Online payment is not configured");
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }
  if (payment.gatewayOrderCode === null) {
    throw new ValidationError("That payment was not made through the gateway");
  }

  const remote = await fetchPaymentLink(config, payment.gatewayOrderCode);

  if (remote === null) {
    return {
      paymentId: payment.id,
      localState: payment.state,
      gatewayState: null,
      agrees: false,
      note: "The gateway has no record of this payment",
    };
  }

  const gatewaySaysPaid = remote.status === "PAID";
  const weSayPaid = payment.state === "succeeded";

  return {
    paymentId: payment.id,
    localState: payment.state,
    gatewayState: remote.status ?? null,
    agrees: gatewaySaysPaid === weSayPaid,
    note: gatewaySaysPaid === weSayPaid
      ? "The gateway and this system agree"
      : "The gateway and this system disagree — nothing has been changed",
  };
}

interface PendingPayment {
  id: number;
  invoiceId: number;
  gatewayOrderCode: number | null;
  gatewayCheckoutUrl: string | null;
  gatewayQrCode: string | null;
}

interface InvoiceForPayment {
  id: number;
  leaseId: number;
  totalAmount: Prisma.Decimal;
}

/**
 * Decides what to do with a payment attempt that is still pending here, by
 * asking the gateway what it thinks.
 *
 * Returns the link to hand back where the attempt is still live, or null where
 * it is not — having first recorded what actually became of it.
 *
 * **Why this trusts the gateway's answer, when the webhook has to be signed.**
 * The two are not the same kind of message. A confirmation is inbound: anyone
 * on the internet can post one, so a signature is the only thing separating the
 * gateway from an attacker. This is outbound: we opened the connection, to a
 * host we named, over TLS, with our own API key. Nobody else can be at the
 * other end of it.
 */
async function reuseOrRetire(existing: PendingPayment, invoice: InvoiceForPayment) {
  const config = gatewayConfig()!;
  const remote = await fetchPaymentLink(config, existing.gatewayOrderCode!);

  // The gateway says it is still waiting to be paid — the ordinary case, and
  // the reason this exists. Same link, same QR, same entry on the dashboard.
  if (remote?.status === "PENDING" && existing.gatewayCheckoutUrl && existing.gatewayQrCode) {
    return {
      paymentId: existing.id,
      qrCode: existing.gatewayQrCode,
      checkoutUrl: existing.gatewayCheckoutUrl,
    };
  }

  // The gateway says it was PAID and we did not know.
  //
  // A confirmation was lost — a deployment, a network fault, a retry budget
  // spent. This is the moment it is cheapest to notice, because the person in
  // front of us is about to pay a second time for a debt they have settled.
  //
  // Settled here rather than merely reported, and that is a deliberate
  // departure from how the owner's reconciliation behaves. The difference is
  // not how much the reading is trusted — it is the same reading — but what
  // inaction costs. An owner asking whether anything is wrong can be told, and
  // will look. A tenant asking to pay cannot be told "possibly nothing"; not
  // acting takes their money twice.
  if (remote?.status === "PAID") {
    const full = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { lineItems: { select: { kind: true, amount: true } } },
    });
    await settle(existing.id, invoice.id, invoice.leaseId, full.lineItems, new Date(), undefined);
    throw new ConflictError("That invoice has already been paid");
  }

  // Anything else — cancelled, expired, or a link the gateway no longer knows
  // — is an attempt that ended without the money arriving. Recorded as what it
  // was, so an owner can see that a link was created and came to nothing, and
  // so this attempt is never reconsidered.
  //
  // This is also the only place these two states are ever reached. Nothing else
  // produces them: a confirmation only ever reports success.
  await prisma.payment.update({
    where: { id: existing.id },
    data: { state: remote?.status === "EXPIRED" ? "expired" : "cancelled" },
  });

  return null;
}
