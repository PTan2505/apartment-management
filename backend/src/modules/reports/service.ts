import { prisma } from "@/lib/prisma.js";
import { NotFoundError } from "@/lib/errors.js";
import { Prisma } from "@/generated/prisma/client.js";
import type { RevenueReportQuery } from "./schema.js";

const Decimal = Prisma.Decimal;
type Dec = Prisma.Decimal;

const ZERO = () => new Decimal(0);

const EXPENSE_CATEGORIES = [
  "vacancy_electricity",
  "cleaning",
  "repair",
  "other",
] as const;
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// The kinds of charge an owner decides on. Mirrors EXPENSE_CATEGORIES
// deliberately: what is charged as `damage` is what is paid out as `repair`, and
// an owner comparing the two is asking whether they recovered what it cost.
const CHARGE_CATEGORIES = ["damage", "cleaning", "lost_item", "penalty", "other"] as const;
type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];

/**
 * One room beneath a month's figures.
 *
 * Produced from the SAME grouping that produces the month totals, one level
 * finer — never a second query written to look similar. A second query passes
 * the "detail sums to the total" check only by accident, and stops passing it
 * the moment a lease has two invoices in a month, or one is voided, or an
 * ad-hoc charge is issued mid-month. This database has all three.
 *
 * `received` is deliberately absent. It is keyed on the day money arrived,
 * while everything here is keyed on the month an invoice was issued; a cash
 * figure inside an accrual row reproduces, at a finer grain and where it is
 * harder to see, exactly the confusion the report is built to prevent.
 */
export interface RoomFigures {
  roomId: number;
  roomCode: string;
  leaseId: number | null;
  /** Absent where the tenancy has nobody recorded — a real state, not a gap. */
  tenantName: string | null;
  billed: Dec;
  settled: Dec;
  outstanding: Dec;
}

/**
 * How many things a figure counts.
 *
 * A sum with no count behind it cannot be sanity-checked. An owner who knows
 * twenty-eight rooms are let, and reads a figure covering twenty-two, has
 * learned something the figure alone does not say.
 *
 * `rooms` counts the rooms the figures COVER — tenanted in that month — which
 * is smaller than the rooms in the building.
 */
export interface Counts {
  /** Rooms let in this month, whether or not anything was billed for them. */
  rooms: number;
  /** Billed, and owing nothing. */
  roomsSettled: number;
  /** Billed, and owing something. */
  roomsOutstanding: number;
  /**
   * Let, and billed nothing this month.
   *
   * Its own count rather than folded into `roomsSettled`. A room nobody has
   * invoiced owes nothing, so the arithmetic would work — and it would report
   * a building where five rooms were never billed as having collected from
   * them, which is the opposite of what the owner needs to notice.
   *
   * The three sum to `rooms`.
   */
  roomsUnbilled: number;
  expenseRecords: number;
}

export interface MonthFigures {
  year: number;
  month: number;
  billed: Dec;
  settled: Dec;
  outstanding: Dec;
  expenses: Dec;
  netBilled: Dec;
  netSettled: Dec;
  counts: Counts;
  /** Present only when the caller asked for room detail. */
  rooms?: RoomFigures[];
  // Money that actually ARRIVED in the month, keyed on the payments' own
  // dates rather than on the month an invoice was issued. The only figure here
  // that answers a cash question; every other one is an accrual.
  received: Dec;
}

export type CategoryBreakdown = Record<ExpenseCategory, Dec>;
export type ChargeBreakdown = Record<ChargeCategory, Dec>;

export interface Totals extends Omit<MonthFigures, "year" | "month" | "counts" | "rooms"> {
  expensesByCategory: CategoryBreakdown;
  // A partition of `billed`, not an addition to it. An ad-hoc charge appears in
  // both, once — reporting it as a separate total would invite anyone summing
  // the top-level figures to count it twice.
  chargesByCategory: ChargeBreakdown;
}

export interface BuildingReport {
  buildingId: number;
  displayName: string;
  months: MonthFigures[];
  total: Totals;
}

export interface RevenueReport {
  range: { from: string; to: string };
  buildings: BuildingReport[];
  total: Totals;
}

/**
 * The months of the range are enumerated up front and figures placed into them.
 * Deriving the grid from whatever rows came back would omit exactly the empty
 * months a caller most needs to see as zero.
 */
function monthGrid(q: RevenueReportQuery): { year: number; month: number }[] {
  const grid: { year: number; month: number }[] = [];
  let { year, month } = q.from;

  while (year * 12 + month <= q.to.year * 12 + q.to.month) {
    grid.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return grid;
}

const key = (buildingId: number, year: number, month: number) =>
  `${buildingId}:${year}:${month}`;

function emptyCategories(): CategoryBreakdown {
  return Object.fromEntries(
    EXPENSE_CATEGORIES.map((c) => [c, ZERO()]),
  ) as CategoryBreakdown;
}

// Every category, always, even those with nothing charged. The shape of the
// response must not depend on the data in it.
function emptyCharges(): ChargeBreakdown {
  return Object.fromEntries(CHARGE_CATEGORIES.map((c) => [c, ZERO()])) as ChargeBreakdown;
}

export async function buildRevenueReport(q: RevenueReportQuery): Promise<RevenueReport> {
  // Named buildings, or every building — retired included, since a retired
  // building's historical earnings remain part of the record.
  const buildings = await prisma.building.findMany({
    where: q.buildingIds ? { id: { in: q.buildingIds } } : {},
    select: { id: true, displayName: true },
    orderBy: { id: "asc" },
  });

  if (q.buildingIds) {
    const found = new Set(buildings.map((b) => b.id));
    const missing = q.buildingIds.filter((id) => !found.has(id));
    if (missing.length > 0) {
      throw new NotFoundError(
        "BUILDING_NOT_FOUND",
        `Building not found: ${missing.join(", ")}`,
      );
    }
  }

  const grid = monthGrid(q);
  const buildingIds = buildings.map((b) => b.id);

  const rangeStart = new Date(Date.UTC(q.from.year, q.from.month - 1, 1));
  const rangeEnd = new Date(Date.UTC(q.to.year, q.to.month, 0, 23, 59, 59, 999));

  // Invoices reach a building only through lease -> room, and are attributed to
  // the month they were ISSUED rather than the date they were paid. Voided
  // invoices are excluded everywhere.
  //
  // Issued rather than covered, because not every invoice covers a month: a
  // move-in invoice charges a deposit and rent and has no month of metered
  // occupancy at all. Issuing is the one thing every invoice has. It also
  // answers what an owner actually asks — what did I bill out in March — for a
  // bill settling February's utilities beside March's rent, which belongs
  // wholly to neither.
  /**
   * The tenancies that occupied a room at any point in the range.
   *
   * A SECOND query, and a deliberate one: it answers a different question from
   * the invoices — which rooms were let — rather than recomputing a figure the
   * invoices already carry. Without it a room tenanted all month with nothing
   * billed simply vanishes from the detail, and the room count reports fewer
   * rooms let than there were.
   *
   * An absence reads as data that failed to load, which is the same reason an
   * empty month is reported as zero rather than omitted.
   */
  const tenancies = await prisma.lease.findMany({
    where: {
      cancelledAt: null,
      startDate: { lte: rangeEnd },
      OR: [{ moveOutDate: null }, { moveOutDate: { gt: rangeStart } }],
      ...(buildingIds.length > 0 ? { room: { buildingId: { in: buildingIds } } } : {}),
    },
    select: {
      id: true,
      startDate: true,
      moveOutDate: true,
      room: { select: { id: true, roomCode: true, buildingId: true } },
      occupants: {
        where: { isPrimary: true, leftAt: null },
        select: { user: { select: { fullName: true } } },
        take: 1,
      },
    },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      voidedAt: null,
      issueDate: { gte: rangeStart, lte: rangeEnd },
      ...(buildingIds.length > 0
        ? { lease: { room: { buildingId: { in: buildingIds } } } }
        : {}),
    },
    select: {
      issueDate: true,
      paymentStatus: true,
      // Summed from the charges rather than read from totalAmount: an invoice
      // charging a deposit alongside rent has a total larger than the revenue
      // it represents. totalAmount stays what the tenant owes, which is a real
      // and different question.
      lineItems: { select: { kind: true, amount: true, chargeCategory: true } },
      /*
        The room and the tenancy come from THIS query, so the room rows and the
        month totals are the same grouping at two grains rather than two
        queries that have to be kept agreeing.
      */
      lease: {
        select: {
          id: true,
          room: { select: { id: true, roomCode: true, buildingId: true } },
          occupants: {
            where: { isPrimary: true, leftAt: null },
            select: { user: { select: { fullName: true } } },
            take: 1,
          },
        },
      },
    },
  });

  // Money that actually moved, which no other query here asks about. Every
  // other figure is keyed on the month an invoice was ISSUED; this one is keyed
  // on the dates of the payments themselves, because that is the question it
  // exists to answer.
  //
  // Reversed payments are fetched too: one taken in March and returned in April
  // happened in both months, and the figure reports it in both — added where it
  // arrived, subtracted where it left.
  //
  // ONLY these two states. The division that matters is not finished against
  // unfinished but whether money ever moved, and `succeeded` and `reversed` are
  // the only two on that side of it. A payment a tenant started and abandoned,
  // one they cancelled, and one that expired brought in nothing.
  //
  // Until the gateway existed every payment on record had happened, so this
  // held without being written. It does not hold on its own any more.
  const payments = await prisma.payment.findMany({
    where: {
      state: { in: ["succeeded", "reversed"] },
      invoice: {
        voidedAt: null,
        ...(buildingIds.length > 0
          ? { lease: { room: { buildingId: { in: buildingIds } } } }
          : {}),
      },
      OR: [
        { paidAt: { gte: rangeStart, lte: rangeEnd } },
        { reversedAt: { gte: rangeStart, lte: rangeEnd } },
      ],
    },
    select: {
      paidAt: true,
      reversedAt: true,
      state: true,
      invoice: {
        select: {
          // Summed from the charges rather than from the payment's amount: a
          // payment settling a move-in invoice hands over the deposit too, and
          // a deposit is held rather than earned.
          lineItems: { select: { kind: true, amount: true } },
          lease: { select: { room: { select: { buildingId: true } } } },
        },
      },
    },
  });

  const expenses = await prisma.expense.findMany({
    where: {
      incurredAt: { gte: rangeStart, lte: rangeEnd },
      ...(buildingIds.length > 0 ? { buildingId: { in: buildingIds } } : {}),
    },
    select: { buildingId: true, incurredAt: true, amount: true, category: true },
  });

  // --- fold both sides into per building-month buckets ---
  const billed = new Map<string, Dec>();
  const settled = new Map<string, Dec>();
  const received = new Map<string, Dec>();
  const outstanding = new Map<string, Dec>();
  const expenseTotal = new Map<string, Dec>();
  const expenseCount = new Map<string, number>();
  const categoryByBuilding = new Map<number, CategoryBreakdown>();
  const chargesByBuilding = new Map<number, ChargeBreakdown>();

  const add = (m: Map<string, Dec>, k: string, v: Dec) =>
    m.set(k, (m.get(k) ?? ZERO()).add(v));

  /**
   * Rooms beneath each month, accumulated in the SAME pass as the totals.
   *
   * Keyed `building|year|month|roomId` so a room with two invoices in one month
   * lands in one row — which is the case a separate query gets wrong while
   * looking right.
   */
  const roomRows = new Map<string, RoomFigures & { buildingKey: string }>();
  const roomKey = (k: string, roomId: number) => `${k}|${roomId}`;

  for (const inv of invoices) {
    const k = key(
      inv.lease.room.buildingId,
      inv.issueDate.getUTCFullYear(),
      inv.issueDate.getUTCMonth() + 1,
    );
    // A deposit is money held on a tenant's behalf, not earned. Counting it
    // would inflate the month a tenant arrives and leave a hole when it is
    // returned — reporting an owner as having earned money they may owe back.
    // A charge the owner named IS revenue and needs no exception here — it is
    // included by being anything other than a deposit. Stated so the next
    // person adding a line kind sees which side of the line it falls on.
    const revenue = inv.lineItems.reduce(
      (running, line) => (line.kind === "deposit" ? running : running.add(line.amount)),
      ZERO(),
    );
    add(billed, k, revenue);

    // The breakdown of what was charged by hand, taken from the same lines that
    // built `billed` above. A partition of that figure rather than an addition
    // to it, so summing the report's top-level numbers cannot double count.
    for (const line of inv.lineItems) {
      if (line.kind !== "charge" || line.chargeCategory === null) {
        continue;
      }
      const buildingId = inv.lease.room.buildingId;
      const charges = chargesByBuilding.get(buildingId) ?? emptyCharges();
      const category = line.chargeCategory as ChargeCategory;
      charges[category] = charges[category].add(line.amount);
      chargesByBuilding.set(buildingId, charges);
    }
    // Payment is atomic, so an invoice falls wholly into one bucket. Summing
    // outstanding directly rather than subtracting means the two can disagree
    // if the data is wrong — which is the point.
    if (inv.paymentStatus === "paid") {
      add(settled, k, revenue);
    } else {
      add(outstanding, k, revenue);
    }

    // The same invoice, the same `revenue`, one level finer. Because it is the
    // same value rather than a recomputation, the rooms cannot fail to sum to
    // the month above them.
    const rk = roomKey(k, inv.lease.room.id);
    const row =
      roomRows.get(rk) ??
      {
        buildingKey: k,
        roomId: inv.lease.room.id,
        roomCode: inv.lease.room.roomCode,
        leaseId: inv.lease.id,
        // Absent where the tenancy has nobody recorded — which happens when the
        // last occupant left before a move-out was entered, and is a state of
        // the record rather than a value to substitute.
        tenantName: inv.lease.occupants[0]?.user.fullName ?? null,
        billed: ZERO(),
        settled: ZERO(),
        outstanding: ZERO(),
      };
    row.billed = row.billed.add(revenue);
    if (inv.paymentStatus === "paid") row.settled = row.settled.add(revenue);
    else row.outstanding = row.outstanding.add(revenue);
    roomRows.set(rk, row);
  }

  /*
    Every room that was let in a month, seeded at zero before the invoices are
    added on top. A room billed nothing that month keeps its zero row; one that
    was billed has its figures accumulated into the row already here.

    Seeded per month of the grid rather than once, because occupancy is a fact
    about a month: a tenancy starting in July is not a let room in May.
  */
  for (const lease of tenancies) {
    for (const g of grid) {
      const monthStart = new Date(Date.UTC(g.year, g.month - 1, 1));
      const monthEnd = new Date(Date.UTC(g.year, g.month, 0, 23, 59, 59, 999));
      const occupied =
        lease.startDate <= monthEnd &&
        (lease.moveOutDate === null || lease.moveOutDate > monthStart);
      if (!occupied) continue;

      const k = key(lease.room.buildingId, g.year, g.month);
      const rk = roomKey(k, lease.room.id);
      if (roomRows.has(rk)) continue;
      roomRows.set(rk, {
        buildingKey: k,
        roomId: lease.room.id,
        roomCode: lease.room.roomCode,
        leaseId: lease.id,
        tenantName: lease.occupants[0]?.user.fullName ?? null,
        billed: ZERO(),
        settled: ZERO(),
        outstanding: ZERO(),
      });
    }
  }

  const inRange = (date: Date) => date >= rangeStart && date <= rangeEnd;

  for (const payment of payments) {
    const buildingId = payment.invoice.lease.room.buildingId;
    const revenue = payment.invoice.lineItems.reduce(
      (running, line) => (line.kind === "deposit" ? running : running.add(line.amount)),
      ZERO(),
    );

    // Non-null for both states fetched above — a payment that succeeded, and
    // one that succeeded and was then given back, each have a moment the money
    // arrived. Guarded rather than asserted so that adding a state to the query
    // above cannot silently start counting one that has no such moment.
    if (payment.paidAt !== null && inRange(payment.paidAt)) {
      add(
        received,
        key(buildingId, payment.paidAt.getUTCFullYear(), payment.paidAt.getUTCMonth() + 1),
        revenue,
      );
    }

    // The money left again. Subtracted from the month it left rather than
    // removed from the month it arrived: reporting only the first would claim
    // income the owner no longer has, and removing it would lose the fact that
    // it ever came in.
    if (payment.state === "reversed" && payment.reversedAt !== null && inRange(payment.reversedAt)) {
      add(
        received,
        key(buildingId, payment.reversedAt.getUTCFullYear(), payment.reversedAt.getUTCMonth() + 1),
        revenue.negated(),
      );
    }
  }

  for (const exp of expenses) {
    const year = exp.incurredAt.getUTCFullYear();
    const month = exp.incurredAt.getUTCMonth() + 1;
    const ek = key(exp.buildingId, year, month);
    add(expenseTotal, ek, exp.amount);
    // How many records the total is made of, counted from the same rows.
    expenseCount.set(ek, (expenseCount.get(ek) ?? 0) + 1);

    const cats = categoryByBuilding.get(exp.buildingId) ?? emptyCategories();
    cats[exp.category as ExpenseCategory] = cats[exp.category as ExpenseCategory].add(
      exp.amount,
    );
    categoryByBuilding.set(exp.buildingId, cats);
  }

  // --- assemble against the grid ---
  const grandCategories = emptyCategories();
  const grandCharges = emptyCharges();
  let grand = blankTotals();

  const buildingReports: BuildingReport[] = buildings.map((b) => {
    let runningTotal = blankTotals();

    const months: MonthFigures[] = grid.map((g) => {
      const k = key(b.id, g.year, g.month);
      const mBilled = billed.get(k) ?? ZERO();
      const mSettled = settled.get(k) ?? ZERO();
      const mReceived = received.get(k) ?? ZERO();
      const mOutstanding = outstanding.get(k) ?? ZERO();
      const mExpenses = expenseTotal.get(k) ?? ZERO();

      // The rooms of this month, from the same pass that produced the sums
      // above. Sorted by code so a reader comparing two months reads the same
      // order twice.
      const rooms = [...roomRows.values()]
        .filter((r) => r.buildingKey === k)
        .sort((x, y) => x.roomCode.localeCompare(y.roomCode, "vi"));

      const figures: MonthFigures = {
        year: g.year,
        month: g.month,
        billed: mBilled,
        settled: mSettled,
        received: mReceived,
        outstanding: mOutstanding,
        expenses: mExpenses,
        // Negative when costs exceed income — a loss-making month is
        // information, not an error, so it is reported rather than clamped.
        netBilled: mBilled.sub(mExpenses),
        netSettled: mSettled.sub(mExpenses),
        // Counted off the same rows the sums came from. A separate COUNT over
        // its own WHERE is how a count and a total come to disagree.
        counts: {
          rooms: rooms.length,
          roomsSettled: rooms.filter((r) => !r.billed.isZero() && r.outstanding.isZero()).length,
          roomsOutstanding: rooms.filter((r) => !r.outstanding.isZero()).length,
          roomsUnbilled: rooms.filter((r) => r.billed.isZero()).length,
          expenseRecords: expenseCount.get(k) ?? 0,
        },
        // Only when asked for. Present as an absent key rather than an empty
        // array, so a caller cannot mistake "not requested" for "no rooms".
        ...(q.detail
          ? {
              rooms: rooms.map(({ buildingKey: _ignored, ...room }) => room),
            }
          : {}),
      };

      runningTotal = accumulate(runningTotal, figures);
      return figures;
    });

    const cats = categoryByBuilding.get(b.id) ?? emptyCategories();
    for (const c of EXPENSE_CATEGORIES) {
      grandCategories[c] = grandCategories[c].add(cats[c]);
    }

    const charges = chargesByBuilding.get(b.id) ?? emptyCharges();
    for (const c of CHARGE_CATEGORIES) {
      grandCharges[c] = grandCharges[c].add(charges[c]);
    }
    grand = accumulate(grand, runningTotal);

    return {
      buildingId: b.id,
      displayName: b.displayName,
      months,
      total: { ...runningTotal, expensesByCategory: cats, chargesByCategory: charges },
    };
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    range: {
      from: `${q.from.year}-${pad(q.from.month)}`,
      to: `${q.to.year}-${pad(q.to.month)}`,
    },
    buildings: buildingReports,
    total: { ...grand, expensesByCategory: grandCategories, chargesByCategory: grandCharges },
  };
}

/**
 * The figures that ADD UP across months. Counts and room rows do not.
 *
 * Summing `rooms` over a range would produce room-months while looking exactly
 * like a number of rooms: eight rooms billed for six months would report
 * forty-eight, and a reader would take that for the size of the building. The
 * counts stay where they are true, on the month.
 */
type Sums = Omit<MonthFigures, "year" | "month" | "counts" | "rooms">;

function blankTotals(): Sums {
  return {
    billed: ZERO(),
    settled: ZERO(),
    received: ZERO(),
    outstanding: ZERO(),
    expenses: ZERO(),
    netBilled: ZERO(),
    netSettled: ZERO(),
  };
}

function accumulate(into: Sums, from: Sums): Sums {
  return {
    billed: into.billed.add(from.billed),
    settled: into.settled.add(from.settled),
    received: into.received.add(from.received),
    outstanding: into.outstanding.add(from.outstanding),
    expenses: into.expenses.add(from.expenses),
    netBilled: into.netBilled.add(from.netBilled),
    netSettled: into.netSettled.add(from.netSettled),
  };
}
