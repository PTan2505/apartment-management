import { Router } from "express";

import { requireRole } from "@/middleware/require-role.js";
import {
  addRoomFurnitureHandler,
  createFurnitureItemHandler,
  listFurnitureItemsHandler,
  listRoomFurnitureHandler,
  removeRoomFurnitureHandler,
  restoreFurnitureItemHandler,
  retireFurnitureItemHandler,
  updateFurnitureItemHandler,
  updateRoomFurnitureHandler,
} from "./controller.js";

/**
 * Two routers, because furniture is reached from two places: a building says
 * what it supplies, and a room says what it actually holds.
 *
 * Both use `mergeParams` so the parent's id is visible, and both are mounted by
 * their parent router rather than at the top level — the same arrangement the
 * service-fee routers use, for the same reason.
 *
 * Authentication is not repeated: both parents apply it before mounting.
 *
 * ── Why writing is the owner's alone, on BOTH levels ───────────────────────
 *
 * Every write here sets or moves a VALUE. The catalogue is what the building
 * paid for its furniture; a room's holdings are what that room is worth to hand
 * over, and they become the figure a departing tenant is charged against. A
 * manager reads all of it — they are the one standing in the room — and changes
 * none of it, matching every other price in the system.
 */

/** Mounted by the buildings router at `/:buildingId/furniture`. */
export const buildingFurnitureRouter = Router({ mergeParams: true });

buildingFurnitureRouter.get("/", requireRole("owner", "manager"), listFurnitureItemsHandler);
buildingFurnitureRouter.post("/", requireRole("owner"), createFurnitureItemHandler);
buildingFurnitureRouter.patch("/:itemId", requireRole("owner"), updateFurnitureItemHandler);
buildingFurnitureRouter.post("/:itemId/retire", requireRole("owner"), retireFurnitureItemHandler);
buildingFurnitureRouter.post("/:itemId/restore", requireRole("owner"), restoreFurnitureItemHandler);

/** Mounted by the rooms router at `/:id/furniture`. */
export const roomFurnitureRouter = Router({ mergeParams: true });

roomFurnitureRouter.get("/", requireRole("owner", "manager"), listRoomFurnitureHandler);
roomFurnitureRouter.post("/", requireRole("owner"), addRoomFurnitureHandler);
roomFurnitureRouter.patch("/:holdingId", requireRole("owner"), updateRoomFurnitureHandler);
roomFurnitureRouter.delete("/:holdingId", requireRole("owner"), removeRoomFurnitureHandler);
