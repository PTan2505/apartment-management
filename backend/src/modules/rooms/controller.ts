import type { Request, Response } from "express";
import { ValidationError } from "@/lib/errors.js";
import { createRoomSchema, updateRoomSchema, listRoomsQuerySchema } from "./schema.js";
import * as roomService from "./service.js";

export async function createRoomHandler(req: Request, res: Response) {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid room payload", parsed.error.flatten());
  }

  const room = await roomService.createRoom(parsed.data);
  res.status(201).json(room);
}

export async function listRoomsHandler(req: Request, res: Response) {
  const parsed = listRoomsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", parsed.error.flatten());
  }

  const rooms = await roomService.listRooms(parsed.data);
  res.status(200).json(rooms);
}

export async function getRoomHandler(req: Request, res: Response) {
  const room = await roomService.getRoomById(req.params.id as string);
  res.status(200).json(room);
}

export async function updateRoomHandler(req: Request, res: Response) {
  const parsed = updateRoomSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid room payload", parsed.error.flatten());
  }

  const room = await roomService.updateRoom(req.params.id as string, parsed.data);
  res.status(200).json(room);
}

export async function retireRoomHandler(req: Request, res: Response) {
  const room = await roomService.retireRoom(req.params.id as string);
  res.status(200).json(room);
}

export async function restoreRoomHandler(req: Request, res: Response) {
  const room = await roomService.restoreRoom(req.params.id as string);
  res.status(200).json(room);
}
