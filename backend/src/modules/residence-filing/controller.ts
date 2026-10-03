import type { Request, Response } from "express";

import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { scopeOf } from "@/middleware/staff-scope.js";
import {
  residenceFilingQuerySchema,
  residenceFormConfirmSchema,
  residenceFormUploadSchema,
} from "./schema.js";
import * as filingService from "./service.js";

/* --- the blank form --- */

export async function getResidenceFormHandler(_req: Request, res: Response) {
  res.status(200).json(await filingService.getForm());
}

export async function residenceFormUploadUrlHandler(req: Request, res: Response) {
  const parsed = residenceFormUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "RESIDENCE_FORM_UPLOAD_INVALID",
      "Yêu cầu tải mẫu lên không hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(201).json(await filingService.signFormUpload(parsed.data));
}

export async function residenceFormConfirmHandler(req: Request, res: Response) {
  const parsed = residenceFormConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "RESIDENCE_FORM_UPLOAD_INVALID",
      "Yêu cầu tải mẫu lên không hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(200).json(await filingService.confirmFormUpload(parsed.data));
}

export async function residenceFormDownloadHandler(_req: Request, res: Response) {
  res.status(200).json(await filingService.getFormDownload());
}

export async function residenceFormRemoveHandler(_req: Request, res: Response) {
  res.status(200).json(await filingService.removeForm());
}

/* --- a filing for one tenancy --- */

function filingQuery(req: Request) {
  const parsed = residenceFilingQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError(
      "RESIDENCE_FILING_QUERY_INVALID",
      "Chưa chọn được người để khai",
      parsed.error.flatten(),
    );
  }
  return parsed.data;
}

/**
 * What would go in the boxes, and which boxes nothing can fill.
 *
 * Separate from the download on purpose: an owner who discovers at the printer
 * that the signatory's identity number is missing has wasted the trip, and this
 * is what lets the screen say so first.
 */
export async function previewResidenceFilingHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  const { visitorIds } = filingQuery(req);
  res.status(200).json(await filingService.resolveFiling(leaseId, visitorIds, scopeOf(req)));
}

/**
 * The filled document itself.
 *
 * Streamed as bytes rather than as a signed URL, because nothing was stored to
 * sign one for — see the service. The empty boxes are repeated in a header so a
 * caller that went straight to the download still learns about them.
 */
export async function downloadResidenceFilingHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  const { visitorIds } = filingQuery(req);
  const filing = await filingService.renderFiling(leaseId, visitorIds, scopeOf(req));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(filing.fileName)}`,
  );
  // A header rather than a body field, since the body is the document. Named so
  // the browser is allowed to read it cross-origin — see server.ts.
  res.setHeader("X-Empty-Boxes", encodeURIComponent(JSON.stringify(filing.emptyBoxes)));
  res.status(200).send(filing.bytes);
}
