import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam } from "@/lib/parse-id.js";
import {
  createBuildingSchema,
  updateBuildingSchema,
  listBuildingsQuerySchema,
} from "./schema.js";
import * as buildingService from "./service.js";

export async function createBuildingHandler(req: Request, res: Response) {
  const parsed = createBuildingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid building payload", parsed.error.flatten());
  }

  const building = await buildingService.createBuilding(parsed.data);
  res.status(201).json(building);
}

export async function listBuildingsHandler(req: Request, res: Response) {
  const parsed = listBuildingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const buildings = await buildingService.listBuildings(parsed.data.includeInactive);
  res.status(200).json(buildings);
}

export async function getBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.getBuildingById(parseIdParam(req.params.id, "Building"));
  res.status(200).json(building);
}

export async function updateBuildingHandler(req: Request, res: Response) {
  const parsed = updateBuildingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid building payload", parsed.error.flatten());
  }

  const building = await buildingService.updateBuilding(
    parseIdParam(req.params.id, "Building"),
    parsed.data,
  );
  res.status(200).json(building);
}

export async function retireBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.retireBuilding(parseIdParam(req.params.id, "Building"));
  res.status(200).json(building);
}

export async function restoreBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.restoreBuilding(parseIdParam(req.params.id, "Building"));
  res.status(200).json(building);
}
