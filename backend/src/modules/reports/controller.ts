import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { revenueReportQuerySchema } from "./schema.js";
import { buildRevenueReport } from "./service.js";

export async function revenueReportHandler(req: Request, res: Response) {
  const parsed = revenueReportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid report parameters", parsed.error.flatten());
  }

  // Deliberately not the shared paginated envelope: a report is one computed
  // aggregate, not a page of records.
  const report = await buildRevenueReport(parsed.data);
  res.status(200).json(report);
}
