import { z } from 'zod'

/**
 * Mirrors the backend's login schema exactly: both fields required, nothing
 * more.
 *
 * The instinct is to add a phone-format rule here. Resist it. The backend
 * validates `min(1)` and nothing else, so any stricter rule becomes a
 * credential this form rejects and the API would have accepted — a failure
 * invisible from the backend and confusing to whoever hits it. The API owns
 * credential correctness; this schema only avoids a pointless round-trip on an
 * empty field.
 */
export const loginFormSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
