import { z } from "zod";

/**
 * Where the gateway sends the tenant back to afterwards. Supplied by whatever
 * is showing the portal, since only it knows its own address.
 */
export const startPaymentSchema = z.object({
  returnUrl: z.url("must be a URL"),
  cancelUrl: z.url("must be a URL"),
});

export type StartPaymentInput = z.infer<typeof startPaymentSchema>;
