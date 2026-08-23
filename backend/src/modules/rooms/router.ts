import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createRoomHandler,
  listRoomsHandler,
  getRoomHandler,
  getRoomMeterHandler,
  updateRoomHandler,
  retireRoomHandler,
  restoreRoomHandler,
} from "./controller.js";

export const roomsRouter = Router();

roomsRouter.use(authenticate, requireRole("owner"));

roomsRouter.post("/", createRoomHandler);
roomsRouter.get("/", listRoomsHandler);
roomsRouter.get("/:id", getRoomHandler);
// The room's meter position, asked for on its own rather than carried on every
// room. Resolving it reads across the room's leases and its vacancy expenses,
// which is a cost worth paying for one room and not for twenty in a listing.
roomsRouter.get("/:id/latest-meter-reading", getRoomMeterHandler);
roomsRouter.patch("/:id", updateRoomHandler);
roomsRouter.post("/:id/retire", retireRoomHandler);
roomsRouter.post("/:id/restore", restoreRoomHandler);
