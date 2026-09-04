import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import {
  createBuildingSchema,
  updateBuildingSchema,
  listBuildingsQuerySchema,
  buildingLocationsQuerySchema,
} from "./schema.js";
import * as buildingService from "./service.js";

export async function createBuildingHandler(req: Request, res: Response) {
  const parsed = createBuildingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("BUILDING_PAYLOAD_INVALID", "Invalid building payload", parsed.error.flatten());
  }

  const building = await buildingService.createBuilding(parsed.data);
  res.status(201).json(building);
}

export async function listBuildingsHandler(req: Request, res: Response) {
  const parsed = listBuildingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const buildings = await buildingService.listBuildings(parsed.data, parsed.data);
  res.status(200).json(buildings);
}

export async function listBuildingLocationsHandler(req: Request, res: Response) {
  const parsed = buildingLocationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const locations = await buildingService.listBuildingLocations(parsed.data);
  // Deliberately not wrapped in the shared paginated shape: this is a bounded
  // summary, not a listing.
  res.status(200).json({ locations });
}

export async function getBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.getBuildingById(parseIdParam(req.params.id, RESOURCE.building));
  res.status(200).json(building);
}

export async function updateBuildingHandler(req: Request, res: Response) {
  const parsed = updateBuildingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("BUILDING_PAYLOAD_INVALID", "Invalid building payload", parsed.error.flatten());
  }

  const building = await buildingService.updateBuilding(
    parseIdParam(req.params.id, RESOURCE.building),
    parsed.data,
  );
  res.status(200).json(building);
}

export async function retireBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.retireBuilding(parseIdParam(req.params.id, RESOURCE.building));
  res.status(200).json(building);
}

export async function restoreBuildingHandler(req: Request, res: Response) {
  const building = await buildingService.restoreBuilding(parseIdParam(req.params.id, RESOURCE.building));
  res.status(200).json(building);
}
