import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env.js";
import { ValidationError } from "@/lib/errors.js";

/**
 * The payOS side of taking money: signing what we send, and proving what comes
 * back really came from them.
 *
 * Deliberately not abstracted behind a "payment provider" interface. There is
 * one provider; an interface with one implementation is a guess about what a
 * second would need, written before anybody knows.
 */
const BASE_URL = "https://api-merchant.payos.vn/v2/payment-requests";

export interface GatewayConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

/**
 * The credentials, or null where none are set.
 *
 * Partial configuration cannot reach here — the environment refuses to start on
 * it — so this is genuinely all-or-nothing.
 */
export function gatewayConfig(): GatewayConfig | null {
  if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) {
    return null;
  }
  return {
    clientId: env.PAYOS_CLIENT_ID,
    apiKey: env.PAYOS_API_KEY,
    checksumKey: env.PAYOS_CHECKSUM_KEY,
  };
}

export function isGatewayConfigured(): boolean {
  return gatewayConfig() !== null;
}

function hmac(data: string, key: string): string {
  return createHmac("sha256", key).update(data).digest("hex");
}

/**
 * payOS signs a request over exactly these five fields, in this order.
 *
 * Not "the payload sorted alphabetically" — it happens to coincide, but the
 * provider specifies these five and adding a sixth field to the request must
 * not silently change the signature.
 */
export function signPaymentRequest(
  input: { amount: number; cancelUrl: string; description: string; orderCode: number; returnUrl: string },
  checksumKey: string,
): string {
  const data =
    `amount=${input.amount}` +
    `&cancelUrl=${input.cancelUrl}` +
    `&description=${input.description}` +
    `&orderCode=${input.orderCode}` +
    `&returnUrl=${input.returnUrl}`;
  return hmac(data, checksumKey);
}

/**
 * A confirmation's signature covers the fields of `data`, sorted alphabetically
 * by key and joined as `key=value&…`, with absent values as empty strings.
 *
 * Note what this is NOT: a signature over the raw request body. Several other
 * gateways do that and require the unparsed bytes; this one does not, so
 * ordinary JSON parsing is safe here. Worth knowing before someone reaches for
 * a raw-body middleware that would change nothing but the risk.
 */
export function webhookSignatureData(data: Record<string, unknown>): string {
  return Object.keys(data)
    .sort()
    .map((key) => {
      const value = data[key];
      if (value === null || value === undefined) {
        return `${key}=`;
      }
      // Arrays and objects are sent as their JSON, per the provider's rule.
      if (typeof value === "object") {
        return `${key}=${JSON.stringify(value)}`;
      }
      return `${key}=${String(value)}`;
    })
    .join("&");
}

/**
 * Whether a confirmation really came from the gateway.
 *
 * Compared in constant time. A byte-by-byte comparison that returns early leaks
 * how much of a guess was right, which is enough to reconstruct a signature one
 * character at a time given enough attempts — and nothing here rate-limits
 * attempts.
 */
export function verifyWebhookSignature(
  data: Record<string, unknown>,
  signature: unknown,
  checksumKey: string,
): boolean {
  if (typeof signature !== "string" || signature.length === 0) {
    return false;
  }

  const expected = hmac(webhookSignatureData(data), checksumKey);
  const given = Buffer.from(signature, "utf8");
  const want = Buffer.from(expected, "utf8");

  // timingSafeEqual throws on differing lengths, which would itself leak the
  // length. Checked first, and a wrong length is simply a wrong signature.
  if (given.length !== want.length) {
    return false;
  }
  return timingSafeEqual(given, want);
}

export interface CreatedPaymentLink {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
}

/**
 * Asks the gateway for something the tenant can pay.
 *
 * Throws rather than returning a failure, so a caller cannot accidentally leave
 * a pending payment behind for a request the gateway never accepted.
 */
export async function createPaymentLink(
  config: GatewayConfig,
  input: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  },
): Promise<CreatedPaymentLink> {
  const body = {
    ...input,
    signature: signPaymentRequest(input, config.checksumKey),
  };

  let response: Response;
  try {
    response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-client-id": config.clientId,
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // The message deliberately carries nothing from the request. Credentials
    // travel in its headers and an error is the likeliest thing to be logged.
    throw new ValidationError("The payment gateway could not be reached");
  }

  const payload = (await response.json().catch(() => null)) as
    | { code?: string; desc?: string; data?: CreatedPaymentLink }
    | null;

  if (!response.ok || payload?.code !== "00" || !payload.data) {
    throw new ValidationError(
      `The payment gateway refused the request${payload?.desc ? `: ${payload.desc}` : ""}`,
    );
  }

  return payload.data;
}

/**
 * What the gateway believes about a payment. Used to reconcile, never to
 * correct — see the service.
 */
export async function fetchPaymentLink(config: GatewayConfig, orderCode: number) {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${orderCode}`, {
      headers: { "x-client-id": config.clientId, "x-api-key": config.apiKey },
    });
  } catch {
    throw new ValidationError("The payment gateway could not be reached");
  }

  const payload = (await response.json().catch(() => null)) as
    | { code?: string; desc?: string; data?: { status?: string; amountPaid?: number } }
    | null;

  if (payload?.code !== "00" || !payload.data) {
    return null;
  }
  return payload.data;
}
