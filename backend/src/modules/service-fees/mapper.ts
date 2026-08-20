import type { Prisma } from "@/generated/prisma/client.js";

interface SelectionRow {
  id: number;
  leaseId: number;
  buildingServiceFeeId: number;
  unitAmount: Prisma.Decimal;
  quantity: number;
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
    quantity: row.quantity,
    monthlyAmount: row.unitAmount.mul(row.quantity),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
