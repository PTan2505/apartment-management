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

export interface MonthFigures {
  year: number;
  month: number;
  billed: Dec;
  collected: Dec;
  outstanding: Dec;
  expenses: Dec;
  netBilled: Dec;
  netCollected: Dec;
}

export type CategoryBreakdown = Record<ExpenseCategory, Dec>;

export interface Totals extends Omit<MonthFigures, "year" | "month"> {
  expensesByCategory: CategoryBreakdown;
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
      throw new NotFoundError(`Building not found: ${missing.join(", ")}`);
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
      lineItems: { select: { kind: true, amount: true } },
      lease: { select: { room: { select: { buildingId: true } } } },
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
  const collected = new Map<string, Dec>();
  const outstanding = new Map<string, Dec>();
  const expenseTotal = new Map<string, Dec>();
  const categoryByBuilding = new Map<number, CategoryBreakdown>();

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
    const revenue = inv.lineItems.reduce(
      (running, line) => (line.kind === "deposit" ? running : running.add(line.amount)),
      ZERO(),
    );
    add(billed, k, revenue);
    // Payment is atomic, so an invoice falls wholly into one bucket. Summing
    // outstanding directly rather than subtracting means the two can disagree
    // if the data is wrong — which is the point.
    if (inv.paymentStatus === "paid") {
      add(collected, k, revenue);
    } else {
      add(outstanding, k, revenue);
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
  let grand = blankTotals();

  const buildingReports: BuildingReport[] = buildings.map((b) => {
    let runningTotal = blankTotals();

    const months: MonthFigures[] = grid.map((g) => {
      const k = key(b.id, g.year, g.month);
      const mBilled = billed.get(k) ?? ZERO();
      const mCollected = collected.get(k) ?? ZERO();
      const mOutstanding = outstanding.get(k) ?? ZERO();
      const mExpenses = expenseTotal.get(k) ?? ZERO();

      const figures: MonthFigures = {
        year: g.year,
        month: g.month,
        billed: mBilled,
        collected: mCollected,
        outstanding: mOutstanding,
        expenses: mExpenses,
        // Negative when costs exceed income — a loss-making month is
        // information, not an error, so it is reported rather than clamped.
        netBilled: mBilled.sub(mExpenses),
        netCollected: mCollected.sub(mExpenses),
      };

      runningTotal = accumulate(runningTotal, figures);
      return figures;
    });

    const cats = categoryByBuilding.get(b.id) ?? emptyCategories();
    for (const c of EXPENSE_CATEGORIES) {
      grandCategories[c] = grandCategories[c].add(cats[c]);
    }
    grand = accumulate(grand, runningTotal);

    return {
      buildingId: b.id,
      displayName: b.displayName,
      months,
      total: { ...runningTotal, expensesByCategory: cats },
    };
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    range: {
      from: `${q.from.year}-${pad(q.from.month)}`,
      to: `${q.to.year}-${pad(q.to.month)}`,
    },
    buildings: buildingReports,
    total: { ...grand, expensesByCategory: grandCategories },
  };
}

type Sums = Omit<MonthFigures, "year" | "month">;

function blankTotals(): Sums {
  return {
    billed: ZERO(),
    collected: ZERO(),
    outstanding: ZERO(),
    expenses: ZERO(),
    netBilled: ZERO(),
    netCollected: ZERO(),
  };
}

function accumulate(into: Sums, from: Sums): Sums {
  return {
    billed: into.billed.add(from.billed),
    collected: into.collected.add(from.collected),
    outstanding: into.outstanding.add(from.outstanding),
    expenses: into.expenses.add(from.expenses),
    netBilled: into.netBilled.add(from.netBilled),
    netCollected: into.netCollected.add(from.netCollected),
  };
}
