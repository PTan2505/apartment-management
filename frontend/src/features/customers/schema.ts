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

/**
 * The number printed on the ID card, as text.
 *
 * ── Why an empty field behaves differently from the phone above ─────────────
 *
 * The API accepts `null` here, so "this person has no number recorded" IS
 * expressible — unlike a phone number, which can only be set. An empty field
 * therefore CLEARS it on an edit, and that is the right way round: a number
 * typed against the wrong person is worse than an absent one, because it is the
 * box copied onto a government form without being re-checked.
 *
 * The emptiness is carried through as an empty string rather than resolved
 * here, because which of "omit" and "clear" it means depends on whether a
 * customer is being created or corrected — and a schema does not know that.
 */
const optionalIdCardNumber = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{9}$|^\d{12}$/.test(value), {
    message: 'Số định danh phải là 9 hoặc 12 chữ số',
  })

export const customerFormSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập tên'),
  phone: optionalPhone,
  idCardNumber: optionalIdCardNumber,
})

export type CustomerFormValues = z.input<typeof customerFormSchema>
export type CustomerFormOutput = z.output<typeof customerFormSchema>

/** What actually goes on the wire: empty means omit on create, clear on edit. */
export type CustomerPayload = Omit<CustomerFormOutput, 'idCardNumber'> & {
  idCardNumber?: string | null
}

export function toCustomerPayload(
  values: CustomerFormOutput,
  isEdit: boolean,
): CustomerPayload {
  const { idCardNumber, ...rest } = values
  if (idCardNumber !== '') return { ...rest, idCardNumber }
  // Create: say nothing. Edit: say null, which is how the API clears it.
  return isEdit ? { ...rest, idCardNumber: null } : rest
}
