import type { Request, Response } from "express";

import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { scopeOf } from "@/middleware/staff-scope.js";
import {
  addRoomFurnitureSchema,
  createFurnitureItemSchema,
  listFurnitureItemsQuerySchema,
  updateFurnitureItemSchema,
  updateRoomFurnitureSchema,
} from "./schema.js";
import * as furnitureService from "./service.js";

/* ---------------- the building's catalogue ---------------- */

export async function listFurnitureItemsHandler(req: Request, res: Response) {
  const buildingId = parseIdParam(req.params.buildingId, RESOURCE.building);
  const parsed = listFurnitureItemsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }
  res.status(200).json(
    await furnitureService.listFurnitureItems(buildingId, parsed.data, scopeOf(req)),
  );
}

export async function createFurnitureItemHandler(req: Request, res: Response) {
  const buildingId = parseIdParam(req.params.buildingId, RESOURCE.building);
  const parsed = createFurnitureItemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "FURNITURE_ITEM_INVALID",
      "Thông tin món nội thất chưa hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(201).json(
    await furnitureService.createFurnitureItem(buildingId, parsed.data, scopeOf(req)),
  );
}

export async function updateFurnitureItemHandler(req: Request, res: Response) {
  const buildingId = parseIdParam(req.params.buildingId, RESOURCE.building);
  const itemId = parseIdParam(req.params.itemId, RESOURCE.furnitureItem);
  const parsed = updateFurnitureItemSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "FURNITURE_ITEM_INVALID",
      "Thông tin món nội thất chưa hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(200).json(
    await furnitureService.updateFurnitureItem(buildingId, itemId, parsed.data, scopeOf(req)),
  );
}

export async function retireFurnitureItemHandler(req: Request, res: Response) {
  const buildingId = parseIdParam(req.params.buildingId, RESOURCE.building);
  const itemId = parseIdParam(req.params.itemId, RESOURCE.furnitureItem);
  res.status(200).json(
    await furnitureService.retireFurnitureItem(buildingId, itemId, scopeOf(req)),
  );
}

export async function restoreFurnitureItemHandler(req: Request, res: Response) {
  const buildingId = parseIdParam(req.params.buildingId, RESOURCE.building);
  const itemId = parseIdParam(req.params.itemId, RESOURCE.furnitureItem);
  res.status(200).json(
    await furnitureService.restoreFurnitureItem(buildingId, itemId, scopeOf(req)),
  );
}

/* ---------------- what a room holds ---------------- */

export async function listRoomFurnitureHandler(req: Request, res: Response) {
  const roomId = parseIdParam(req.params.id, RESOURCE.room);
  res.status(200).json(await furnitureService.listRoomFurniture(roomId, scopeOf(req)));
}

export async function addRoomFurnitureHandler(req: Request, res: Response) {
  const roomId = parseIdParam(req.params.id, RESOURCE.room);
  const parsed = addRoomFurnitureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "ROOM_FURNITURE_INVALID",
      "Thông tin nội thất của phòng chưa hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(201).json(
    await furnitureService.addRoomFurniture(roomId, parsed.data, scopeOf(req)),
  );
}

export async function updateRoomFurnitureHandler(req: Request, res: Response) {
  const roomId = parseIdParam(req.params.id, RESOURCE.room);
  const holdingId = parseIdParam(req.params.holdingId, RESOURCE.roomFurniture);
  const parsed = updateRoomFurnitureSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "ROOM_FURNITURE_INVALID",
      "Thông tin nội thất của phòng chưa hợp lệ",
      parsed.error.flatten(),
    );
  }
  res.status(200).json(
    await furnitureService.updateRoomFurniture(roomId, holdingId, parsed.data, scopeOf(req)),
  );
}

export async function removeRoomFurnitureHandler(req: Request, res: Response) {
  const roomId = parseIdParam(req.params.id, RESOURCE.room);
  const holdingId = parseIdParam(req.params.holdingId, RESOURCE.roomFurniture);
  res.status(200).json(
    await furnitureService.removeRoomFurniture(roomId, holdingId, scopeOf(req)),
  );
}

/* ---------------- the hand-over record ---------------- */

/**
 * Read only, and there is no sibling that writes.
 *
 * Reached through the leases router, whose `router.param` has already refused a
 * tenancy outside this account's buildings.
 */
export async function listLeaseFurnitureHandler(req: Request, res: Response) {
  const leaseId = parseIdParam(req.params.id, RESOURCE.lease);
  res.status(200).json(await furnitureService.listLeaseFurniture(leaseId));
}
