import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import { mapPaginated, paginate, toSkipTake } from "@/lib/pagination.js";
import { withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import type {
  CreateVisitorInput,
  ListVisitorsQuery,
  UpdateVisitorInput,
  VisitorIdCardConfirmInput,
  VisitorIdCardUploadInput,
} from "./schema.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fourteen days is where a visit stops being a visit.
 *
 * A constant, not a setting. One owner, one sensible number; a setting would be
 * a screen, a migration and a default nobody ever changes. If a second owner
 * ever disagrees, that is when it becomes a column.
 */
export const OVERLONG_DAYS = 14;

/** Midnight UTC of the day a moment falls in. The project is UTC throughout. */
function startOfUtcDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

const visitorSelect = {
  id: true,
  leaseId: true,
  fullName: true,
  idCardNumber: true,
  dateOfBirth: true,
  sex: true,
  permanentAddress: true,
  relationToSignatory: true,
  phone: true,
  email: true,
  occupation: true,
  idCardFrontKey: true,
  idCardBackKey: true,
  arrivesOn: true,
  expectedUntil: true,
  note: true,
  addedByStaff: true,
  cancelledAt: true,
  createdAt: true,
  lease: {
    select: {
      id: true,
      room: {
        select: { id: true, roomCode: true, buildingId: true, building: { select: { id: true, displayName: true } } },
      },
    },
  },
} as const;

type VisitorRow = {
  arrivesOn: Date;
  expectedUntil: Date;
  cancelledAt: Date | null;
  idCardFrontKey: string | null;
  idCardBackKey: string | null;
  lease: {
    id: number;
    room: { id: number; roomCode: string; buildingId: number; building: { id: number; displayName: string } };
  };
};

export type VisitorState = "upcoming" | "staying" | "finished" | "cancelled";

/**
 * How long the stay has run, in days.
 *
 * ── Which end date, and why ─────────────────────────────────────────────────
 *
 * `expectedUntil` is the day the visitor is expected to LEAVE, and it is
 * EXCLUSIVE — the first day they are no longer there. That is the project's one
 * rule for ending dates (see invoices/billing.ts), and following it here means a
 * reader does not have to remember which fields count their own day.
 *
 * So a stay recorded as the 1st until the 15th is fourteen days, not fifteen,
 * and the fourteen-day threshold means "more than a fortnight" exactly.
 *
 * ── Which moment it is measured TO ──────────────────────────────────────────
 *
 * To TODAY for a stay still running, so an open-ended overstay grows every day
 * and keeps showing. To the recorded end for one that has finished, so a visit
 * that ran three weeks last year still reads as having been long without
 * appearing as something to deal with now. To the cancellation for one that was
 * called off, for the same reason.
 *
 * Clamped at zero: a stay that has not started yet has run no days, not a
 * negative number of them.
 */
function stayDays(visitor: VisitorRow, today: Date): number {
  const candidates = [today, visitor.expectedUntil];
  if (visitor.cancelledAt !== null) candidates.push(startOfUtcDay(visitor.cancelledAt));
  const end = Math.min(...candidates.map((date) => date.getTime()));
  const days = Math.floor((end - startOfUtcDay(visitor.arrivesOn).getTime()) / MS_PER_DAY);
  return days < 0 ? 0 : days;
}

function stateOf(visitor: VisitorRow, today: Date): VisitorState {
  if (visitor.cancelledAt !== null) return "cancelled";
  if (startOfUtcDay(visitor.arrivesOn).getTime() > today.getTime()) return "upcoming";
  // Exclusive, as above: on the recorded leaving day the stay is over.
  if (startOfUtcDay(visitor.expectedUntil).getTime() <= today.getTime()) return "finished";
  return "staying";
}

/**
 * What a registration looks like to everybody who reads one.
 *
 * The derived fields are computed here rather than stored, because every one of
 * them changes with the date and a stored copy would be wrong by tomorrow.
 *
 * `needsAttention` is the distinction the screens turn on: `isOverlong` says
 * this stay HAS run too long, which stays true forever once it happens, while
 * `needsAttention` says it is still running and therefore still the owner's
 * problem. Reporting only the first would put a permanent badge on a visit that
 * ended last year.
 */
function toVisitor<T extends VisitorRow>({ lease, ...visitor }: T, today: Date) {
  const days = stayDays({ ...visitor, lease } as unknown as VisitorRow, today);
  const state = stateOf({ ...visitor, lease } as unknown as VisitorRow, today);
  const isOverlong = days > OVERLONG_DAYS;
  return {
    ...visitor,
    // The keys never leave the API. A caller gets whether a side is on file and
    // asks for a signed link when it wants to look.
    idCardFrontKey: undefined,
    idCardBackKey: undefined,
    hasIdCardFront: visitor.idCardFrontKey !== null,
    hasIdCardBack: visitor.idCardBackKey !== null,
    leaseId: lease.id,
    room: { id: lease.room.id, roomCode: lease.room.roomCode },
    building: lease.room.building,
    state,
    stayDays: days,
    isOverlong,
    needsAttention: isOverlong && state === "staying",
    overlongAfterDays: OVERLONG_DAYS,
  };
}

/* ------------------------------------------------------------------ */
/* Loading one, within whatever reach the caller has                   */
/* ------------------------------------------------------------------ */

/**
 * A registration, or NOT FOUND.
 *
 * `scope` is a staff member's buildings; `leaseId` is a portal token's tenancy.
 * Both narrow to 404 rather than 403, because telling somebody a record exists
 * but is not theirs is itself an answer they were not entitled to.
 */
async function loadVisitor(
  id: number,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  const visitor = await prisma.leaseVisitor.findUnique({ where: { id }, select: visitorSelect });
  const reachable =
    visitor !== null &&
    ("leaseId" in by
      ? visitor.lease.id === by.leaseId
      : withinScope(by.scope, visitor.lease.room.buildingId));
  if (!reachable) {
    throw new NotFoundError("VISITOR_NOT_FOUND", "Không tìm thấy đăng ký khách này");
  }
  return visitor;
}

/* ------------------------------------------------------------------ */
/* Writing                                                            */
/* ------------------------------------------------------------------ */

/**
 * Registers somebody staying on a tenancy.
 *
 * Changes NO money: not the occupant count, not the water charge, not any
 * per-person service fee. This is a log of who is present, and the three
 * populations it sits beside — the signatory, the listed occupants, and the
 * occupant COUNT water is billed on — are deliberately separate. If a later
 * change makes this touch billing, it is a different feature wearing this one's
 * name.
 *
 * Accepted on a tenancy that has ended, for the same reason a damage report is:
 * somebody filing paperwork after the fact is still filing paperwork.
 */
export async function createVisitor(
  leaseId: number,
  input: CreateVisitorInput,
  addedByStaff: boolean,
) {
  const lease = await prisma.lease.findUnique({ where: { id: leaseId }, select: { id: true } });
  if (lease === null) {
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }

  const created = await prisma.leaseVisitor.create({
    data: { ...input, leaseId, addedByStaff },
    select: visitorSelect,
  });
  return toVisitor(created, startOfUtcDay(new Date()));
}

/**
 * Corrects a registration, while there is still something to correct.
 *
 * Refused once the stay has finished or been called off. A finished stay is a
 * record of what happened, and the reason to edit one is almost always that
 * somebody wants to reuse the row for a different visit — which is a new
 * registration, with its own dates.
 */
export async function updateVisitor(
  id: number,
  input: UpdateVisitorInput,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  const visitor = await loadVisitor(id, by);
  const today = startOfUtcDay(new Date());
  const state = stateOf(visitor, today);

  if (state === "cancelled") {
    throw new ConflictError("VISITOR_CANCELLED", "Đăng ký này đã bị huỷ");
  }
  if (state === "finished") {
    throw new ConflictError("VISITOR_STAY_FINISHED", "Lần ở này đã kết thúc, không sửa được nữa");
  }

  // Both dates have to be checked against whichever one is NOT changing, which
  // only the record knows — so the schema refines them when both arrive and
  // this refines them against what is stored.
  const arrivesOn = input.arrivesOn ?? visitor.arrivesOn;
  const expectedUntil = input.expectedUntil ?? visitor.expectedUntil;
  if (expectedUntil.getTime() < arrivesOn.getTime()) {
    throw new ValidationError(
      "VISITOR_DATES_INVALID",
      "Ngày dự kiến đi phải sau ngày đến",
    );
  }

  const updated = await prisma.leaseVisitor.update({
    where: { id },
    data: input,
    select: visitorSelect,
  });
  return toVisitor(updated, today);
}

/**
 * Calls off a registration.
 *
 * Dated rather than deleted. "This visit is not happening" and "nobody ever
 * said anything" are different facts, and only one of them is worth keeping —
 * the tenant who filed it can see what became of it.
 */
export async function cancelVisitor(
  id: number,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  const visitor = await loadVisitor(id, by);
  if (visitor.cancelledAt !== null) {
    throw new ConflictError("VISITOR_CANCELLED", "Đăng ký này đã bị huỷ");
  }

  const updated = await prisma.leaseVisitor.update({
    where: { id },
    data: { cancelledAt: new Date() },
    select: visitorSelect,
  });
  return toVisitor(updated, startOfUtcDay(new Date()));
}

/* ------------------------------------------------------------------ */
/* Reading                                                            */
/* ------------------------------------------------------------------ */

/** A tenancy's registrations, newest arrival first. Finished stays included. */
export async function listVisitorsForLease(leaseId: number) {
  const rows = await prisma.leaseVisitor.findMany({
    where: { leaseId },
    select: visitorSelect,
    orderBy: [{ arrivesOn: "desc" }, { id: "desc" }],
  });
  const today = startOfUtcDay(new Date());
  return rows.map((row) => toVisitor(row, today));
}

export async function getVisitorById(
  id: number,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  const visitor = await loadVisitor(id, by);
  return toVisitor(visitor, startOfUtcDay(new Date()));
}

/**
 * Registrations across the buildings the caller covers.
 *
 * ── A note on the `overlong` filter ─────────────────────────────────────────
 *
 * It finds the OPEN question: stays still running that have already passed the
 * threshold. That is narrower than the `isOverlong` flag each row carries,
 * which stays true for a long visit that ended months ago.
 *
 * The difference is deliberate and is the useful one — the owner filtering this
 * list is asking "who do I need to deal with", not "who has ever stayed a while"
 * — and it is also the only version expressible as a query, since comparing two
 * columns' difference against a number is not something this ORM will do.
 */
export async function listVisitors(query: ListVisitorsQuery, scope: BuildingScope) {
  const today = startOfUtcDay(new Date());
  const thresholdArrival = new Date(today.getTime() - OVERLONG_DAYS * MS_PER_DAY);

  /*
    Every filter goes into ONE `AND` array.

    Two object spreads carrying the same key silently overwrite each other, and
    the key that loses is the scope filter — which is how a staff account comes
    to read another building's records. TypeScript catches a duplicate `AND`
    property; it cannot catch two spreads both producing `lease`.
  */
  const conditions = [];

  if (scope !== null) {
    conditions.push({ lease: { room: { buildingId: { in: scope } } } });
  }
  if (query.buildingId !== undefined) {
    conditions.push({ lease: { room: { buildingId: query.buildingId } } });
  }
  if (query.leaseId !== undefined) {
    conditions.push({ leaseId: query.leaseId });
  }

  if (query.state === "cancelled") {
    conditions.push({ cancelledAt: { not: null } });
  } else if (query.state === "upcoming") {
    conditions.push({ cancelledAt: null, arrivesOn: { gt: today } });
  } else if (query.state === "staying") {
    conditions.push({ cancelledAt: null, arrivesOn: { lte: today }, expectedUntil: { gt: today } });
  } else if (query.state === "finished") {
    conditions.push({ cancelledAt: null, expectedUntil: { lte: today } });
  }

  if (query.overlong === true) {
    conditions.push({
      cancelledAt: null,
      arrivesOn: { lte: thresholdArrival },
      expectedUntil: { gt: today },
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const page = await paginate(
    query,
    prisma.leaseVisitor.findMany({
      where,
      select: visitorSelect,
      orderBy: [{ arrivesOn: "desc" }, { id: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.leaseVisitor.count({ where }),
  );

  return mapPaginated(page, (row) => toVisitor(row, today));
}

/* ------------------------------------------------------------------ */
/* The identity document                                              */
/* ------------------------------------------------------------------ */

function assertStorage() {
  if (!storage.isConfigured()) {
    throw new ValidationError(
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured on this server",
    );
  }
}

/**
 * Where ONE SIDE of a visitor's document lives.
 *
 * Under the visitor rather than the customer prefix, because this person is not
 * a customer and never will be in the common case. Scoped to the side so
 * replacing a front does not disturb a back.
 */
function visitorIdCardPrefix(visitorId: number, side: "front" | "back"): string {
  return `visitors/${visitorId}/id-card/${side}/`;
}

export async function signIdCardUpload(
  id: number,
  input: VisitorIdCardUploadInput,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  assertStorage();
  await loadVisitor(id, by);
  return storage.signIdCardUploadAt(
    visitorIdCardPrefix(id, input.side),
    input.contentType,
  );
}

/**
 * Records that a side arrived.
 *
 * The object is CONFIRMED rather than trusted: a presigned PUT cannot be bound
 * to a size, and a caller could otherwise point this at any object in the
 * bucket. Described by key — never by listing the prefix, which lags a write by
 * a second or two and would report the file just replaced.
 */
export async function confirmIdCard(
  id: number,
  input: VisitorIdCardConfirmInput,
  by: { scope: BuildingScope } | { leaseId: number },
) {
  assertStorage();
  await loadVisitor(id, by);

  if (!input.key.startsWith(visitorIdCardPrefix(id, input.side))) {
    throw new ValidationError(
      "VISITOR_ID_CARD_KEY_FOREIGN",
      "File đó không thuộc về ảnh giấy tờ của khách này",
    );
  }

  const object = await storage.describeObject(input.key);
  if (object === null) {
    throw new ValidationError(
      "VISITOR_ID_CARD_OBJECT_MISSING",
      "File chưa có trong kho. Có thể tải lên chưa xong — thử lại",
    );
  }
  if (object.size > storage.MAX_ID_CARD_BYTES) {
    // Deleted, because an object nobody can reach through the application is an
    // object nobody will ever clear.
    await storage.deleteObject(input.key);
    throw new ValidationError(
      "VISITOR_ID_CARD_TOO_LARGE",
      `Ảnh lớn hơn giới hạn ${Math.round(storage.MAX_ID_CARD_BYTES / 1024 / 1024)} MB`,
    );
  }

  // Exactly one object per side is left behind: the picture being replaced goes,
  // and so does any upload that reached storage and was never confirmed.
  await storage
    .clearPrefixExcept(visitorIdCardPrefix(id, input.side), input.key)
    .catch(() => {});

  const updated = await prisma.leaseVisitor.update({
    where: { id },
    data: input.side === "front" ? { idCardFrontKey: input.key } : { idCardBackKey: input.key },
    select: visitorSelect,
  });
  return toVisitor(updated, startOfUtcDay(new Date()));
}

export async function idCardDownload(
  id: number,
  side: "front" | "back",
  by: { scope: BuildingScope } | { leaseId: number },
) {
  assertStorage();
  const visitor = await loadVisitor(id, by);
  const key = side === "front" ? visitor.idCardFrontKey : visitor.idCardBackKey;
  if (key === null) {
    throw new NotFoundError("VISITOR_ID_CARD_NONE", "Chưa có ảnh mặt này");
  }
  return storage.signDownload(key);
}
