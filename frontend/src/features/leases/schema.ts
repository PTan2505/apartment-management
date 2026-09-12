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
  .number({ message: 'Nhập số tháng' })
  .int('Phải là số tháng nguyên')

/**
 * The person responsible, which is one of two things.
 *
 * Either somebody already on file — an id — or somebody being added here, a
 * name and a phone number. The form models both rather than pretending the
 * second is a special case of the first, because the two need different
 * validation and produce different work at submit.
 *
 * The phone number is REQUIRED for a new person, though the customers screen
 * keeps it optional. It is the only value the system recognises a returning
 * tenant by: a signatory recorded without one becomes a second record of the
 * same name the next time they rent.
 */
export const signatorySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('existing'),
    customerId: z.number().int().positive('Chọn người đứng tên'),
  }),
  z.object({
    kind: z.literal('new'),
    fullName: z.string().trim().min(1, 'Nhập tên người đứng tên'),
    phone: z
      .string()
      .trim()
      .min(1, 'Người đứng tên cần số điện thoại, vì đó là thứ dùng để nhận ra họ lần sau'),
  }),
])

export type SignatoryValue = z.infer<typeof signatorySchema>

export const createLeaseFormSchema = z.object({
  roomId: z.number({ message: 'Chọn phòng' }).int().positive('Chọn phòng'),
  signatory: signatorySchema,
  startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  durationMonths: wholeMonths.min(1, 'Tối thiểu 1 tháng'),
  occupantCount: z
    .number({ message: 'Nhập số người dùng để tính tiền' })
    .int('Phải là số nguyên')
    .min(1, 'Tối thiểu là 1'),
  /**
   * Required, and zero is accepted.
   *
   * Not optional-defaulting-to-zero: that would record "no deposit was taken"
   * and "the deposit was not recorded" identically, and only one of those is
   * safe to act on later. The API requires it for the same reason.
   */
  depositMonths: wholeMonths.nonnegative('Không được là số âm'),
  /** Absent means the room's current rent. */
  baseRent: z.number().nonnegative('Không được là số âm').optional(),
  /** Absent means the previous tenancy's closing reading. */
  startMeterReading: z
    .number()
    .int('Phải là số nguyên')
    .nonnegative('Không được là số âm')
    .optional(),
})

/**
 * A field left alone is not sent at all.
 *
 * An empty number input reads back as NaN, and an empty date input as ''. Both
 * have to become `undefined` rather than reaching the API, because the API
 * treats every agreement term as optional and has no way to express "set this
 * back to null" — so a blank field cannot mean "clear it" without inventing a
 * convention the API does not have. Clearing a recorded term is therefore not
 * offered, rather than offered and silently ignored.
 */
function untouched(value: unknown): unknown {
  if (value === '' || value === null) return undefined
  if (typeof value === 'number' && Number.isNaN(value)) return undefined
  return value
}

const optionalDays = z.preprocess(
  untouched,
  z
    .number({ message: 'Nhập số ngày' })
    .int('Phải là số nguyên')
    .nonnegative('Không được âm')
    .optional(),
)

/** What the API accepts on a running lease, and nothing beyond it. */
export const updateLeaseFormSchema = z.object({
  durationMonths: wholeMonths.min(1, 'Tối thiểu 1 tháng'),
  occupantCount: z
    .number({ message: 'Nhập số người dùng để tính tiền' })
    .int('Phải là số nguyên')
    .min(1, 'Tối thiểu là 1'),
  noticeDays: optionalDays,
  /*
    1–31, matching the API. NOT clamped to the length of any particular month:
    this records the day the agreement names, and what the biller does with a
    payment day of 31 in February is a separate question this field must not
    answer on its behalf.
  */
  paymentDay: z.preprocess(
    untouched,
    z
      .number({ message: 'Nhập ngày trong tháng' })
      .int('Phải là số nguyên')
      .min(1, 'Phải từ 1 đến 31')
      .max(31, 'Phải từ 1 đến 31')
      .optional(),
  ),
  startWaterReading: z.preprocess(
    untouched,
    z
      .number({ message: 'Nhập số nước' })
      .int('Phải là số nguyên')
      .nonnegative('Không được âm')
      .optional(),
  ),
  handoverSignedAt: z.preprocess(
    untouched,
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Chọn ngày hợp lệ').optional(),
  ),
})

export type CreateLeaseFormValues = z.input<typeof createLeaseFormSchema>
export type CreateLeaseFormOutput = z.output<typeof createLeaseFormSchema>
/**
 * Input and output differ here, and the form needs both.
 *
 * The optional terms go through `z.preprocess`, so what the inputs hand back —
 * '' from a date, NaN from a number — is wider than what the API is sent. The
 * form is typed on the input and `handleSubmit` hands back the output.
 */
export type UpdateLeaseFormValues = z.input<typeof updateLeaseFormSchema>
export type UpdateLeaseFormOutput = z.output<typeof updateLeaseFormSchema>

/**
 * The billed count on its own, for the edit beside "Tính tiền cho".
 *
 * Not a slice of `updateLeaseFormSchema`: that one preprocesses optional terms
 * and types its input apart from its output, none of which applies to one
 * required whole number. Same messages, so the field reads the same in both
 * dialogs.
 */
export const occupantCountFormSchema = z.object({
  occupantCount: z
    .number({ message: 'Nhập số người dùng để tính tiền' })
    .int('Phải là số nguyên')
    .min(1, 'Tối thiểu là 1'),
})

export type OccupantCountFormValues = z.infer<typeof occupantCountFormSchema>
