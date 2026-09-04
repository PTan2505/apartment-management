import { NotFoundError } from "@/lib/errors.js";
import { fetchPlace, searchPlaces } from "./provider.js";
import { normalizePlace, type ResolvedAddress } from "./normalize.js";

export interface AddressCandidate {
  /** Suitable for showing to a person. */
  description: string;
  /** Pass to `resolveAddress` to obtain the recorded fields. */
  placeId: string;
}

/**
 * Candidates carry no address parts on purpose: searching offers choices, and
 * only resolving a chosen one produces values worth recording. The provider's
 * search cannot supply them anyway — its `terms` are offsets into the
 * description, not structured fields.
 */
export async function searchAddresses(
  input: string,
  sessionToken?: string,
): Promise<AddressCandidate[]> {
  return searchPlaces(input, sessionToken);
}

export async function resolveAddress(
  placeId: string,
  sessionToken?: string,
): Promise<ResolvedAddress> {
  const place = await fetchPlace(placeId, sessionToken);

  if (!place) {
    throw new NotFoundError("ADDRESS_NOT_FOUND", "Address not found");
  }

  return normalizePlace(placeId, place);
}
