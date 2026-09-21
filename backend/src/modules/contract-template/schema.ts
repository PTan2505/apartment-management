import { z } from "zod";

/**
 * Asking for a URL to upload the blank contract with.
 *
 * The caller names a FILE NAME and a CONTENT TYPE, never a destination: the key
 * is derived, so a URL obtained here can only write the template. The name is
 * kept so the download arrives as a recognisable document, and is sanitised
 * before it reaches a key.
 */
export const templateUploadSchema = z.object({
  fileName: z.string().trim().min(1, "fileName is required").max(200),
  contentType: z.enum([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/heic",
  ]),
});

/** Confirming that the upload reached storage. */
export const templateConfirmSchema = z.object({
  key: z.string().min(1, "key is required"),
});

export type TemplateUploadInput = z.infer<typeof templateUploadSchema>;
export type TemplateConfirmInput = z.infer<typeof templateConfirmSchema>;
