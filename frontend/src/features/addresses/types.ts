/**
 * The API's own shape. No provider name, field, or tier appears here — the
 * backend normalises before this side ever sees an address, so swapping the
 * provider is a backend concern only.
 */

export interface AddressCandidate {
  /** Suitable for showing to a person. */
  description: string
  /** Pass to the resolve call to obtain the parts below. */
  placeId: string
}

export interface ResolvedAddress {
  placeId: string
  /** House number and street. Empty for a place that names only an area. */
  address: string
  ward: string
  city: string
  country: string
}
