import type { Prisma } from "@/generated/prisma/client.js";

interface SelectionRow {
  id: number;
  leaseId: number;
  buildingServiceFeeId: number;
  unitAmount: Prisma.Decimal;
  quantity: number;
  basis: "perRoom" | "perPerson";
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
  buildingServiceFee?: { id: number; name: string; isActive: boolean } | null;
}

/**
 * Shapes a lease's service fee.
 *
 * `monthlyAmount` is derived rather than stored, for the same reason a lease's
 * deposit amount is: a third value could disagree with the two it comes from,
 * and then no reader could tell which was wrong.
 *
 * `unitAmount` is the amount this lease agreed, not the building's current one.
 * It is reported explicitly so a caller can see what was agreed rather than
 * inferring it by dividing.
 */
export function toLeaseServiceFeeResponse(row: SelectionRow) {
  return {
    id: row.id,
    leaseId: row.leaseId,
    buildingServiceFeeId: row.buildingServiceFeeId,
    name: row.buildingServiceFee?.name ?? null,
    // True when the building no longer offers this fee. The lease keeps it
    // regardless — it holds its own agreed amount — so this is information
    // about the catalogue, not about the charge.
    isOfferedByBuilding: row.buildingServiceFee?.isActive ?? null,
    unitAmount: row.unitAmount,
    // What this tenancy agreed the amount is multiplied by. For a perPerson fee
    // `quantity` is not the multiplier — the tenancy's occupant count is, read
    // when each invoice is generated — so the two are reported separately
    // rather than letting a caller assume one from the other.
    basis: row.basis,
    quantity: row.quantity,
    // The period this fee applied for. Null `effectiveTo` means it still does.
    // A fee given up is still reported — it is part of the lease's history and
    // an invoice for a month it covered still has to charge it.
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
    /*
      For a perRoom fee this is the whole story. For a perPerson one it is the
      amount for ONE person: the real monthly figure needs the tenancy's
      occupant count, which this row does not carry, and inventing one here
      would report a number no invoice will ever match.
    */
    monthlyAmount: row.unitAmount.mul(row.basis === "perPerson" ? 1 : row.quantity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
