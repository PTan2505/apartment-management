import type { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { z } from "zod";

/**
 * Deliberately small: a building with more than twenty rooms pages its list,
 * so clients exercise paging from the start rather than working by accident
 * until a collection outgrows the default. Callers wanting more can raise
 * pageSize up to MAX_PAGE_SIZE.
 */
export const DEFAULT_PAGE_SIZE = 20;

/** Upper bound so no caller can request an unbounded response. */
export const MAX_PAGE_SIZE = 200;

/**
 * Compose into each list endpoint's query schema. Zero, negative, non-numeric,
 * and above-maximum values fail parsing, which the controllers surface as a 400
 * — deliberately not clamped, since a silently truncated response is how
 * pagination bugs turn into missing-data bugs.
 */
export const paginationQueryFields = {
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
};

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageMeta extends PageParams {
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export function toSkipTake({ page, pageSize }: PageParams) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta(params: PageParams, total: number): PageMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / params.pageSize),
  };
}

/**
 * Runs the page query and the count query in one transaction so `meta.total`
 * cannot disagree with the rows returned — without it, a concurrent insert
 * between the two reads produces a total that does not match the page.
 */
export async function paginate<T>(
  params: PageParams,
  rowsQuery: Prisma.PrismaPromise<T[]>,
  countQuery: Prisma.PrismaPromise<number>,
): Promise<Paginated<T>> {
  const [data, total] = await prisma.$transaction([rowsQuery, countQuery]);
  return { data, meta: buildMeta(params, total) };
}

/** Re-shapes an already-paginated result, for endpoints that map their rows. */
export function mapPaginated<T, U>(
  page: Paginated<T>,
  fn: (item: T) => U,
): Paginated<U> {
  return { data: page.data.map(fn), meta: page.meta };
}
