import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(1, "phone is required"),
  password: z.string().min(1, "password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Changing one's own password.
 *
 * The CURRENT password is required of anybody choosing to change a password
 * they already own: an access token left behind on a shared machine would
 * otherwise be enough to take the account over permanently.
 *
 * It is NOT required of an account that still owes a change — the password it
 * holds was issued by the owner, the person typed it seconds ago to get here,
 * and asking them to repeat a string they were read down the telephone adds a
 * step without adding a check. Optional in the schema; which case applies is
 * decided by the service, from the account rather than from the request.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).optional(),
  newPassword: z
    .string()
    .min(8, "a password must be at least 8 characters")
    .max(200, "that password is too long"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
