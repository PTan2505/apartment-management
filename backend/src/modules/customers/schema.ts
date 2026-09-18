import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

// Phone is optional: occupants such as children need a record but may have no
// phone. Where present it must still be unique across all users.
export const registerCustomerSchema = z.object({
  fullName: z.string().min(1, "fullName is required"),
  phone: z.string().min(1).optional(),
});

export const updateCustomerSchema = z
  .object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
  })
  .partial();

export const listCustomersQuerySchema = z.object({
  ...paginationQueryFields,
  search: z.string().min(1).optional(),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

/**
 * Asking for a URL to upload one side of an ID card with.
 *
 * The caller names a SIDE and a CONTENT TYPE, never a destination — the key is
 * derived by the service, so a URL obtained for one customer cannot be turned
 * into a write against another. The content-type set is closed because it is
 * bound into the signature.
 */
export const idCardUploadSchema = z.object({
  side: z.enum(["front", "back"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/heic"]),
});

/** Confirming that one side reached storage. */
export const idCardConfirmSchema = z.object({
  side: z.enum(["front", "back"]),
  key: z.string().min(1, "key is required"),
});

export const idCardSideSchema = z.enum(["front", "back"]);

export type IdCardUploadInput = z.infer<typeof idCardUploadSchema>;
export type IdCardConfirmInput = z.infer<typeof idCardConfirmSchema>;
