import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { requireRole } from "@/middleware/require-role.js";
import {
  createRoomHandler,
  listRoomsHandler,
  getRoomHandler,
  updateRoomHandler,
  retireRoomHandler,
  restoreRoomHandler,
} from "./controller.js";

export const roomsRouter = Router();

roomsRouter.use(authenticate, requireRole("owner"));

roomsRouter.post("/", createRoomHandler);
roomsRouter.get("/", listRoomsHandler);
roomsRouter.get("/:id", getRoomHandler);
roomsRouter.patch("/:id", updateRoomHandler);
roomsRouter.post("/:id/retire", retireRoomHandler);
roomsRouter.post("/:id/restore", restoreRoomHandler);
