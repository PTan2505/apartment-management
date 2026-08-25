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

export const createLeaseFormSchema = z.object({
  roomId: z.number({ message: 'Chọn phòng' }).int().positive('Chọn phòng'),
  signatoryId: z.number({ message: 'Chọn người đứng tên' }).int().positive('Chọn người đứng tên'),
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

/** Only these two, matching what the API accepts on a running lease. */
export const updateLeaseFormSchema = z.object({
  durationMonths: wholeMonths.min(1, 'Tối thiểu 1 tháng'),
  occupantCount: z
    .number({ message: 'Nhập số người dùng để tính tiền' })
    .int('Phải là số nguyên')
    .min(1, 'Tối thiểu là 1'),
})

export type CreateLeaseFormValues = z.input<typeof createLeaseFormSchema>
export type CreateLeaseFormOutput = z.output<typeof createLeaseFormSchema>
export type UpdateLeaseFormOutput = z.output<typeof updateLeaseFormSchema>
