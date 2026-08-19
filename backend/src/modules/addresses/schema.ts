import { z } from "zod";

export const searchAddressesQuerySchema = z.object({
  input: z.string().trim().min(1, "input is required"),
  /**
   * Opaque token grouping a run of searches with the resolution that follows.
   * Passed straight through: the provider bills by session, so without it a
   * multi-character search is billed per keystroke.
   */
  sessionToken: z.string().min(1).optional(),
});

export type SearchAddressesQuery = z.infer<typeof searchAddressesQuerySchema>;

export const resolveAddressQuerySchema = z.object({
  sessionToken: z.string().min(1).optional(),
});

export type ResolveAddressQuery = z.infer<typeof resolveAddressQuerySchema>;
