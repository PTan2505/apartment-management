import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
import { releaseFromInvoice, restoreDeduction } from "@/modules/deposits/holding.js";
import type { ReversePaymentInput } from "./schema.js";

const paymentInclude = {
  invoice: {
    select: {
      id: true,
      leaseId: true,
      type: true,
      issueDate: true,
      totalAmount: true,
      paymentStatus: true,
      voidedAt: true,
    },
  },
} as const;

async function findPaymentOrThrow(id: number) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  if (!payment) {
    throw new NotFoundError("Payment not found");
  }
  return payment;
}

export async function getPaymentById(id: number) {
  return findPaymentOrThrow(id);
}

export async function listPaymentsForInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }

  return prisma.payment.findMany({ where: { invoiceId }, orderBy: { id: "asc" } });
}

/**
 * Undoing a settlement: the owner hands the money back, the invoice returns to
 * pending, and anything the payment moved is moved back.
 *
 * This exists because voiding a paid invoice is refused. An owner who issued an
 * invoice for the wrong amount and was paid for it has to be able to undo the
 * payment, void the invoice and issue the right one — closing the first route
 * without opening this one would leave them stuck.
 *
 * The row is kept and dated rather than deleted. Money that arrived in March
 * and went back in April happened in both months, and the cash figure reports
 * it in both.
 *
 * The two holdings this unwinds used to be unwound by voiding an invoice. They
 * belong here now: a payment is what moved them, so undoing the payment is what
 * moves them back, and doing it in both places would move them twice.
 */
export async function reversePayment(id: number, input: ReversePaymentInput) {
  const payment = await findPaymentOrThrow(id);

  if (payment.state === "reversed") {
    throw new ConflictError("That payment has already been reversed");
  }

  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: payment.invoiceId },
    include: { lineItems: { select: { kind: true, amount: true } } },
  });

  return prisma.$transaction(async (tx) => {
    // A deposit this invoice CHARGED stopped being held the moment its payment
    // was undone — the charge it rested on is no longer settled.
    await releaseFromInvoice(tx, invoice.leaseId, invoice.lineItems);

    // A deposit this invoice was PAID OUT OF goes back into the holding. It was
    // spent on a bill; undoing the payment un-spends it.
    if (payment.method === "deposit_deduction") {
      await restoreDeduction(tx, invoice.leaseId, payment.amount);
    }

    await tx.payment.update({
      where: { id },
      data: { state: "reversed", reversedAt: input.reversedAt },
    });

    // The invoice returns to pending only if nothing is left settling it.
    //
    // An invoice can now carry more than one succeeded payment — an owner takes
    // cash while the tenant's transfer is already in flight, and both arrive.
    // Reversing one of two hands back the excess and leaves the bill paid, so
    // this asks rather than assuming.
    const stillSettling = await tx.payment.count({
      where: { invoiceId: invoice.id, state: "succeeded" },
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { paymentStatus: stillSettling > 0 ? "paid" : "pending" },
    });

    return tx.payment.findUniqueOrThrow({ where: { id }, include: paymentInclude });
  });
}
