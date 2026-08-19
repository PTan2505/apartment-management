import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { searchAddressesQuerySchema, resolveAddressQuerySchema } from "./schema.js";
import * as addressService from "./service.js";

export async function searchAddressesHandler(req: Request, res: Response) {
  const parsed = searchAddressesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    // Rejected before the provider is called: empty input would be a wasted
    // request and a wasted billable session.
    throw new ValidationError("Invalid address search", parsed.error.flatten());
  }

  const candidates = await addressService.searchAddresses(
    parsed.data.input,
    parsed.data.sessionToken,
  );

  // Finding nothing is an ordinary outcome of typing, not an error.
  res.status(200).json({ candidates });
}

export async function resolveAddressHandler(req: Request, res: Response) {
  // Express types a route param as string | string[]; a single-segment param is
  // always a string, but the type has to be narrowed rather than assumed.
  const raw = req.params.placeId;
  const placeId = Array.isArray(raw) ? raw[0] : raw;
  if (!placeId) {
    throw new ValidationError("A place id is required");
  }

  const parsed = resolveAddressQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid address request", parsed.error.flatten());
  }

  const address = await addressService.resolveAddress(placeId, parsed.data.sessionToken);
  res.status(200).json(address);
}
