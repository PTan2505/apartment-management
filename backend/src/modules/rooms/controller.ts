import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { parseIdParam, RESOURCE } from "@/lib/parse-id.js";
import { scopeOf } from "@/middleware/staff-scope.js";
import {
  createRoomSchema,
  updateRoomSchema,
  listRoomsQuerySchema,
  roomPhotoConfirmSchema,
  roomPhotoUploadSchema,
} from "./schema.js";
import * as roomService from "./service.js";

export async function createRoomHandler(req: Request, res: Response) {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("ROOM_PAYLOAD_INVALID", "Invalid room payload", parsed.error.flatten());
  }

  const room = await roomService.createRoom(parsed.data, scopeOf(req));
  res.status(201).json(room);
}

export async function listRoomsHandler(req: Request, res: Response) {
  const parsed = listRoomsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("QUERY_INVALID", "Invalid query parameters", parsed.error.flatten());
  }

  const rooms = await roomService.listRooms(parsed.data, scopeOf(req));
  res.status(200).json(rooms);
}

export async function getRoomHandler(req: Request, res: Response) {
  const room = await roomService.getRoomById(parseIdParam(req.params.id, RESOURCE.room), scopeOf(req));
  res.status(200).json(room);
}

export async function updateRoomHandler(req: Request, res: Response) {
  const parsed = updateRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("ROOM_PAYLOAD_INVALID", "Invalid room payload", parsed.error.flatten());
  }

  const room = await roomService.updateRoom(parseIdParam(req.params.id, RESOURCE.room), parsed.data, scopeOf(req));
  res.status(200).json(room);
}

export async function retireRoomHandler(req: Request, res: Response) {
  const room = await roomService.retireRoom(parseIdParam(req.params.id, RESOURCE.room), scopeOf(req));
  res.status(200).json(room);
}

export async function restoreRoomHandler(req: Request, res: Response) {
  const room = await roomService.restoreRoom(parseIdParam(req.params.id, RESOURCE.room), scopeOf(req));
  res.status(200).json(room);
}

export async function getRoomMeterHandler(req: Request, res: Response) {
  const reading = await roomService.getLatestMeterReading(parseIdParam(req.params.id, RESOURCE.room), scopeOf(req));
  res.status(200).json(reading);
}

/* ------------------------------------------------------------------ */
/* Photographs                                                         */
/* ------------------------------------------------------------------ */

export async function listRoomPhotosHandler(req: Request, res: Response) {
  const photos = await roomService.listRoomPhotos(
    parseIdParam(req.params.id, RESOURCE.room),
    scopeOf(req),
  );
  res.status(200).json({ photos });
}

export async function roomPhotoUploadUrlHandler(req: Request, res: Response) {
  const parsed = roomPhotoUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("ROOM_PHOTO_PAYLOAD_INVALID", "Invalid photo request", parsed.error.flatten());
  }

  const signed = await roomService.signRoomPhotoUpload(
    parseIdParam(req.params.id, RESOURCE.room),
    parsed.data,
    scopeOf(req),
  );
  res.status(200).json(signed);
}

export async function confirmRoomPhotoHandler(req: Request, res: Response) {
  const parsed = roomPhotoConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("ROOM_PHOTO_PAYLOAD_INVALID", "Invalid photo request", parsed.error.flatten());
  }

  const photos = await roomService.confirmRoomPhoto(
    parseIdParam(req.params.id, RESOURCE.room),
    parsed.data,
    scopeOf(req),
  );
  res.status(201).json({ photos });
}

export async function roomPhotoDownloadHandler(req: Request, res: Response) {
  const signed = await roomService.roomPhotoDownload(
    parseIdParam(req.params.id, RESOURCE.room),
    parseIdParam(req.params.photoId, RESOURCE.roomPhoto),
    scopeOf(req),
  );
  res.status(200).json(signed);
}

export async function removeRoomPhotoHandler(req: Request, res: Response) {
  const photos = await roomService.removeRoomPhoto(
    parseIdParam(req.params.id, RESOURCE.room),
    parseIdParam(req.params.photoId, RESOURCE.roomPhoto),
    scopeOf(req),
  );
  res.status(200).json({ photos });
}
