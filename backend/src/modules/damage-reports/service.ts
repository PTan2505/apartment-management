import type { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import { withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import { announce, recipientsFor, writeNotices } from "./notices.js";
import type {
  CloseReportInput,
  CreateReportInput,
  ListReportsQuery,
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
