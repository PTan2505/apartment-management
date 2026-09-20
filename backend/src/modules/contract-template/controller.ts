import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { templateConfirmSchema, templateUploadSchema } from "./schema.js";
import * as templateService from "./service.js";

export async function getTemplateHandler(_req: Request, res: Response) {
  res.status(200).json(await templateService.getTemplate());
}

export async function templateUploadUrlHandler(req: Request, res: Response) {
  const parsed = templateUploadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      "TEMPLATE_UPLOAD_PAYLOAD_INVALID",
      "Invalid template upload request",
      parsed.error.flatten(),
    );
  }
  res.status(200).json(await templateService.signUpload(parsed.data));
}

export async function templateConfirmHandler(req: Request, res: Response) {
  const parsed = templateConfirmSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw new ValidationError(
      "TEMPLATE_CONFIRM_PAYLOAD_INVALID",
      "Invalid confirmation",
      parsed.error.flatten(),
    );
  }
  res.status(200).json(await templateService.confirmUpload(parsed.data));
}

export async function templateDownloadHandler(_req: Request, res: Response) {
  res.status(200).json(await templateService.getDownload());
}

export async function templateRemoveHandler(_req: Request, res: Response) {
  res.status(200).json(await templateService.removeTemplate());
}
