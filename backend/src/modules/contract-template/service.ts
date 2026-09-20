import { NotFoundError, ValidationError } from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import type { TemplateConfirmInput, TemplateUploadInput } from "./schema.js";

/**
 * The one blank contract the owner prints to sign with a new tenant.
 *
 * Nothing here touches the database. Storage is the record: the key carries the
 * file name, and the object carries its size and when it arrived. A row holding
 * a single key would be a second place for the same fact, and the ID card work
 * already produced one object that no row pointed at.
 */
function assertStorage() {
  if (!storage.isConfigured()) {
    throw new ValidationError(
      "STORAGE_NOT_CONFIGURED",
      "File storage is not configured on this server",
    );
  }
}

/** What is on file, or that there is none. Absence is an answer, not a failure. */
export async function getTemplate() {
  assertStorage();
  const found = await storage.findTemplate();
  if (found === null) {
    return { exists: false as const };
  }
  return {
    exists: true as const,
    fileName: found.fileName,
    size: found.size,
    uploadedAt: found.uploadedAt,
  };
}

export async function signUpload(input: TemplateUploadInput) {
  assertStorage();
  return storage.signTemplateUpload(input.fileName, input.contentType);
}

export async function confirmUpload(input: TemplateConfirmInput) {
  assertStorage();

  // Checked against the template's own place rather than trusted: without it, a
  // confirmation could point this at any object in the bucket.
  if (!input.key.startsWith(storage.CONTRACT_TEMPLATE_PREFIX)) {
    throw new ValidationError(
      "TEMPLATE_KEY_FOREIGN",
      "That file is not a contract template upload",
    );
  }

  const object = await storage.describeObject(input.key);
  if (object === null) {
    throw new ValidationError(
      "TEMPLATE_OBJECT_MISSING",
      "That file is not in storage. The upload may not have finished — try again",
    );
  }

  // A size cannot be bound into a presigned PUT, so it is enforced here. The
  // oversized object is deleted: one nobody can reach through the application
  // is one nobody will ever clear.
  if (object.size > storage.MAX_TEMPLATE_BYTES) {
    await storage.deleteObject(input.key);
    throw new ValidationError(
      "TEMPLATE_FILE_TOO_LARGE",
      `That file is larger than the ${Math.round(storage.MAX_TEMPLATE_BYTES / 1024 / 1024)} MB limit`,
    );
  }

  // Exactly one object is left behind: the template being replaced goes, and so
  // does any upload that reached storage and was never confirmed.
  await storage.clearPrefixExcept(storage.CONTRACT_TEMPLATE_PREFIX, input.key).catch(() => {});

  // Described from the object just confirmed, NOT by listing the prefix. A
  // listing lags a write by a second or two, and reporting it here showed the
  // owner the file they had just replaced — the upload looked like it had done
  // nothing. The key names the file, and the head answers for its size and time.
  return {
    exists: true as const,
    fileName: storage.templateFileName(input.key),
    size: object.size,
    uploadedAt: object.uploadedAt,
  };
}

export async function getDownload() {
  assertStorage();
  const found = await storage.findTemplate();
  if (found === null) {
    throw new NotFoundError("TEMPLATE_NONE_ON_FILE", "No contract template has been uploaded");
  }
  return storage.signTemplateDownload(found.key);
}

export async function removeTemplate() {
  assertStorage();
  const found = await storage.findTemplate();
  if (found === null) {
    throw new NotFoundError("TEMPLATE_NONE_ON_FILE", "No contract template has been uploaded");
  }
  await storage.clearPrefixExcept(storage.CONTRACT_TEMPLATE_PREFIX, null);
  // Stated rather than re-listed, for the same reason as confirmation: a
  // listing taken right after the delete can still be showing the deleted file.
  return { exists: false as const };
}
