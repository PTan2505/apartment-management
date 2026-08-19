import { z } from 'zod'

/**
 * Mirrors the API's create schema field for field, and goes no further.
 *
 * The backend requires a non-empty name, address, ward and city, non-negative
 * rates, and defaults the country. Adding a rule it does not have — a rate
 * ceiling, an address pattern, a phone-shaped anything — would reject input the
 * API would have accepted, and the rejection would be invisible from the
 * backend. The API owns correctness; this only avoids a pointless round trip.
 */

const rate = z
  .number({ message: 'Enter a number' })
  .nonnegative('Must not be negative')

export const buildingFormSchema = z.object({
  displayName: z.string().trim().min(1, 'Name is required'),
  address: z.string().trim().min(1, 'Street address is required'),
  ward: z.string().trim().min(1, 'Ward is required'),
  city: z.string().trim().min(1, 'City is required'),
  // Defaulted rather than required, matching the API.
  country: z.string().trim().min(1, 'Country is required').default('Vietnam'),
  electricityRate: rate,
  waterRatePerPerson: rate,
  // Which place the address was resolved from. Absent for an address typed by
  // hand, and cleared when a resolved one is corrected — the identifier claims
  // the values came from that place, and once edited that is no longer true.
  placeId: z.string().min(1).nullish(),
})

export type BuildingFormValues = z.input<typeof buildingFormSchema>
export type BuildingFormOutput = z.output<typeof buildingFormSchema>
