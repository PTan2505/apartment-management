import { z } from 'zod'

/**
 * Mirrors the API's schemas, and goes no further.
 *
 * Phone uniqueness is NOT checked here. Whether a number is free is something
 * only the API knows, and it answers differently depending on who holds it — an
 * existing customer is matched, an owner account is rejected. Guessing here
 * could only get it wrong.
 *
 * ── On clearing a phone number ──────────────────────────────────────────────
 *
 * The API cannot remove one. Its update schema accepts `phone` as a non-empty
 * string or not at all — there is no null and no empty string, so "this person
 * no longer has a phone" is not expressible.
 *
 * So an empty field means "leave it as it is", and the form says so rather than
 * accepting the edit and silently discarding it. Sending an empty string
 * instead would be rejected as invalid; sending null would be rejected too.
 */

const optionalPhone = z
  .string()
  .trim()
  // An empty field is absence, not a value. Undefined is omitted from the
  // request entirely, which is the only way the API expresses "no phone".
  .transform((value) => (value === '' ? undefined : value))
  .optional()

export const customerFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required'),
  phone: optionalPhone,
})

export type CustomerFormValues = z.input<typeof customerFormSchema>
export type CustomerFormOutput = z.output<typeof customerFormSchema>
