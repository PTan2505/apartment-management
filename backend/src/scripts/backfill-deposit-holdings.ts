import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";

/**
 * Establishes the deposit holdings for deposits already charged and paid before
 * the holding existed as a concept.
 *
 * Written as a script rather than a migration deliberately: it reads invoice
 * line items to decide what each lease holds, and a data question belongs
 * somewhere it can be re-run and checked rather than somewhere it runs once
 * inside a schema change.
 *
 * Safe to re-run, and deliberately narrow: it only ESTABLISHES a holding that
 * was never established. A lease already holding something is left alone.
 *
 * That narrowness is the whole guard. A holding is not always the sum of what
 * was charged — a deposit carried from a predecessor was never charged on the
 * successor's invoice, and a top-up collected in cash was never charged at all
 * — so recomputing one from invoice lines would silently destroy it. Restricting
 * to leases holding nothing, with no sign of the feature having touched them,
 * makes that impossible rather than merely unlikely.
 */
const Decimal = Prisma.Decimal;

async function main() {
  const invoices = await prisma.invoice.findMany({
    where: {
      voidedAt: null,
      paymentStatus: "paid",
      lineItems: { some: { kind: "deposit" } },
    },
    select: {
      leaseId: true,
      lineItems: { where: { kind: "deposit" }, select: { amount: true } },
    },
  });

  const byLease = new Map<number, Prisma.Decimal>();
  for (const invoice of invoices) {
    const charged = invoice.lineItems.reduce(
      (running, line) => running.add(line.amount),
      new Decimal(0),
    );
    byLease.set(invoice.leaseId, (byLease.get(invoice.leaseId) ?? new Decimal(0)).add(charged));
  }

  console.log(`Paid, non-voided invoices carrying a deposit charge: ${invoices.length}`);
  console.log(`Leases with such a charge:                           ${byLease.size}`);

  let written = 0;
  let skipped = 0;

  for (const [leaseId, amount] of byLease) {
    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      select: {
        depositHeld: true,
        depositCarriedIn: true,
        depositCarriedOut: true,
        depositRefundedAt: true,
      },
    });
    if (!lease) {
      continue;
    }

    // Any of these means the holding is already a considered figure rather than
    // an absent one, and is not necessarily the sum of what was charged.
    const alreadyEstablished =
      !lease.depositHeld.isZero() ||
      !lease.depositCarriedIn.isZero() ||
      !lease.depositCarriedOut.isZero() ||
      lease.depositRefundedAt !== null;

    if (alreadyEstablished) {
      skipped += 1;
      continue;
    }

    await prisma.lease.update({ where: { id: leaseId }, data: { depositHeld: amount } });
    written += 1;
  }

  const actualTotal = await prisma.lease.aggregate({ _sum: { depositHeld: true } });

  console.log(`\nHoldings established: ${written}`);
  console.log(`Left alone as already established: ${skipped}`);
  console.log(`Total held across all leases now: ${(actualTotal._sum.depositHeld ?? new Decimal(0)).toFixed(0)}`);

  await prisma.$disconnect();
}

await main();
