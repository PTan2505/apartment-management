import { Prisma } from "@/generated/prisma/client.js";
import { ConflictError, ValidationError } from "@/lib/errors.js";

/**
 * Moving the deposit a lease is holding.
 *
 * The holding is a stored figure rather than a derived one, because the two
 * cases this feature exists for are invisible to any derivation: a deposit
 * carried from a predecessor lease was never charged on the successor's
 * invoice, and a top-up collected in cash was never charged at all.
 *
 * A stored figure can drift, and the guard against that is structural: every
 * function here takes the caller's transaction client, so a holding only ever
 * moves inside the transaction of the operation that moved the money. Nothing
 * in this file opens a transaction, and nothing outside it writes `depositHeld`.
 */
type Tx = Prisma.TransactionClient;

const Decimal = Prisma.Decimal;
const ZERO = () => new Decimal(0);

interface DepositLine {
  kind: string;
  amount: Prisma.Decimal;
}

/**
 * What an invoice's deposit lines come to, which may be negative: an extension
 * that lowers the rent hands part of the deposit back as a negative line.
 */
export function depositCharged(lines: DepositLine[]): Prisma.Decimal {
  return lines.reduce(
    (running, line) => (line.kind === "deposit" ? running.add(line.amount) : running),
    ZERO(),
  );
}

async function shift(tx: Tx, leaseId: number, delta: Prisma.Decimal, whenNegative: () => never) {
  if (delta.isZero()) {
    return;
  }

  const lease = await tx.lease.findUniqueOrThrow({
    where: { id: leaseId },
    select: { depositHeld: true },
  });

  const next = lease.depositHeld.add(delta);
  if (next.isNegative()) {
    whenNegative();
  }

  await tx.lease.update({ where: { id: leaseId }, data: { depositHeld: next } });
}

/**
 * An invoice has been paid: whatever deposit it charged is now money the owner
 * is holding. Called for every payment; an invoice with no deposit line shifts
 * nothing and writes nothing.
 */
export async function holdFromInvoice(tx: Tx, leaseId: number, lines: DepositLine[]) {
  await shift(tx, leaseId, depositCharged(lines), () => {
    throw new ConflictError(
      "Paying this invoice would take the deposit held below zero — the surplus it returns is larger than the deposit on hand",
    );
  });
}

/**
 * An invoice that established a holding has been voided: the charge the holding
 * rested on no longer stands, so neither does the holding.
 */
export async function releaseFromInvoice(tx: Tx, leaseId: number, lines: DepositLine[]) {
  await shift(tx, leaseId, depositCharged(lines).negated(), () => {
    throw new ConflictError(
      "The deposit this invoice established has already been partly spent, so voiding it would leave a negative holding. Reverse those deductions first",
    );
  });
}

/**
 * A bill settled out of the deposit. The money reached the owner months ago;
 * this records where it went. Refused where the lease is not holding enough —
 * an owner cannot spend a deposit they do not have.
 */
export async function deductFromDeposit(tx: Tx, leaseId: number, amount: Prisma.Decimal) {
  await shift(tx, leaseId, amount.negated(), () => {
    throw new ValidationError(
      "This invoice is larger than the deposit held for its lease, so it cannot be settled from the deposit",
    );
  });
}

/**
 * A deduction reversed, because the invoice it paid was voided.
 */
export async function restoreDeduction(tx: Tx, leaseId: number, amount: Prisma.Decimal) {
  await shift(tx, leaseId, amount, () => {
    throw new ConflictError("Restoring this deduction would leave a negative holding");
  });
}

/**
 * Money added to or taken from a holding outside any invoice: a top-up
 * collected in cash at a renewal, a surplus handed back across a desk.
 */
export async function adjustHolding(tx: Tx, leaseId: number, amount: Prisma.Decimal) {
  await shift(tx, leaseId, amount, () => {
    throw new ValidationError(
      "That would take the deposit held below zero — an owner cannot return money they are not holding",
    );
  });
}

/**
 * The deposit moving from a lease to its successor at an extension. No money
 * moves; only which tenancy it is held against, so both sides are written
 * together and the total across the two is unchanged.
 */
export async function carryHolding(tx: Tx, fromLeaseId: number, toLeaseId: number, amount: Prisma.Decimal) {
  if (amount.isZero()) {
    return;
  }

  await tx.lease.update({
    where: { id: fromLeaseId },
    data: { depositHeld: ZERO(), depositCarriedOut: amount },
  });
  await tx.lease.update({
    where: { id: toLeaseId },
    data: { depositHeld: amount, depositCarriedIn: amount },
  });
}
