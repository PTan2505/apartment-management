import { z } from "zod";

export const reversePaymentSchema = z.object({
  // When the money went back. Its own date rather than the payment's, because
  // money taken in March and returned in April belongs to both months and the
  // cash figure reports it in both.
  reversedAt: z.coerce.date(),
});

export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;
