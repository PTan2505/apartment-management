import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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

/**
 * What a contract page is: a photograph.
 *
 * PDF was accepted here and is not any more. A tenancy carries several pages
 * now, and a mixture of pages that display and files that download makes a
 * screen that handles both and shows neither well. What an owner has is a phone
 * and a piece of paper.
 */
export const CONTRACT_CONTENT_TYPES = [
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

/**
 * Photographs attached to a damage report.
 *
 * The same three content types a contract page accepts, and for the same
 * reason: these come off a phone camera. No PDF — nobody scans a broken tap.
 */
export const REPORT_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/heic"] as const;
export type ReportPhotoContentType = (typeof REPORT_PHOTO_CONTENT_TYPES)[number];

/** 10 MB, as for an ID card: one photograph, taken on a phone. */
export const MAX_REPORT_PHOTO_BYTES = 10 * 1024 * 1024;

export function reportPhotoPrefix(reportId: number): string {
  return `damage-reports/${reportId}/photos/`;
}

const REPORT_PHOTO_EXTENSIONS: Record<ReportPhotoContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

/** Derived, never accepted: the caller names a report, not a destination. */
export function newReportPhotoKey(reportId: number, contentType: ReportPhotoContentType): string {
  return `${reportPhotoPrefix(reportId)}${randomUUID()}.${REPORT_PHOTO_EXTENSIONS[contentType]}`;
}

export const ROOM_PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/heic"] as const;
export type RoomPhotoContentType = (typeof ROOM_PHOTO_CONTENT_TYPES)[number];

/** 10 MB — a photograph taken on a phone, as for a report and an ID card. */
export const MAX_ROOM_PHOTO_BYTES = 10 * 1024 * 1024;

export function roomPhotoPrefix(roomId: number): string {
  return `rooms/${roomId}/photos/`;
}

const ROOM_PHOTO_EXTENSIONS: Record<RoomPhotoContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

/** Derived, never accepted: the caller names a room, not a destination. */
export function newRoomPhotoKey(roomId: number, contentType: RoomPhotoContentType): string {
  return `${roomPhotoPrefix(roomId)}${randomUUID()}.${ROOM_PHOTO_EXTENSIONS[contentType]}`;
}

/** The sides of an ID card. Two objects, kept apart. */
export const ID_CARD_SIDES = ["front", "back"] as const;
export type IdCardSide = (typeof ID_CARD_SIDES)[number];

/** A card is photographed, not scanned to PDF — so no PDF here. */
export const ID_CARD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/heic"] as const;

export type IdCardContentType = (typeof ID_CARD_CONTENT_TYPES)[number];

/** 10 MB. A phone photograph with room to spare, and half a contract's
 *  allowance: a contract may be many pages, a card is one side of one card. */
export const MAX_ID_CARD_BYTES = 10 * 1024 * 1024;

/**
 * Where ONE SIDE of a customer's card lives.
 *
 * Scoped to the side rather than the customer, because replacing a front must
 * not disturb the back. The contract's prefix covers a whole tenancy, which is
 * right there and wrong here.
 */
export function idCardPrefix(customerId: number, side: IdCardSide): string {
  return `customers/${customerId}/id-card/${side}/`;
}

const ID_CARD_EXTENSIONS: Record<IdCardContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/heic": "heic",
};

/** Derived, never accepted: the caller names a side, not a destination. */
export function newIdCardKey(
  customerId: number,
  side: IdCardSide,
  contentType: IdCardContentType,
): string {
  return `${idCardPrefix(customerId, side)}${randomUUID()}.${ID_CARD_EXTENSIONS[contentType]}`;
}

/**
 * A document there is exactly ONE of, system-wide, with no database row behind
 * it: the blank contract, the blank residence form.
 *
 * A fixed place in storage rather than a record, because storage IS the record
 * here. There is one of it, it belongs to nobody in particular, and a row
 * holding a single key would be a second place for the same fact — which is how
 * a record and a bucket come to disagree. Everything a screen needs is on the
 * object itself.
 *
 * Two of these now exist, which is why it is a shape rather than a second copy
 * of four near-identical functions.
 */
export interface DocumentSlot {
  /** Where the one object lives. Must end in a separator. */
  prefix: string;
  /** What this slot plausibly holds. Narrower than "a file" on purpose. */
  contentTypes: readonly string[];
  maxBytes: number;
  /** Used when an uploaded name cleans down to nothing. */
  fallbackName: string;
}

/** What a blank contract plausibly is: something to print. */
export const TEMPLATE_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/heic",
] as const;

export type TemplateContentType = (typeof TEMPLATE_CONTENT_TYPES)[number];

/** 20 MB, matching a signed contract. */
export const MAX_TEMPLATE_BYTES = 20 * 1024 * 1024;

/** The one blank contract the owner prints to sign with a new tenant. */
export const CONTRACT_TEMPLATE_SLOT: DocumentSlot = {
  prefix: "templates/contract/",
  contentTypes: TEMPLATE_CONTENT_TYPES,
  maxBytes: MAX_TEMPLATE_BYTES,
  fallbackName: "hop-dong-mau",
};

/**
 * The ONLY type a residence form may be.
 *
 * Not a choice of convenience. This file is not merely stored and handed back —
 * it is opened, filled in and streamed, and the filler reads one format. A PDF
 * here would upload cleanly, sit in storage looking correct, and fail at the
 * one moment the owner needed a filled form, so it is refused at the door with
 * a reason instead.
 */
export const RESIDENCE_FORM_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type ResidenceFormContentType = (typeof RESIDENCE_FORM_CONTENT_TYPES)[number];

/** 5 MB. A government form is a few pages of text; 20 MB would be a photograph album. */
export const MAX_RESIDENCE_FORM_BYTES = 5 * 1024 * 1024;

/**
 * The blank residence form (CT01), carrying named placeholders where the
 * answers go.
 *
 * Uploaded by the owner rather than shipped with the code, because the
 * authorities reissue the form when the regulation changes and an owner who can
 * replace the file themselves is not waiting on a deployment.
 */
export const RESIDENCE_FORM_SLOT: DocumentSlot = {
  prefix: "templates/residence-form/",
  contentTypes: RESIDENCE_FORM_CONTENT_TYPES,
  maxBytes: MAX_RESIDENCE_FORM_BYTES,
  fallbackName: "to-khai-ct01",
};

/**
 * A file name safe to put inside a key.
 *
 * The name arrives from a caller and a key is a path, so separators go. The
 * length is capped because a key has one, and an empty result falls back to
 * something rather than producing a key that ends in the separator.
 */
export function safeFileName(name: string, fallback: string): string {
  const cleaned = name
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned === "" ? fallback : cleaned;
}

/**
 * The key an upload will write.
 *
 * The random part prevents a cached copy being served after a replacement; the
 * suffix is what makes the download land under the name the owner uploaded
 * rather than a random identifier.
 */
export function newSlotKey(slot: DocumentSlot, fileName: string): string {
  return `${slot.prefix}${randomUUID()}__${safeFileName(fileName, slot.fallbackName)}`;
}

/** The original name back out of a key. */
export function slotFileName(slot: DocumentSlot, key: string): string {
  const last = key.slice(slot.prefix.length);
  const at = last.indexOf("__");
  return at === -1 ? last : last.slice(at + 2);
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

/**
 * The same signature as a contract upload, for one side of one card.
 *
 * Shares every reason the contract version gives: the content type is bound
 * into the signature, the size is not bindable and is enforced at confirmation,
 * and the key is derived here rather than taken from the caller.
 */
/**
 * The same thing for a holder that is not a customer.
 *
 * A visitor's document is the second kind of card this system keeps, and it
 * hangs off a registration rather than a person — so the caller names the PLACE
 * rather than a customer id. The ceiling and the accepted types stay the card's
 * own, because it is the same object being photographed.
 */
export async function signIdCardUploadAt(
  prefix: string,
  contentType: IdCardContentType,
): Promise<SignedUpload> {
  const key = `${prefix}${randomUUID()}.${ID_CARD_EXTENSIONS[contentType]}`;
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(["content-type"]) },
  );
  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: MAX_ID_CARD_BYTES,
  };
}

export async function signIdCardUpload(
  customerId: number,
  side: IdCardSide,
  contentType: IdCardContentType,
): Promise<SignedUpload> {
  const key = newIdCardKey(customerId, side, contentType);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(["content-type"]) },
  );
  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: MAX_ID_CARD_BYTES,
  };
}

export async function signSlotUpload(
  slot: DocumentSlot,
  fileName: string,
  contentType: string,
): Promise<SignedUpload> {
  const key = newSlotKey(slot, fileName);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(["content-type"]) },
  );
  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: slot.maxBytes,
  };
}

/**
 * A download that arrives under the name it was uploaded with.
 *
 * `ResponseContentDisposition` is part of the signature, so the browser saves
 * "hop-dong-mau.pdf" rather than the uuid the key starts with.
 */
export async function signSlotDownload(
  slot: DocumentSlot,
  key: string,
): Promise<{ url: string; expiresAt: Date }> {
  const name = slotFileName(slot, key);
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
    }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
  return { url, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
}

/**
 * The template on file, or null.
 *
 * Read from storage rather than from a record, because storage IS the record
 * here. More than one object under the prefix means an upload was confirmed
 * while another was in flight; the most recent one wins, which is the same
 * answer a replacement gives.
 */
export async function findSlotObject(
  slot: DocumentSlot,
): Promise<{ key: string; fileName: string; size: number; uploadedAt: Date } | null> {
  const listed = await s3().send(
    new ListObjectsV2Command({ Bucket: env.R2_BUCKET!, Prefix: slot.prefix }),
  );
  const objects = (listed.Contents ?? []).filter((object) => object.Key !== undefined);
  if (objects.length === 0) return null;

  const newest = objects.sort(
    (a, b) => (b.LastModified?.getTime() ?? 0) - (a.LastModified?.getTime() ?? 0),
  )[0]!;
  return {
    key: newest.Key!,
    fileName: slotFileName(slot, newest.Key!),
    size: newest.Size ?? 0,
    uploadedAt: newest.LastModified ?? new Date(),
  };
}

/**
 * The object's BYTES, into memory.
 *
 * The exception to this file's rule, and narrowly: everything else hands the
 * browser a signed URL so bytes never cross the Express process. A blank form
 * being filled in has to be opened by the server that fills it, and it is a few
 * pages of text — there is no version of this that goes around the API.
 *
 * Not for anything a user uploads as content. Reserved for the document slots,
 * whose size ceilings are small and enforced on the way in.
 */
export async function readObject(key: string): Promise<Buffer> {
  const got = await s3().send(
    new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
  );
  if (got.Body === undefined) {
    throw new Error(`Object ${key} came back with no body`);
  }
  return Buffer.from(await got.Body.transformToByteArray());
}

/** A short-lived URL for reading. The stored object is never public. */
export async function signDownload(key: string): Promise<{ url: string; expiresAt: Date }> {
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
  return { url, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
}

/** The old name, kept so the contract endpoints read as they did. */
export const signContractDownload = signDownload;

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
): Promise<{ size: number; contentType: string | undefined; uploadedAt: Date } | null> {
  try {
    const head = await s3().send(
      new HeadObjectCommand({ Bucket: env.R2_BUCKET!, Key: key }),
    );
    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType,
      // Reading one object by key is answered from the object itself, unlike a
      // listing — which is why a caller that has just written can trust this.
      uploadedAt: head.LastModified ?? new Date(),
    };
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

/**
 * Removes everything under a tenancy's prefix except one named object.
 *
 * An upload that is never confirmed leaves an object behind — the browser sends
 * the file and the confirmation then fails, so nothing is recorded and the
 * object remains, unreachable through the application and invisible in it.
 *
 * WHAT IS KEPT IS A SET, not one key. A tenancy's contract is now several
 * pages, every one of them a legitimate object under the same prefix, so a
 * sweep that kept only the newest would delete the rest of the contract. The
 * caller passes the keys its records point at; everything else is litter by
 * construction — no clock, no guess about how long an upload might take.
 *
 * Pass an empty set to keep nothing, which is what removing everything wants.
 */
export async function clearPrefixExcept(
  prefix: string,
  keep: string | null | readonly string[],
): Promise<void> {
  const kept = new Set(keep === null ? [] : typeof keep === "string" ? [keep] : keep);
  let token: string | undefined;
  do {
    const page = await s3().send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET!,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );

    for (const object of page.Contents ?? []) {
      if (object.Key && !kept.has(object.Key)) {
        await deleteObject(object.Key);
      }
    }

    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token !== undefined);
}

/**
 * A signed upload for one photograph on a damage report.
 *
 * Identical in shape to the contract and ID-card signers, and identical in its
 * reasons: the key is derived here, the content type is bound into the
 * signature, and the size is checked at confirmation because a presigned PUT
 * cannot bind it.
 */
export async function signReportPhotoUpload(
  reportId: number,
  contentType: ReportPhotoContentType,
): Promise<SignedUpload> {
  const key = newReportPhotoKey(reportId, contentType);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(["content-type"]) },
  );

  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: MAX_REPORT_PHOTO_BYTES,
  };
}

/**
 * A signed upload for one photograph of a room.
 *
 * The fourth of these, and deliberately identical to the third: the key is
 * derived here rather than accepted, the content type is bound into the
 * signature, and the size is checked at confirmation because a presigned PUT
 * cannot bind it.
 */
export async function signRoomPhotoUpload(
  roomId: number,
  contentType: RoomPhotoContentType,
): Promise<SignedUpload> {
  const key = newRoomPhotoKey(roomId, contentType);
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: env.R2_BUCKET!, Key: key, ContentType: contentType }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(["content-type"]) },
  );

  return {
    url,
    key,
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
    maxBytes: MAX_ROOM_PHOTO_BYTES,
  };
}
