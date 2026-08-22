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
 * Notice what is absent — the lease id, the room id, the building, the deposit,
 * anything about the owner. A tenant needs to know what they are being charged
 * and why, not how the system is organised.
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
  lease: { room: { roomCode: string } };
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
  };
}
