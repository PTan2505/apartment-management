import type { Prisma } from "@/generated/prisma/client.js";

/**
 * The tenant's view of a bill.
 *
 * Deliberately NOT the shape returned to the owner. Reusing that one would mean
 * every field added for the owner's benefit appears here the day it is added,
 * decided by nobody — and the fields at risk are not hypothetical: invoices and
 * leases have gained a deposit holding, a settlement figure, a payment method
 * and a set of internal ids over the last few changes.
 *
 * The cost is a second mapper to maintain, and that cost IS the mechanism:
 * showing a tenant something new has to be a decision somebody makes on
 * purpose.
 *
 * Notice what is absent — the lease id, the room id, the building id, the
 * deposit, anything about the owner. A tenant needs to know what they are being
 * charged and why, not how the system is organised.
 *
 * The building's NAME is now reported, which this comment used to list among
 * the omissions. That was too broad a stroke: what the rule protects is the
 * system's own bookkeeping, and where somebody lives is not that. A tenant with
 * rooms in two buildings could not tell their bills apart, because a room code
 * alone does not say which place — P202 is plausible in any of them.
 *
 * The building's ID stays out, along with every other id, which is what the
 * rule was actually for.
 */
interface PortalLineRow {
  kind: string;
  description: string;
  quantity: Prisma.Decimal | null;
  unitAmount: Prisma.Decimal | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  amount: Prisma.Decimal;
  position: number;
}

interface PortalInvoiceRow {
  id: number;
  type: string;
  issueDate: Date;
  year: number | null;
  month: number | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  previousElectricityUse: number | null;
  currentElectricityUse: number | null;
  totalAmount: Prisma.Decimal;
  paymentStatus: string;
  lineItems: PortalLineRow[];
  lease: { room: { roomCode: string; building: { displayName: string } } };
  /**
   * Every payment against this bill, newest first.
   *
   * One list answering two questions — is an attempt under way, and when did
   * one land — because Prisma will not select the same relation twice under two
   * names. Which means the filtering lives here rather than in the query, and
   * has to be written where it can be read.
   */
  payments: {
    id: number;
    state: string;
    paidAt: Date | null;
    reversedAt: Date | null;
  }[];
}

export function toPortalInvoice(invoice: PortalInvoiceRow) {
  return {
    id: invoice.id,
    kind: invoice.type,
    issueDate: invoice.issueDate,
    // The month of utilities this bill covers, where it has one. A move-in,
    // overdue or ad-hoc bill has none.
    coversYear: invoice.year,
    coversMonth: invoice.month,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    // The room, by its code. Enough for a tenant to recognise which of their
    // tenancies a bill belongs to, without exposing how rooms are identified
    // internally.
    roomCode: invoice.lease.room.roomCode,
    // Which place the room is in. By name, never by id: a tenant with rooms in
    // two buildings cannot tell their bills apart from a room code alone.
    buildingName: invoice.lease.room.building.displayName,
    // The readings the electricity was computed from. The whole point of
    // itemising: a total is what an owner can already read down the phone; the
    // meter reading is what a tenant cannot otherwise check.
    meterReadingFrom: invoice.previousElectricityUse,
    meterReadingTo: invoice.currentElectricityUse,
    charges: invoice.lineItems
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        kind: line.kind,
        description: line.description,
        quantity: line.quantity,
        unitAmount: line.unitAmount,
        periodStart: line.periodStart,
        periodEnd: line.periodEnd,
        amount: line.amount,
      })),
    totalAmount: invoice.totalAmount,
    isPaid: invoice.paymentStatus === "paid",
    /**
     * When the money landed, for a bill that has been settled.
     *
     * Read from the payments rather than stored beside the bill: a second copy
     * is a second thing that can disagree with the payments beneath it.
     *
     * Null where the bill is unpaid, and ALSO where it is settled but no
     * payment carries a date — a bill written off, or one settled against a
     * deposit before dates were recorded. Substituting the issue date or today
     * would put a date in front of a tenant that nothing in the system
     * supports, on the one screen they use to check a transfer.
     */
    settledAt:
      invoice.paymentStatus === "paid"
        ? (invoice.payments.find(
            // A reversed payment settled nothing. Dating a bill by money that
            // was later taken back would tell a tenant their transfer
            // succeeded while the system holds the opposite.
            (payment) =>
              payment.state === "succeeded" &&
              payment.reversedAt === null &&
              payment.paidAt !== null,
          )?.paidAt ?? null)
        : null,
    // Whether the tenant has already started paying this one. A boolean and
    // nothing more: what the gateway called the attempt, what it replied and
    // what it sent are the owner's business and the system's, not the tenant's.
    hasPaymentInProgress: invoice.payments.some((payment) => payment.state === "pending"),
  };
}
