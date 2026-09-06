import { z } from "zod";

/** A year-month, accepted as "YYYY-MM". */
const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be in YYYY-MM form")
  .transform((value) => {
    const [year, month] = value.split("-").map(Number);
    return { year: year as number, month: month as number };
  });

export const revenueReportQuerySchema = z
  .object({
    from: yearMonth,
    to: yearMonth,
    // Repeatable (?buildingIds=1&buildingIds=2) or comma-separated.
    buildingIds: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((value) => {
        if (value === undefined) return undefined;
        const parts = (Array.isArray(value) ? value : [value])
          .flatMap((v) => v.split(","))
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        return parts.map(Number);
      })
      .refine(
        (ids) => ids === undefined || ids.every((id) => Number.isInteger(id) && id > 0),
        "buildingIds must be positive integers",
      ),
    /**
     * Whether to report the rooms behind each month's figures.
     *
     * Off by default, and asked for rather than imposed: a report over twelve
     * months and several buildings carries a few dozen figures, and the same
     * report with every room carries thousands. A caller that wants totals
     * should not pay to transfer, parse and discard a room list, and a screen
     * that opens with totals should not wait on one.
     *
     * A separate endpoint was the alternative. It would repeat this whole
     * range-and-building surface, the two would drift, and a caller wanting
     * both would make two requests that could disagree if an invoice were
     * issued between them.
     */
    detail: z
      .enum(["rooms"])
      .optional()
      .transform((value) => value === "rooms"),
  })
  .refine(
    (q) => q.from.year * 12 + q.from.month <= q.to.year * 12 + q.to.month,
    { message: "from must not be after to", path: ["from"] },
  );

export type RevenueReportQuery = z.infer<typeof revenueReportQuerySchema>;
