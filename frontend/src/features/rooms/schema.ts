import { z } from 'zod'

/**
 * Mirrors the API's schemas, and goes no further.
 *
 * In particular room-code uniqueness is NOT checked here. A code is unique only
 * among rooms in service in one building, and a retired room's code becomes
 * reusable — the client cannot know, and guessing would reject codes the API
 * would have accepted.
 */

const rent = z.number({ message: 'Enter a number' }).nonnegative('Must not be negative')

/** Creating fixes the building; the API has no way to move a room afterwards. */
export const createRoomFormSchema = z.object({
  buildingId: z.number({ message: 'Choose a building' }).int().positive('Choose a building'),
  roomCode: z.string().trim().min(1, 'Room code is required'),
  baseRent: rent,
})

/** Updating accepts only these two — matching `updateRoomSchema` on the API. */
export const updateRoomFormSchema = z.object({
  roomCode: z.string().trim().min(1, 'Room code is required'),
  baseRent: rent,
})

export type CreateRoomFormValues = z.input<typeof createRoomFormSchema>
export type CreateRoomFormOutput = z.output<typeof createRoomFormSchema>
export type UpdateRoomFormValues = z.input<typeof updateRoomFormSchema>
export type UpdateRoomFormOutput = z.output<typeof updateRoomFormSchema>
