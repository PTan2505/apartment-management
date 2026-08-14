/**
 * Adds whole months to a date, clamping to the last valid day of the target
 * month. 31 January + 1 month is 28 (or 29) February, never 3 March — a naive
 * implementation rolls over into the following month.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();

  // Move to the 1st first so adding months cannot itself roll over.
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

export type LeaseStatus = "active" | "finalized";

interface OccupantRow {
  userId: number;
  isPrimary: boolean;
  leftAt: Date | null;
  user?: { id: number; fullName: string; phone: string | null } | null;
}

interface LeaseRow {
  id: number;
  roomId: number;
  startDate: Date;
  durationMonths: number;
  occupantCount: number;
  moveOutDate: Date | null;
  startMeterReading: number;
  endMeterReading: number | null;
  createdAt: Date;
  updatedAt: Date;
  occupants?: OccupantRow[];
}

/**
 * Shapes every lease response. expectedEndDate, status, and tenant are derived
 * here rather than stored, so they can never contradict the rows they come
 * from. Note occupantCount is NOT derived from occupants — it is a manually
 * maintained billing input and the two may legitimately differ (see design.md).
 */
export function toLeaseResponse(lease: LeaseRow) {
  const primary = lease.occupants?.find((o) => o.isPrimary && o.leftAt === null);

  return {
    id: lease.id,
    roomId: lease.roomId,
    startDate: lease.startDate,
    durationMonths: lease.durationMonths,
    expectedEndDate: addMonths(lease.startDate, lease.durationMonths),
    occupantCount: lease.occupantCount,
    moveOutDate: lease.moveOutDate,
    startMeterReading: lease.startMeterReading,
    endMeterReading: lease.endMeterReading,
    status: (lease.moveOutDate === null ? "active" : "finalized") satisfies LeaseStatus,
    tenant: primary
      ? {
          id: primary.userId,
          fullName: primary.user?.fullName ?? null,
          phone: primary.user?.phone ?? null,
        }
      : null,
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
  };
}

export function toOccupantResponse(occupant: OccupantRow & {
  id: number;
  joinedAt: Date;
}) {
  return {
    id: occupant.id,
    customerId: occupant.userId,
    fullName: occupant.user?.fullName ?? null,
    phone: occupant.user?.phone ?? null,
    isPrimary: occupant.isPrimary,
    joinedAt: occupant.joinedAt,
    leftAt: occupant.leftAt,
    status: occupant.leftAt === null ? "current" : "departed",
  };
}
