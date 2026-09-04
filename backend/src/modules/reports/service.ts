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

export interface MonthFigures {
  year: number;
  month: number;
  billed: Dec;
  settled: Dec;
  outstanding: Dec;
  expenses: Dec;
  netBilled: Dec;
  netSettled: Dec;
  // Money that actually ARRIVED in the month, keyed on the payments' own
  // dates rather than on the month an invoice was issued. The only figure here
  // that answers a cash question; every other one is an accrual.
  received: Dec;
}

export type CategoryBreakdown = Record<ExpenseCategory, Dec>;
export type ChargeBreakdown = Record<ChargeCategory, Dec>;

export interface Totals extends Omit<MonthFigures, "year" | "month"> {
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
      lease: { select: { room: { select: { buildingId: true } } } },
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
  const categoryByBuilding = new Map<number, CategoryBreakdown>();
  const chargesByBuilding = new Map<number, ChargeBreakdown>();

  const add = (m: Map<string, Dec>, k: string, v: Dec) =>
    m.set(k, (m.get(k) ?? ZERO()).add(v));

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
    add(expenseTotal, key(exp.buildingId, year, month), exp.amount);

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

type Sums = Omit<MonthFigures, "year" | "month">;

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
