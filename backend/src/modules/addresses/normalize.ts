import type { ProviderPlace } from "./provider.js";

/**
 * Turns a provider place into the fields a building records.
 *
 * The provider's vocabulary stops here. Nothing downstream sees `locality`,
 * `region`, `county`, or any other name it chose.
 */

/**
 * Administrative designations that precede a unit's name.
 *
 * The provider returns `phường Thủ Đức` and `thành phố Hồ Chí Minh`; buildings
 * record `Thủ Đức` and `Hồ Chí Minh`. Storing the prefixed form would put a
 * second spelling of every place into the database, and the location filter
 * would then offer both — the exact duplication this feature exists to prevent.
 *
 * Longer designations first, so `thành phố` is matched before any shorter
 * string that could prefix it.
 */
const WARD_PREFIXES = ["thị trấn", "phường", "xã"] as const;
const CITY_PREFIXES = ["thành phố", "tỉnh"] as const;

/**
 * Removes a leading designation only when it is a complete word followed by a
 * non-empty remainder.
 *
 * Conservative on purpose. A name that merely begins with the same letters must
 * survive intact: getting this wrong in one direction costs a duplicate entry in
 * a dropdown, and in the other it costs a wrong address.
 */
function stripPrefix(value: string, prefixes: readonly string[]): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  for (const prefix of prefixes) {
    // The trailing space is what makes this a whole-word match rather than a
    // string prefix.
    if (!lower.startsWith(`${prefix} `)) continue;
    const remainder = trimmed.slice(prefix.length).trim();
    if (remainder.length > 0) return remainder;
  }

  return trimmed;
}

export interface ResolvedAddress {
  placeId: string;
  /** House number and street, empty for a place that identifies only an area. */
  address: string;
  ward: string;
  city: string;
  country: string;
}

export function normalizePlace(placeId: string, place: ProviderPlace): ResolvedAddress {
  // A ward-level place has neither, and an empty street line is the honest
  // answer — the caller types the street themselves.
  const address = [place.housenumber, place.street]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return {
    placeId,
    address,
    ward: stripPrefix(place.locality ?? "", WARD_PREFIXES),
    city: stripPrefix(place.region ?? "", CITY_PREFIXES),
    country: (place.country ?? "").trim(),
    // `county` is deliberately absent: it is the district tier the 2025 reform
    // abolished, and reporting it under any other name would reintroduce it.
  };
}
