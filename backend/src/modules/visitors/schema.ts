import { z } from "zod";

import { idCardNumberSchema } from "@/lib/id-card.js";
import { ID_CARD_CONTENT_TYPES, ID_CARD_SIDES } from "@/lib/storage.js";

const isoDate = z.coerce.date();

const idCardNumber = idCardNumberSchema;

/**
 * What the residence form (CT01) requires, and what it tolerates empty.
 *
 * The split is not a judgement about which facts matter — it is copied from the
 * form. A registration missing one of the required four produces paperwork that
 * cannot be filed, discovered by the owner weeks later at the police station.
 * The optional three are routinely filed blank: a visiting grandmother has no
 * workplace and a child has no telephone, and a required field there would be
 * filled with a lie.
 */
const visitorFields = {
  fullName: z.string().trim().min(1, "tên là bắt buộc").max(120),
  idCardNumber,
  dateOfBirth: isoDate,
  sex: z.enum(["male", "female"]),
  /** Nơi thường trú — the whole point of a form saying somebody is elsewhere. */
  permanentAddress: z.string().trim().min(1, "nơi thường trú là bắt buộc").max(300),
  /**
   * Quan hệ với chủ hộ, in the declarant's own words. Free text because the
   * form takes a phrase, and an enum here would be a list somebody maintains
   * forever with "other" at the bottom doing all the work.
   */
  relationToSignatory: z.string().trim().min(1, "quan hệ với chủ hộ là bắt buộc").max(60),

  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("email không hợp lệ").max(200).optional(),
  /** Nghề nghiệp, nơi làm việc — one line, as the form asks it. */
  occupation: z.string().trim().max(200).optional(),

  arrivesOn: isoDate,
  expectedUntil: isoDate,
  note: z.string().trim().max(500).optional(),
};

/**
 * The stay has to end after it begins.
 *
 * Checked here rather than in the service because it is a property of the two
 * values alone — no record is needed to know it — and a zod issue names the
 * field the form should mark.
 */
const endsAfterItStarts = <T extends { arrivesOn: Date; expectedUntil: Date }>(
  value: T,
  ctx: z.RefinementCtx,
) => {
  if (value.expectedUntil.getTime() < value.arrivesOn.getTime()) {
    ctx.addIssue({
      code: "custom",
      path: ["expectedUntil"],
      message: "ngày dự kiến đi phải sau ngày đến",
    });
  }
};

export const createVisitorSchema = z.object(visitorFields).superRefine(endsAfterItStarts);

/**
 * Correcting a registration.
 *
 * Every field optional, and at least one required — the same shape the lease
 * update uses. The two dates are refined only when BOTH arrive, because
 * checking a new end date against an old start date would need the record, and
 * the service holds that check.
 */
export const updateVisitorSchema = z
  .object({
    fullName: visitorFields.fullName.optional(),
    idCardNumber: idCardNumber.optional(),
    dateOfBirth: isoDate.optional(),
    sex: visitorFields.sex.optional(),
    permanentAddress: visitorFields.permanentAddress.optional(),
    relationToSignatory: visitorFields.relationToSignatory.optional(),
    // Nullable as well as optional: absent means "leave it", null means
    // "clear it". A number typed against the wrong person is worse than an
    // absent one, because it is the box copied onto a form without re-checking.
    phone: z.string().trim().max(20).nullable().optional(),
    email: z.string().trim().email("email không hợp lệ").max(200).nullable().optional(),
    occupation: z.string().trim().max(200).nullable().optional(),
    arrivesOn: isoDate.optional(),
    expectedUntil: isoDate.optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "không có gì để cập nhật",
  });

export const visitorIdCardUploadSchema = z.object({
  side: z.enum(ID_CARD_SIDES),
  contentType: z.enum(ID_CARD_CONTENT_TYPES),
});

export const visitorIdCardConfirmSchema = z.object({
  side: z.enum(ID_CARD_SIDES),
  key: z.string().min(1, "key is required"),
});

/**
 * Finding registrations across the buildings the caller covers.
 *
 * `staying` is the question the owner actually asks — who is in my building
 * right now — and `overlong` is the one this feature exists for.
 */
export const listVisitorsQuerySchema = z.object({
  buildingId: z.coerce.number().int().positive().optional(),
  leaseId: z.coerce.number().int().positive().optional(),
  state: z.enum(["all", "upcoming", "staying", "finished", "cancelled"]).default("all"),
  overlong: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateVisitorInput = z.infer<typeof createVisitorSchema>;
export type UpdateVisitorInput = z.infer<typeof updateVisitorSchema>;
export type VisitorIdCardUploadInput = z.infer<typeof visitorIdCardUploadSchema>;
export type VisitorIdCardConfirmInput = z.infer<typeof visitorIdCardConfirmSchema>;
export type ListVisitorsQuery = z.infer<typeof listVisitorsQuerySchema>;
