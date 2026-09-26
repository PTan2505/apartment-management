import { z } from "zod";

import { REPORT_PHOTO_CONTENT_TYPES } from "@/lib/storage.js";

/**
 * What a tenant sends. Nothing the link already answers: no room, no building,
 * no name — a page reached by somebody's own link that asks them who they are
 * is a page that does not know who it is talking to.
 */
export const createReportSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "description is required")
    .max(2000, "that description is too long"),
});

export const reportPhotoUploadSchema = z.object({
  contentType: z.enum(REPORT_PHOTO_CONTENT_TYPES),
});

export const reportPhotoConfirmSchema = z.object({
  key: z.string().min(1, "key is required"),
});

/** Staff agreeing a time with the tenant. The note is what was agreed. */
export const scheduleReportSchema = z.object({
  scheduledFor: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
});

export const closeReportSchema = z.object({
  note: z.string().trim().min(1, "say what was done").max(1000),
});

export const listReportsQuerySchema = z.object({
  state: z.enum(["new", "scheduled", "done"]).optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  /** Open means new or scheduled: everything not yet dealt with. */
  open: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ScheduleReportInput = z.infer<typeof scheduleReportSchema>;
export type CloseReportInput = z.infer<typeof closeReportSchema>;
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;
export type ReportPhotoUploadInput = z.infer<typeof reportPhotoUploadSchema>;
export type ReportPhotoConfirmInput = z.infer<typeof reportPhotoConfirmSchema>;
