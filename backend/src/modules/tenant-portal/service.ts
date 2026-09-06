import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { NotFoundError, ValidationError } from "@/lib/errors.js";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/opaque-token.js";
import { createGatewayPayment } from "@/modules/payment-gateway/service.js";
import { toPortalInvoice } from "./mapper.js";

/* ------------------------------------------------------------------ */
/* The owner's half: issuing and withdrawing a link                    */
/* ------------------------------------------------------------------ */

/**
 * Issues a portal link for a customer, returning the token ONCE.
 *
 * Any previous token is revoked in the same transaction. Replacing a link an
 * owner suspects has been shared is then one action rather than two, and there
 * is never a moment where both work.
 */
export async function issuePortalLink(customerId: number) {
  const user = await prisma.user.findUnique({
    where: { id: customerId },
    select: { id: true, role: true, fullName: true },
  });
  if (!user) {
    throw new NotFoundError("CUSTOMER_NOT_FOUND", "Customer not found");
  }
  // An owner signs in with a password. A portal link is for somebody who
  // cannot, and handing one to an owner account would be a second, weaker way
  // into an account that already has a real one.
  if (user.role !== "customer") {
    throw new ValidationError("PORTAL_LINK_ONLY_FOR_CUSTOMER", "A portal link can only be issued to a customer");
  }

  const token = generateOpaqueToken();

  const created = await prisma.$transaction(async (tx) => {
    await tx.tenantAccessToken.updateMany({
      where: { userId: customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return tx.tenantAccessToken.create({
      data: { userId: customerId, tokenHash: hashOpaqueToken(token) },
    });
  });

  return {
    customerId: user.id,
    fullName: user.fullName,
    issuedAt: created.createdAt,
    // The only time this is ever returned. It is stored hashed, so there is no
    // way to show it again — which is the point.
    token,
  };
}

export async function revokePortalLink(customerId: number) {
  const active = await prisma.tenantAccessToken.findFirst({
    where: { userId: customerId, revokedAt: null },
  });
  if (!active) {
    throw new NotFoundError("PORTAL_LINK_NONE", "That customer has no portal link");
  }

  await prisma.tenantAccessToken.update({
    where: { id: active.id },
    data: { revokedAt: new Date() },
  });

  return { customerId, revokedAt: new Date() };
}

/**
 * What the owner can see about a link: that it exists, when it was issued, and
 * whether anyone has used it. Never the token.
 *
 * `lastUsedAt` is the only signal there is that a link is being used by someone
 * who should not have it — the portal is public and nothing throttles it.
 */
export async function getPortalLinkStatus(customerId: number) {
  const active = await prisma.tenantAccessToken.findFirst({
    where: { userId: customerId, revokedAt: null },
    select: { createdAt: true, lastUsedAt: true },
  });

  return {
    customerId,
    hasLink: active !== null,
    issuedAt: active?.createdAt ?? null,
    lastUsedAt: active?.lastUsedAt ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* The tenant's half: using a link                                     */
/* ------------------------------------------------------------------ */

/**
 * Resolves a presented token to the customer it belongs to, and records the use.
 *
 * A token that is unknown, revoked, or not a token at all produces the same
 * NotFoundError. The distinction somebody probing wants is exactly the one
 * between "never existed" and "existed and was withdrawn" — the second confirms
 * a guess — and with no rate limit to blunt that, the answers have to be
 * indistinguishable.
 */
async function resolveToken(token: string) {
  const row = await prisma.tenantAccessToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    include: { user: { select: { id: true, fullName: true, phone: true } } },
  });

  if (!row || row.revokedAt !== null) {
    throw new NotFoundError("PORTAL_NOT_FOUND", "Portal not found");
  }

  await prisma.tenantAccessToken.update({
    where: { id: row.id },
    data: { lastUsedAt: new Date() },
  });

  return row.user;
}

/**
 * The tenant's own bills.
 *
 * What they can see is derived from occupancy rather than from the lease:
 *
 *   - every invoice of a tenancy they occupy NOW, paid or not;
 *   - only the UNPAID invoices of a tenancy they have left.
 *
 * The looser rule — everything you ever occupied — leaks: the room is re-let,
 * new bills are issued, and the previous tenant keeps watching them. The
 * stricter one — current tenancies only — hides the final invoice, which is
 * issued at the moment a move-out is recorded and is therefore always addressed
 * to somebody who has just stopped being a current occupant.
 *
 * Restricting past tenancies to what is unpaid answers both: what you still owe
 * stays visible, what the next tenant owes never becomes visible.
 */
/**
 * The one place that decides what a token may see.
 *
 * Written once and used by both the reading and the paying: a token that cannot
 * show an invoice must not be able to pay one, and two copies of this rule
 * would eventually disagree about which.
 */
async function visibleInvoiceFilter(userId: number): Promise<Prisma.InvoiceWhereInput> {
  const occupancies = await prisma.leaseOccupant.findMany({
    where: { userId },
    select: { leaseId: true, leftAt: true },
  });

  const currentLeaseIds = occupancies.filter((o) => o.leftAt === null).map((o) => o.leaseId);
  const pastLeaseIds = occupancies.filter((o) => o.leftAt !== null).map((o) => o.leaseId);

  return {
    // Withdrawn bills are not shown. They were withdrawn.
    voidedAt: null,
    OR: [
      { leaseId: { in: currentLeaseIds } },
      { leaseId: { in: pastLeaseIds }, paymentStatus: "pending" },
    ],
  };
}

export async function getPortalOverview(token: string) {
  const user = await resolveToken(token);

  const invoices = await prisma.invoice.findMany({
    where: await visibleInvoiceFilter(user.id),
    select: {
      id: true,
      type: true,
      issueDate: true,
      year: true,
      month: true,
      periodStart: true,
      periodEnd: true,
      previousElectricityUse: true,
      currentElectricityUse: true,
      totalAmount: true,
      paymentStatus: true,
      lineItems: {
        select: {
          kind: true,
          description: true,
          quantity: true,
          unitAmount: true,
          periodStart: true,
          periodEnd: true,
          amount: true,
          position: true,
        },
      },
      lease: {
        select: {
          room: {
            select: { roomCode: true, building: { select: { displayName: true } } },
          },
        },
      },
      /*
        The payments, ONCE, carrying what both questions need — whether an
        attempt is under way, and when one landed.

        Selected once rather than twice under two names, which is not something
        Prisma allows: a relation appears in a `select` once, and a second entry
        for the same relation is an unknown field. The filtering that used to be
        in the query therefore moves to the mapper.
      */
      payments: {
        select: { id: true, state: true, paidAt: true, reversedAt: true },
        orderBy: { paidAt: "desc" },
      },
    },
    // Newest first: what a tenant opens the portal to check is almost always
    // the most recent bill.
    orderBy: { issueDate: "desc" },
  });

  return {
    tenant: { fullName: user.fullName, phone: user.phone },
    invoices: invoices.map(toPortalInvoice),
  };
}

/**
 * Starts a payment for one of the tenant's own unpaid bills.
 *
 * The bills payable are exactly the bills visible, resolved by the same filter
 * the overview uses — so a request to pay an invoice the token cannot see fails
 * the same way a request to view it would, and for the same reason.
 */
export async function startPortalPayment(
  token: string,
  invoiceId: number,
  urls: { returnUrl: string; cancelUrl: string },
) {
  const user = await resolveToken(token);

  const visible = await prisma.invoice.findFirst({
    where: { AND: [{ id: invoiceId }, await visibleInvoiceFilter(user.id)] },
    select: { id: true },
  });
  // Indistinguishable from an invoice that does not exist. A tenant learning
  // which invoice ids are real is a tenant learning about other tenancies.
  if (!visible) {
    throw new NotFoundError("INVOICE_NOT_FOUND", "Invoice not found");
  }

  return createGatewayPayment(invoiceId, urls);
}
