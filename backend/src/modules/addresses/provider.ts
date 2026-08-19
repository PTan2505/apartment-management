import { env } from "@/config/env.js";
import { NotConfiguredError, UpstreamUnavailableError } from "@/lib/errors.js";

/**
 * Everything specific to the address provider lives here.
 *
 * Nothing above this file knows which provider answers, what it calls its
 * fields, or which of its options must be set. That boundary is the point of
 * the module: three of the provider's behaviours are traps, and holding them in
 * one place is the difference between deciding them once and rediscovering them.
 */

const BASE_URL = "https://mapapis.openmap.vn/v1";

/** Bounds a slow provider so it cannot hang a request indefinitely. */
const TIMEOUT_MS = 8000;

/**
 * Returns the current administrative units.
 *
 * Vietnam's 2025 reform merged wards and abolished the district tier. With this
 * flag the district comes back empty and the ward is the merged one; without it
 * the provider returns the *pre*-merger ward nested under a district that no
 * longer exists — and the response looks entirely normal either way. Verified
 * directly against both settings for the same place.
 */
const ADMIN_V2 = "true";

/** What the provider's search returns, of which we use two fields. */
interface ProviderPrediction {
  description?: string;
  place_id?: string;
}

/** The OSM-format properties the provider returns for a resolved place. */
export interface ProviderPlace {
  housenumber?: string | null;
  street?: string | null;
  /** The ward (phường/xã), carrying its administrative prefix. */
  locality?: string | null;
  /** The district — always empty under ADMIN_V2, and discarded regardless. */
  county?: string | null;
  /** The city or province, carrying its administrative prefix. */
  region?: string | null;
  country?: string | null;
}

function requireApiKey(): string {
  const key = env.OPENMAP_API_KEY;
  if (!key) {
    throw new NotConfiguredError(
      "Address lookup is not configured on this server",
    );
  }
  return key;
}

/**
 * Issues the call. Status handling is left to the caller, because the same
 * status means different things on the two endpoints — a 404 from resolve means
 * "no such place", which is not a fault.
 *
 * The key goes in the query string, not a header: the provider's gateway
 * rejects the header form with a 401, which looks exactly like a bad key. A
 * header is the obvious thing to try, so this is worth stating.
 */
async function request(path: string, params: Record<string, string>): Promise<Response> {
  const key = requireApiKey();
  const url = new URL(`${BASE_URL}${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("apikey", key);

  try {
    return await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    // Unreachable, DNS failure, or timed out. Deliberately not re-thrown: the
    // cause could carry the URL, and the URL carries the key.
    throw new UpstreamUnavailableError("Address lookup is currently unavailable");
  }
}

/**
 * Everything other than success is the feature not working right now.
 *
 * This includes the provider rejecting *our* key. Reporting that as a 401 would
 * send a signed-in owner to a login screen over a credential they cannot fix.
 */
async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new UpstreamUnavailableError("Address lookup is currently unavailable");
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new UpstreamUnavailableError("Address lookup returned an unreadable response");
  }
}

export function isConfigured(): boolean {
  return Boolean(env.OPENMAP_API_KEY);
}

export async function searchPlaces(
  input: string,
  sessionToken?: string,
): Promise<{ description: string; placeId: string }[]> {
  const response = await request("/autocomplete", {
    input,
    admin_v2: ADMIN_V2,
    ...(sessionToken ? { sessiontoken: sessionToken } : {}),
  });

  // The provider answers 404 for a search that matched nothing — its body even
  // reads `{"predictions":[],"status":"OK"}`. Finding nothing is an ordinary
  // outcome of typing, so it must not surface as the feature being broken.
  if (response.status === 404) return [];

  const data = await parse<{ predictions?: ProviderPrediction[] }>(response);

  return (data.predictions ?? [])
    .filter((p): p is Required<ProviderPrediction> =>
      Boolean(p.description && p.place_id),
    )
    .map((p) => ({ description: p.description, placeId: p.place_id }));
}

/** Returns null when the provider does not recognise the identifier. */
export async function fetchPlace(
  placeId: string,
  sessionToken?: string,
): Promise<ProviderPlace | null> {
  const response = await request("/place", {
    ids: placeId,
    admin_v2: ADMIN_V2,
    format: "osm",
    ...(sessionToken ? { sessiontoken: sessionToken } : {}),
  });

  // The provider answers 404 with an empty feature list for an identifier it
  // does not know. That is the caller naming a place that does not exist, not
  // the provider failing — so it must not become "lookup unavailable".
  if (response.status === 404) return null;

  const data = await parse<{ features?: { properties?: ProviderPlace }[] }>(response);
  return data.features?.[0]?.properties ?? null;
}
