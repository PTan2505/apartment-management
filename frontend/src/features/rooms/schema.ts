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

/**
 * The meter reading, which is optional and where an empty field is meaningful.
 *
 * An empty input yields NaN through `valueAsNumber`, and that has to become
 * `undefined` — "nobody has said" — rather than 0. Zero is a statement that the
 * meter reads zero, and the two are different facts: conflating them is what
 * would charge an owner for a meter's entire history as one month of vacancy
 * consumption.
 */
const meterReading = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((value) => (value === undefined || Number.isNaN(value) ? undefined : value))
  .refine((value) => value === undefined || (Number.isInteger(value) && value >= 0), {
    message: 'Must be a whole number, not negative',
  })

/** Creating fixes the building; the API has no way to move a room afterwards. */
export const createRoomFormSchema = z.object({
  buildingId: z.number({ message: 'Choose a building' }).int().positive('Choose a building'),
  roomCode: z.string().trim().min(1, 'Room code is required'),
  baseRent: rent,
  initialMeterReading: meterReading,
})

/**
 * Updating accepts only these two — matching `updateRoomSchema` on the API.
 * The meter reading is deliberately absent: it describes the moment the room
 * was added, and once any tenancy or vacancy record exists the room's position
 * comes from those instead.
 */
export const updateRoomFormSchema = z.object({
  roomCode: z.string().trim().min(1, 'Room code is required'),
  baseRent: rent,
})

export type CreateRoomFormValues = z.input<typeof createRoomFormSchema>
export type CreateRoomFormOutput = z.output<typeof createRoomFormSchema>
export type UpdateRoomFormValues = z.input<typeof updateRoomFormSchema>
export type UpdateRoomFormOutput = z.output<typeof updateRoomFormSchema>
