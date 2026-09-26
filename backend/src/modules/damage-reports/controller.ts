import type { Request, Response } from "express";

import { UnauthorizedError, ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { scopeOf } from "@/middleware/staff-scope.js";
import {
  closeReportSchema,
  listReportsQuerySchema,
  scheduleReportSchema,
} from "./schema.js";
import * as notices from "./notices.js";
import * as reportService from "./service.js";

function actingUserId(req: Request): number {
  const id = req.user?.userId;
  if (id === undefined) {
    throw new UnauthorizedError("NOT_AUTHENTICATED", "Not authenticated");
  }
  return id;
}

export async function listReportsHandler(req: Request, res: Response) {
  const parsed = listReportsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }
  res.status(200).json(await reportService.listReports(parsed.data, scopeOf(req)));
}

export async function getReportHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.damageReport);
  res.status(200).json(await reportService.getReportById(id, scopeOf(req)));
}

export async function scheduleReportHandler(req: Request, res: Response) {
  const parsed = scheduleReportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "REPORT_SCHEDULE_INVALID",
      "Invalid appointment",
      parsed.error.flatten(),
    );
  }
  const id = parseIdParam(req.params.id, RESOURCE.damageReport);
  res
    .status(200)
    .json(await reportService.scheduleReport(id, parsed.data, scopeOf(req), actingUserId(req)));
}

export async function closeReportHandler(req: Request, res: Response) {
  const parsed = closeReportSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("REPORT_CLOSE_INVALID", "Invalid closing note", parsed.error.flatten());
  }
  const id = parseIdParam(req.params.id, RESOURCE.damageReport);
  res
    .status(200)
    .json(await reportService.closeReport(id, parsed.data, scopeOf(req), actingUserId(req)));
}

/** A photograph on a report, for staff looking at it. */
export async function reportPhotoDownloadHandler(req: Request, res: Response) {
  const id = parseIdParam(req.params.id, RESOURCE.damageReport);
  // Establishes the caller may see this report at all before signing anything.
  await reportService.getReportById(id, scopeOf(req));
  const photoId = parseIdParam(req.params.photoId, RESOURCE.reportPhoto);
  res.status(200).json(await reportService.photoDownload(id, photoId));
}

/* --- notices: what happened while this account was away --- */

export async function unreadNoticeCountHandler(req: Request, res: Response) {
  res.status(200).json({ unread: await notices.unreadCount(actingUserId(req)) });
}

export async function listNoticesHandler(req: Request, res: Response) {
  // A bell list, not an archive: enough to answer "what did I miss".
  res.status(200).json({ data: await notices.listNotices(actingUserId(req), 30) });
}

export async function markNoticesReadHandler(req: Request, res: Response) {
  res.status(200).json(await notices.markAllRead(actingUserId(req)));
}
