import { z } from "zod";

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
  search: z.string().min(1).optional(),
});

export type RegisterCustomerInput = z.infer<typeof registerCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
