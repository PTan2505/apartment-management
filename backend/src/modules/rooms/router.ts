import { Router } from "express";
import { authenticate } from "@/middleware/authenticate.js";
import { accountGuard } from "@/middleware/staff-scope.js";
import { requireRole } from "@/middleware/require-role.js";
import { roomFurnitureRouter } from "@/modules/furniture/router.js";
import {
  confirmRoomPhotoHandler,
  createRoomHandler,
  listRoomPhotosHandler,
  removeRoomPhotoHandler,
  roomPhotoDownloadHandler,
  roomPhotoUploadUrlHandler,
  listRoomsHandler,
  getRoomHandler,
  getRoomMeterHandler,
  updateRoomHandler,
  retireRoomHandler,
  restoreRoomHandler,
} from "./controller.js";

export const roomsRouter = Router();

/*
  Staff read rooms; only the owner changes them — the same split the buildings
  router makes, and for the same reason one level down.

  A room is created WITH the rent it asks, so creating one sets a price, and
  correcting one changes a price already set. What a room charges is the
  business deciding what it sells; a manager letting it is carrying that out.
  Retiring and restoring belong on the same side: taking a room off the market
  is a decision about the property, not about this month.

  Reading is deliberately NOT narrowed. A manager quotes the rent, fills the
  tenancy form from it, and reads the meter against it — all of which needs the
  figure they may not change.
*/
roomsRouter.use(authenticate, accountGuard);

roomsRouter.post("/", requireRole("owner"), createRoomHandler);
roomsRouter.get("/", requireRole("owner", "manager"), listRoomsHandler);
roomsRouter.get("/:id", requireRole("owner", "manager"), getRoomHandler);
// The room's meter position, asked for on its own rather than carried on every
// room. Resolving it reads across the room's leases and its vacancy expenses,
// which is a cost worth paying for one room and not for twenty in a listing.
roomsRouter.get("/:id/latest-meter-reading", requireRole("owner", "manager"), getRoomMeterHandler);
roomsRouter.patch("/:id", requireRole("owner"), updateRoomHandler);
roomsRouter.post("/:id/retire", requireRole("owner"), retireRoomHandler);
roomsRouter.post("/:id/restore", requireRole("owner"), restoreRoomHandler);

/*
  Photographs of a room.

  A deliberate exception to "rooms are the owner's": a manager may add and
  remove them though they may not edit the room. What a room CHARGES is the
  business deciding what it sells; what a room LOOKS like is the person
  standing in it with a phone.

  Narrow, and stated here so the next reader does not file it as an oversight.
*/
roomsRouter.get("/:id/photos", requireRole("owner", "manager"), listRoomPhotosHandler);
roomsRouter.post("/:id/photos/upload-url", requireRole("owner", "manager"), roomPhotoUploadUrlHandler);
roomsRouter.post("/:id/photos", requireRole("owner", "manager"), confirmRoomPhotoHandler);
roomsRouter.get("/:id/photos/:photoId/download", requireRole("owner", "manager"), roomPhotoDownloadHandler);
roomsRouter.delete("/:id/photos/:photoId", requireRole("owner", "manager"), removeRoomPhotoHandler);

/*
  What this room actually holds. Two segments deep, so it cannot be captured by
  the single-segment "/:id" routes above.

  On the ROOM rather than on a tenancy: a fridge does not leave when the tenant
  does, and re-entering the list at every signing is how it stops being kept up
  to date.
*/
roomsRouter.use("/:id/furniture", roomFurnitureRouter);
