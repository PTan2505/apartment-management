import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().min(1, "phone is required"),
  password: z.string().min(1, "password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
