import { z } from 'zod'

/**
 * Mirrors the API's lease schemas, and goes no further.
 *
 * In particular, whether a room is free is NOT decided here. The form offers
 * only vacant rooms, but a room can be let between opening the form and
 * submitting it, and only the API can settle that — a client-side check would
 * either reject a room that was free or accept one that was not.
 */

const wholeMonths = z
  .number({ message: 'Enter a number of months' })
  .int('Must be a whole number of months')

export const createLeaseFormSchema = z.object({
  roomId: z.number({ message: 'Choose a room' }).int().positive('Choose a room'),
  signatoryId: z.number({ message: 'Choose a tenant' }).int().positive('Choose a tenant'),
  startDate: z.string().min(1, 'Start date is required'),
  durationMonths: wholeMonths.min(1, 'Must be at least 1 month'),
  occupantCount: z
    .number({ message: 'Enter how many people to bill for' })
    .int('Must be a whole number')
    .min(1, 'Must be at least 1'),
  /**
   * Required, and zero is accepted.
   *
   * Not optional-defaulting-to-zero: that would record "no deposit was taken"
   * and "the deposit was not recorded" identically, and only one of those is
   * safe to act on later. The API requires it for the same reason.
   */
  depositMonths: wholeMonths.nonnegative('Must not be negative'),
  /** Absent means the room's current rent. */
  baseRent: z.number().nonnegative('Must not be negative').optional(),
  /** Absent means the previous tenancy's closing reading. */
  startMeterReading: z
    .number()
    .int('Must be a whole number')
    .nonnegative('Must not be negative')
    .optional(),
})

/** Only these two, matching what the API accepts on a running lease. */
export const updateLeaseFormSchema = z.object({
  durationMonths: wholeMonths.min(1, 'Must be at least 1 month'),
  occupantCount: z
    .number({ message: 'Enter how many people to bill for' })
    .int('Must be a whole number')
    .min(1, 'Must be at least 1'),
})

export type CreateLeaseFormValues = z.input<typeof createLeaseFormSchema>
export type CreateLeaseFormOutput = z.output<typeof createLeaseFormSchema>
export type UpdateLeaseFormOutput = z.output<typeof updateLeaseFormSchema>
