import type { Request, Response } from "express";

import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  assignBuildingsSchema,
  createStaffSchema,
  listStaffQuerySchema,
  updateStaffSchema,
} from "./schema.js";
import * as staffService from "./service.js";

export async function createStaffHandler(req: Request, res: Response) {
  const parsed = createStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("STAFF_PAYLOAD_INVALID", "Invalid staff payload", parsed.error.flatten());
  }
  // 201 carries the password. It is the only response that ever will.
  res.status(201).json(await staffService.createStaff(parsed.data));
}

export async function listStaffHandler(req: Request, res: Response) {
  const parsed = listStaffQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }
  res.status(200).json({ data: await staffService.listStaff(parsed.data) });
}

export async function getStaffHandler(req: Request, res: Response) {
  res.status(200).json(await staffService.getStaffById(parseIdParam(req.params.id, RESOURCE.staff)));
}

export async function updateStaffHandler(req: Request, res: Response) {
  const parsed = updateStaffSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("STAFF_PAYLOAD_INVALID", "Invalid staff payload", parsed.error.flatten());
  }
  res
    .status(200)
    .json(await staffService.updateStaff(parseIdParam(req.params.id, RESOURCE.staff), parsed.data));
}

export async function assignBuildingsHandler(req: Request, res: Response) {
  const parsed = assignBuildingsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "STAFF_BUILDINGS_PAYLOAD_INVALID",
      "Invalid building assignment",
      parsed.error.flatten(),
    );
  }
  res
    .status(200)
    .json(await staffService.assignBuildings(parseIdParam(req.params.id, RESOURCE.staff), parsed.data));
}

export async function resetStaffPasswordHandler(req: Request, res: Response) {
  res.status(200).json(await staffService.resetPassword(parseIdParam(req.params.id, RESOURCE.staff)));
}

export async function deactivateStaffHandler(req: Request, res: Response) {
  res.status(200).json(await staffService.setActive(parseIdParam(req.params.id, RESOURCE.staff), false));
}

export async function restoreStaffHandler(req: Request, res: Response) {
  res.status(200).json(await staffService.setActive(parseIdParam(req.params.id, RESOURCE.staff), true));
}
