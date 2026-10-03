import { z } from "zod";

import { RESIDENCE_FORM_CONTENT_TYPES } from "@/lib/storage.js";

export const residenceFormUploadSchema = z.object({
  fileName: z.string().trim().min(1, "fileName is required").max(200),
  /**
   * One accepted type, and the message says why rather than listing it.
   *
   * A PDF would upload cleanly, sit in storage looking correct, and fail at the
   * one moment the owner needed a filled form — because this file is opened and
   * written into, not merely handed back.
   */
  contentType: z.enum(RESIDENCE_FORM_CONTENT_TYPES, {
    message: "mẫu tờ khai phải là file Word .docx — bản .doc cũ không điền được",
  }),
});

export const residenceFormConfirmSchema = z.object({
  key: z.string().min(1, "key is required"),
});

/**
 * Which registrations go on one form.
 *
 * The FIRST is the declarant and the rest are the household members changing
 * with them — that is the form's own structure, and a family arriving together
 * is one filing rather than three. So the order matters, which is why this is a
 * list rather than a set.
 *
 * Arrives as a repeated or comma-separated query parameter, because the filled
 * document is fetched as a download rather than posted for.
 */
export const residenceFilingQuerySchema = z.object({
  visitorIds: z
    .union([z.string(), z.array(z.string())])
    .transform((value, ctx) => {
      const parts = (Array.isArray(value) ? value : value.split(","))
        .map((part) => part.trim())
        .filter((part) => part !== "");

      if (parts.length === 0) {
        ctx.addIssue({ code: "custom", message: "chọn ít nhất một người để khai" });
        return z.NEVER;
      }

      const ids: number[] = [];
      for (const part of parts) {
        const id = Number(part);
        if (!Number.isInteger(id) || id < 1) {
          ctx.addIssue({ code: "custom", message: `"${part}" không phải là một mã hợp lệ` });
          return z.NEVER;
        }
        ids.push(id);
      }

      // Order is preserved and duplicates are refused: the FIRST is the
      // declarant and the rest are household members, so the same person twice
      // would put them in both halves of the form.
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", message: "có người bị chọn hai lần" });
        return z.NEVER;
      }
      return ids;
    }),
});

export type ResidenceFormUploadInput = z.infer<typeof residenceFormUploadSchema>;
export type ResidenceFormConfirmInput = z.infer<typeof residenceFormConfirmSchema>;
export type ResidenceFilingQuery = z.infer<typeof residenceFilingQuerySchema>;
