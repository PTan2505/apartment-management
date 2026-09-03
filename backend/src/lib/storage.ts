import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env.js";

/**
 * Cloudflare R2, for keeping signed contracts.
 *
 * R2 rather than AWS S3, and deliberately the only option in v1: it charges
 * nothing for egress, which for scanned contracts is the whole of the recurring
 * cost, and supporting both would mean two configurations to explain and two to
 * get wrong.
 *
 * The client library is named for S3 because S3 is the PROTOCOL R2 speaks. No
 * AWS service is involved.
 *
 * ── Why the bytes never come through this process ──────────────────────────
 *
 * A scan of a contract is megabytes uploaded from a phone. Passing it through
 * here would hold a request open for the length of that upload, on a server
 * whose whole job is answering questions about small records — and this process
 * has nothing to do with the bytes. So it signs a URL and the browser uploads
 * directly.
 *
 * ── Unconfigured is a state, not a failure ─────────────────────────────────
 *
 * An owner who does not want to keep scans must still be able to run the
 * system. So nothing here throws on import: the client is built lazily and
 * `isConfigured` is the question every caller asks first. The env schema
 * separately refuses a PARTIAL configuration, because a bucket with no
 * credentials fails when somebody tries to use it, which is the worst time.
 */

/** Documents an owner would plausibly scan a contract as. */
export const CONTRACT_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
] as const;

export type ContractContentType = (typeof CONTRACT_CONTENT_TYPES)[number];

/** 20 MB. A phone photograph of several pages, with room to spare. */
export const MAX_CONTRACT_BYTES = 20 * 1024 * 1024;

/**
 * Minutes, not hours. A signed URL authorises a write to the owner's storage,
 * and its useful life is the length of one upload.
 */
const UPLOAD_URL_TTL_SECONDS = 5 * 60;

/**
 * Longer than an upload but still short. A contract carries names, an address,
 * a signature and a phone number; a link that expires limits the damage of
 * forwarding it to the minutes after it was sent.
 */
const DOWNLOAD_URL_TTL_SECONDS = 10 * 60;

export function isConfigured(): boolean {
  return (
    env.R2_ACCOUNT_ID !== undefined &&
    env.R2_BUCKET !== undefined &&
    env.R2_ACCESS_KEY_ID !== undefined &&
    env.R2_SECRET_ACCESS_KEY !== undefined
  );
}

let client: S3Client | null = null;

function s3(): S3Client {
  if (!isConfigured()) {
    // Callers ask `isConfigured()` first; reaching here is a programming error
    // rather than a configuration one, and says so.
    throw new Error("Storage is not configured");
  }
  if (client === null) {
    client = new S3Client({
      // R2 has no regions to choose between and signs against this fixed value.
      region: "auto",
      // Assembled here rather than asked for: it follows from the account id,
      // and one fewer thing to paste is one fewer thing to paste wrongly.
      endpoint: `https://${env.R2_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
      // The SDK adds a CRC32 checksum header by default. AWS S3 expects it;
      // S3-COMPATIBLE stores do not all accept it, and a presigned PUT that
      // carries one the store rejects fails at upload time with an error that
      // says nothing about checksums.
      //
      // `WHEN_REQUIRED` sends one only where the operation demands it, which is
      // the documented setting for non-AWS endpoints. Stated as a compatibility
      // measure rather than a verified one: no bucket exists to test against.
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }
  return client;
}

/**
 * Where a tenancy's contracts live.
 *
 * Exported so the confirmation can check a key against it rather than trusting
 * what comes back from the caller.
 */
export function contractPrefix(leaseId: number): string {
  return `leases/${leaseId}/contracts/`;
}

const EXTENSIONS: Record<ContractContentType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

/**
 * The key an upload will write.
 *
 * DERIVED, never accepted from a caller: the caller names a file, not a
 * destination, so a URL obtained for one tenancy cannot be turned into a write
 * anywhere else.
 *
 * The random component is not decoration. Reusing a key on replacement would
 * let a browser or a CDN serve the previous contract in place of the new one.
 */
export function newContractKey(leaseId: number, contentType: ContractContentType): string {
  return `${contractPrefix(leaseId)}${randomUUID()}.${EXTENSIONS[contentType]}`;
}

export interface SignedUpload {
  url: string;
  key: string;
  expiresAt: Date;
  maxBytes: number;
}

/**
 * A URL that may write exactly one object, of one content type, for a few
 * minutes.
 *
 * The content type is bound into the signature, so a URL obtained for a
 * document cannot be used to store something else. A SIZE cannot be bound this
 * way — that needs a presigned POST policy, a clumsier mechanism whose form
 * fields the browser would have to reproduce exactly — so the ceiling is
 * enforced at confirmation instead, where it can be.
 */
export async function signContractUpload(
  leaseId: number,
  contentType: ContractContentType,
): Promise<SignedUpload> {
  const key = newContractKey(leaseId, contentType);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
      // `content-type` must be named explicitly or the SDK signs only `host`
      // and drops it — verified by reading X-Amz-SignedHeaders out of the
      // generated URL. Without this the content type is decoration: a URL
      // issued for a PDF would upload anything at all.
      //
      // Bound this way, the upload MUST send exactly this Content-Type or the
      // signature does not match and storage refuses it.
      signableHeaders: new Set(["content-type"]),
    },
  );

  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: MAX_CONTRACT_BYTES,
  };
}

/** A short-lived URL for reading. The stored object is never public. */
export async function signContractDownload(key: string): Promise<{ url: string; expiresAt: Date }> {
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
  return { url, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
}

/**
 * What storage says about an object, or null where there is none.
 *
 * Asked rather than assumed: a signed URL is handed out before anything is
 * uploaded, and the upload can fail after it — a closed tab, a dropped
 * connection. Believing the caller would leave tenancies claiming a contract
 * that is not there, with nothing ever noticing.
 */
export async function describeObject(
  key: string,
): Promise<{ size: number; contentType: string | undefined } | null> {
  try {
    const head = await s3().send(
      new HeadObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
    );
    return { size: head.ContentLength ?? 0, contentType: head.ContentType };
  } catch {
    // Storage answers 404 for an object that is not there, and the SDK throws.
    // Every other failure — credentials, network — is indistinguishable here,
    // and treating them alike is correct for the one question being asked:
    // can this object be confirmed? No.
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }));
}
