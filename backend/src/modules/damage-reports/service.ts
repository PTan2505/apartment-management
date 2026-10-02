import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import { withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import { announce, recipientsFor, writeNotices } from "./notices.js";
import type {
  CloseReportInput,
  CreateReportInput,
  ListReportsQuery,
  RepairCostInput,
  ReportPhotoConfirmInput,
  ReportPhotoUploadInput,
  ScheduleReportInput,
} from "./schema.js";

/**
 * What a report carries to the people who act on it.
 *
 * The room and the building because that is where to go; the tenant's name and
 * phone number because the first thing anybody does is ring them. Both come
 * from the tenancy rather than being copied onto the report, so neither can go
 * stale — and both are things the recipient's role already entitles them to,
 * since a report only ever reaches staff of its own building.
 */
const reportSelect = {
  id: true,
  leaseId: true,
  description: true,
  state: true,
  reportedAt: true,
  scheduledFor: true,
  scheduleNote: true,
  scheduledAt: true,
  closedAt: true,
  closingNote: true,
  /*
    What the repair cost, read from the expense that holds it.

    The report has no amount column of its own — see the schema. Absent here
    means nobody has priced the repair, which is a different fact from a
    repair that cost nothing.
  */
  cost: { select: { id: true, amount: true, incurredAt: true, description: true } },
  photos: { select: { id: true, contentType: true, uploadedAt: true }, orderBy: { uploadedAt: "asc" as const } },
  lease: {
    select: {
      id: true,
      room: {
        select: { id: true, roomCode: true, building: { select: { id: true, displayName: true } } },
      },
      occupants: {
        where: { isPrimary: true },
        select: { leftAt: true, user: { select: { fullName: true, phone: true } } },
        orderBy: { joinedAt: "desc" as const },
      },
    },
  },
} as const;

type ReportRow = {
  lease: {
    id: number;
    room: { id: number; roomCode: string; building: { id: number; displayName: string } };
    occupants: { leftAt: Date | null; user: { fullName: string; phone: string | null } | null }[];
  };
};

function toReport<T extends ReportRow>({ lease, ...report }: T) {
  // Whoever signed, still here or last to hold it. A tenancy can have nobody
  // named on it, and a report raised from such a tenancy still needs showing.
  const signatory = (lease.occupants.find((o) => o.leftAt === null) ?? lease.occupants[0])?.user;
  return {
    ...report,
    room: { id: lease.room.id, roomCode: lease.room.roomCode },
    building: lease.room.building,
    tenant: { fullName: signatory?.fullName ?? null, phone: signatory?.phone ?? null },
  };
}

/* ------------------------------------------------------------------ */
/* The tenant's half                                                   */
/* ------------------------------------------------------------------ */

/**
 * Raises a report against the tenancy the portal token was issued for.
 *
 * The room is taken from the tenancy and never from the request: a tenant who
 * can name a room is a tenant who can name somebody else's.
 *
 * Accepted on a tenancy that has ended. Something found broken after a move-out
 * is precisely when a report matters — it is what the deposit settlement turns
 * on.
 */
export async function raiseReport(leaseId: number, input: CreateReportInput) {
  // The report and the notices are written together: a notice about a report
  // that a failed write rolled back is a notice about something that never
  // happened.
  const { report, recipients } = await prisma.$transaction(async (tx) => {
    const created = await tx.damageReport.create({
      data: { leaseId, description: input.description },
      select: reportSelect,
    });
    const userIds = await recipientsFor(tx, created.lease.room.building.id);
    await writeNotices(tx, created.id, userIds);
    return { report: created, recipients: userIds };
  });

  // Pushed AFTER the commit, and to nobody it was not written for. Best
  // effort: whoever is not connected finds the same notice waiting.
  announce(recipients, {
    id: report.id,
    roomCode: report.lease.room.roomCode,
    buildingName: report.lease.room.building.displayName,
    reportedAt: report.reportedAt,
  });

  return toReport(report);
}

/** The reports of one tenancy, newest first, for the portal. */
export async function listReportsForLease(leaseId: number) {
  const rows = await prisma.damageReport.findMany({
    where: { leaseId },
    select: reportSelect,
    orderBy: { reportedAt: "desc" },
  });
  return rows.map(toReport);
}

/* ------------------------------------------------------------------ */
/* Photographs                                                         */
/* ------------------------------------------------------------------ */

function assertStorage() {
  if (!storage.isConfigured()) {
    throw new ValidationError("STORAGE_NOT_CONFIGURED", "File storage is not configured");
  }
}

/** The report must exist and belong to the tenancy asking — the caller checks that. */
export async function signPhotoUpload(reportId: number, input: ReportPhotoUploadInput) {
  assertStorage();
  return storage.signReportPhotoUpload(reportId, input.contentType);
}

/**
 * Records a photograph that has arrived.
 *
 * The object is DESCRIBED rather than listed: a listing is eventually
 * consistent and would miss an upload that finished a moment ago — the same
 * trap the contract pages hit.
 */
export async function confirmPhoto(reportId: number, input: ReportPhotoConfirmInput) {
  assertStorage();

  if (!input.key.startsWith(storage.reportPhotoPrefix(reportId))) {
    throw new ValidationError("REPORT_PHOTO_KEY_INVALID", "That key does not belong to this report");
  }

  const object = await storage.describeObject(input.key);
  if (!object) {
    throw new ValidationError("REPORT_PHOTO_NOT_UPLOADED", "No photograph has been uploaded under that key");
  }
  if (object.size > storage.MAX_REPORT_PHOTO_BYTES) {
    throw new ValidationError("REPORT_PHOTO_TOO_LARGE", "That photograph is too large");
  }

  await prisma.damageReportPhoto.create({
    data: {
      reportId,
      key: input.key,
      // Storage answers with what it holds. Falling back to the extension
      // would be guessing at a fact the object itself carries.
      contentType: object.contentType ?? "application/octet-stream",
    },
  });

  return toReport(
    await prisma.damageReport.findUniqueOrThrow({ where: { id: reportId }, select: reportSelect }),
  );
}

/** A short-lived link to one photograph. */
export async function photoDownload(reportId: number, photoId: number) {
  assertStorage();
  const photo = await prisma.damageReportPhoto.findFirst({
    where: { id: photoId, reportId },
    select: { key: true },
  });
  if (!photo) {
    throw new NotFoundError("REPORT_PHOTO_NOT_FOUND", "Photograph not found");
  }
  return storage.signDownload(photo.key);
}

/* ------------------------------------------------------------------ */
/* The staff half                                                      */
/* ------------------------------------------------------------------ */

/**
 * Finds a report the caller is entitled to, or reports it absent.
 *
 * Staff of another building get NOT FOUND rather than a refusal, for the
 * reason the scope middleware states once: a refusal confirms the report
 * exists.
 */
export async function getReportById(id: number, scope: BuildingScope) {
  const report = await prisma.damageReport.findUnique({ where: { id }, select: reportSelect });
  if (!report || !withinScope(scope, report.lease.room.building.id)) {
    throw new NotFoundError("REPORT_NOT_FOUND", "Report not found");
  }
  return toReport(report);
}

/**
 * The reports staff work from: OLDEST OPEN FIRST.
 *
 * The opposite of every other listing here, deliberately. Elsewhere the newest
 * row is the interesting one; here it is the one that has been waiting three
 * weeks, and newest-first buries exactly that.
 *
 * Done reports sort after open ones and newest first among themselves, because
 * once something is finished the recent one is the one being looked up.
 */
export async function listReports(query: ListReportsQuery, scope: BuildingScope) {
  const clauses: Prisma.DamageReportWhereInput[] = [];
  // The caller's buildings and the building they asked for are separate
  // clauses: spread into one object the second would replace the first, and
  // the first is the scope.
  if (scope !== null) clauses.push({ lease: { room: { buildingId: { in: scope } } } });
  if (query.buildingId) clauses.push({ lease: { room: { buildingId: query.buildingId } } });
  if (query.state) clauses.push({ state: query.state });
  if (query.open) clauses.push({ state: { in: ["new", "scheduled"] } });

  const where: Prisma.DamageReportWhereInput = { AND: clauses };

  const skip = (query.page - 1) * query.pageSize;
  const [rows, total] = await Promise.all([
    prisma.damageReport.findMany({
      where,
      select: reportSelect,
      // `state` ascending puts new before scheduled before done — the enum's
      // own order, which is the order they happen in.
      orderBy: [{ state: "asc" }, { reportedAt: "asc" }],
      skip,
      take: query.pageSize,
    }),
    prisma.damageReport.count({ where }),
  ]);

  return {
    data: rows.map(toReport),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

/** A report that is done accepts nothing further. */
function assertOpen(state: string) {
  if (state === "done") {
    throw new ConflictError("REPORT_ALREADY_DONE", "That report is done and cannot be changed");
  }
}

/**
 * Records the appointment agreed with the tenant, or moves it.
 *
 * Who recorded it is kept for the staff's own record and never reported to the
 * tenant: somebody is coming and when is what a tenant needs, not the staffing
 * of the building.
 */
export async function scheduleReport(
  id: number,
  input: ScheduleReportInput,
  scope: BuildingScope,
  byUserId: number,
) {
  const existing = await getReportById(id, scope);
  assertOpen(existing.state);

  await prisma.damageReport.update({
    where: { id },
    data: {
      state: "scheduled",
      scheduledFor: input.scheduledFor,
      scheduleNote: input.note ?? null,
      scheduledAt: new Date(),
      scheduledById: byUserId,
    },
  });

  return getReportById(id, scope);
}

/**
 * Closes a report, from either state.
 *
 * From `new` as well as `scheduled`, because some things are fixed on the spot
 * and inventing an appointment to record that would be writing down something
 * that did not happen.
 */
/* ------------------------------------------------------------------ */
/* What the repair cost                                                */
/* ------------------------------------------------------------------ */

/**
 * Records, or corrects, what a repair cost the owner.
 *
 * A broken window is the owner's bill. Nothing here reaches a tenant: the
 * amount becomes an EXPENSE against the room, which the revenue report already
 * subtracts from what the building earned.
 *
 * Written as an upsert on the expense's unique `damageReportId`, so recording
 * a second time corrects the figure instead of adding a row. That uniqueness
 * is what stops one repair being counted twice in a month — including from two
 * tabs open at once, where a read-then-insert would race.
 *
 * The date defaults to the day the report was CLOSED, not to today: the money
 * belongs to the month the work happened in. Recording it late therefore moves
 * a past month's figures, which is how every other expense in this system
 * already behaves — `createExpense` has always taken a date the owner chooses.
 */
export async function recordRepairCost(
  id: number,
  input: RepairCostInput,
  scope: BuildingScope,
) {
  const report = await prisma.damageReport.findUnique({
    where: { id },
    select: {
      id: true,
      closedAt: true,
      reportedAt: true,
      description: true,
      lease: { select: { room: { select: { id: true, buildingId: true } } } },
    },
  });
  if (!report || !withinScope(scope, report.lease.room.buildingId)) {
    throw new NotFoundError("REPORT_NOT_FOUND", "Damage report not found");
  }

  const incurredAt = input.incurredAt ?? report.closedAt ?? report.reportedAt;
  const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(0);

  await prisma.expense.upsert({
    where: { damageReportId: id },
    create: {
      damageReportId: id,
      buildingId: report.lease.room.buildingId,
      roomId: report.lease.room.id,
      category: "repair",
      // Produced by an operation rather than typed on a blank form, exactly as
      // vacancy electricity is.
      origin: "system",
      description: input.description?.trim() || `Sửa chữa: ${report.description.slice(0, 120)}`,
      incurredAt,
      amount,
    },
    // Only what the owner restated. The room and the building come from the
    // report and cannot move; re-deriving them on every correction would let a
    // re-homed report rewrite history.
    update: {
      amount,
      incurredAt,
      ...(input.description === undefined ? {} : { description: input.description.trim() }),
    },
  });

  return getReportById(id, scope);
}

/**
 * Un-prices a repair.
 *
 * Deletes the expense rather than zeroing it: nobody having said is a
 * different fact from a repair that cost nothing, and a zero row would report
 * the second while meaning the first.
 */
export async function removeRepairCost(id: number, scope: BuildingScope) {
  await getReportById(id, scope);
  await prisma.expense.deleteMany({ where: { damageReportId: id } });
  return getReportById(id, scope);
}

export async function closeReport(
  id: number,
  input: CloseReportInput,
  scope: BuildingScope,
  byUserId: number,
) {
  const existing = await getReportById(id, scope);
  assertOpen(existing.state);

  await prisma.damageReport.update({
    where: { id },
    data: {
      state: "done",
      closedAt: new Date(),
      closingNote: input.note,
      closedById: byUserId,
    },
  });

  return getReportById(id, scope);
}
