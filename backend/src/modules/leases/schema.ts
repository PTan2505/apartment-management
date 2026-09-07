import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const isoDate = z.coerce.date();

/**
 * Terms of the agreement, as distinct from what it takes to bill it.
 *
 * All optional, on creation and on correction alike. An owner recording a
 * tenancy signed years ago may not have any of them, and demanding one would
 * turn missing history into an obstacle.
 *
 * `reference` is absent on purpose: it is generated, never accepted. A typed
 * reference drifts — two leases get the same one, a typo makes one unfindable,
 * and the field becomes a place people write notes.
 */
const agreementTermFields = {
  noticeDays: z.coerce.number().int().nonnegative("must not be negative").optional(),
  // 1–31 rather than the length of a particular month: it is the day an
  // agreement names, and February is the biller's problem rather than this
  // field's.
  paymentDay: z.coerce.number().int().min(1, "must be between 1 and 31")
    .max(31, "must be between 1 and 31").optional(),
  // Zero is a legitimate reading, so this accepts it and the column stays
  // nullable — "the meter read zero" and "no reading recorded" are different
  // facts and stay different values.
  startWaterReading: z.coerce.number().int().nonnegative("must not be negative").optional(),
  handoverSignedAt: isoDate.optional(),
} as const;

export const createLeaseSchema = z.object({
  roomId: z.coerce.number().int().positive("roomId is required"),
  signatoryId: z.coerce.number().int().positive("signatoryId is required"),
  startDate: isoDate,
  durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
  occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
  // Optional here: the service defaults it to the previous lease's closing
  // reading, and rejects omission only when the room has no previous lease.
  startMeterReading: z.coerce.number().int().nonnegative("must not be negative").optional(),
  // Optional for the same reason: the service defaults it to the room's current
  // base rent. Supplying it records a rent negotiated with this tenant without
  // changing what the room asks of the next one.
  baseRent: z.coerce.number().nonnegative("must not be negative").optional(),
  // Required, and zero is allowed. Defaulting a missing value to zero would
  // make "no deposit" and "forgot to record the deposit" the same record.
  depositMonths: z.coerce
    .number({ message: "depositMonths is required" })
    .int("must be a whole number of months")
    .nonnegative("must not be negative"),
  ...agreementTermFields,
});


/**
 * Correcting the terms of a running tenancy.
 *
 * `.partial()` over the whole object, so correcting one term never demands
 * another. That matters more now than it did: five of these are absent on every
 * tenancy signed before they existed, and requiring one as the price of fixing
 * a rent would turn missing history into an obstacle.
 */
export const updateLeaseSchema = z
  .object({
    durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
    occupantCount: z.coerce.number().int().min(1, "must be at least 1"),
    ...agreementTermFields,
  })
  .partial();

export const extendLeaseSchema = z.object({
  // The electricity of the predecessor's last month still has to be billed, and
  // the successor has to start from somewhere. The tenant not having left
  // changes neither, so the reading is required exactly as at a move-out.
  endMeterReading: z.coerce.number().int().nonnegative("must not be negative"),
  durationMonths: z.coerce.number().int().min(1, "must be at least 1"),
  // Each defaults: the rent from the room's current base rent, the rest from
  // the predecessor. A renewal is where a price rise takes effect.
  baseRent: z.coerce.number().nonnegative("must not be negative").optional(),
  depositMonths: z.coerce.number().int().nonnegative("must not be negative").optional(),
  occupantCount: z.coerce.number().int().min(1, "must be at least 1").optional(),
  // Whether the difference between the deposit carried and the deposit now
  // required is charged on the successor's move-in invoice. Declining leaves it
  // reported as a shortfall or surplus for the owner to settle in cash.
  settleDepositOnInvoice: z.coerce.boolean().default(true),
});

export const moveOutSchema = z.object({
  moveOutDate: isoDate,
  endMeterReading: z.coerce.number().int().nonnegative("must not be negative"),
  // Charges for days beyond the agreed term, named by the owner. Each picks a
  // fee from the building's catalogue — so the name stays comparable with every
  // other bill — while the amount is free, because no agreement covers those
  // days and the fee's current price is a fact about today rather than them.
  //
  // Ignored where the departure falls within the term. An empty list is a
  // deliberate waiver, not an omission.
  overdueCharges: z
    .array(
      z.object({
        buildingServiceFeeId: z.coerce.number().int().positive(),
        amount: z.coerce.number().nonnegative("must not be negative"),
      }),
    )
    .default([]),
});

/**
 * Recording that a tenancy never took place.
 *
 * Both amounts are optional in the SHAPE and required by the SERVICE wherever a
 * holding exists — the rule is that they account for the whole holding, and a
 * schema cannot see the holding. Deliberately no default of any kind: returning
 * everything and keeping everything are both ordinary outcomes, so a default
 * would be a decision made on the owner's behalf and accepted without being
 * noticed.
 */
export const cancelLeaseSchema = z.object({
  // Defaults to now in the service. Settable because an owner may be entering
  // last week's decision, and the month this falls in is the month whatever
  // they kept is earned in.
  cancelledAt: isoDate.optional(),
  depositReturned: z.coerce.number().nonnegative("must not be negative").optional(),
  depositKept: z.coerce.number().nonnegative("must not be negative").optional(),
});

/**
 * Asking for a URL to upload a contract with.
 *
 * The caller names a CONTENT TYPE, never a destination. The key is derived by
 * the service from the tenancy and a random component, so a URL obtained for
 * one tenancy cannot be turned into a write anywhere else.
 *
 * The set is closed rather than free text: it is bound into the signature, so a
 * value nobody vetted would let a URL issued for a document store anything.
 */
export const contractUploadSchema = z.object({
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/heic"]),
});

/** Confirming that an upload reached storage. */
export const contractConfirmSchema = z.object({
  key: z.string().min(1, "key is required"),
});

export const listLeasesQuerySchema = z.object({
  ...paginationQueryFields,
  roomId: z.coerce.number().int().positive().optional(),
  // Every tenancy in a building, without naming its rooms one at a time. An
  // owner with several buildings thinks in buildings first, and a room code
  // means nothing until you know which building it is in.
  buildingId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  active: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
  // Leases whose agreed term has run out while no move-out was recorded. These
  // need attention: no further invoice can be issued for them, and their room
  // stays held against a new tenancy until they are closed or renewed.
  overdue: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export const addOccupantSchema = z.object({
  customerId: z.coerce.number().int().positive("customerId is required"),
  joinedAt: isoDate.optional(),
});

export const departOccupantSchema = z.object({
  leftAt: isoDate,
});

export const transferPrimarySchema = z.object({
  customerId: z.coerce.number().int().positive("customerId is required"),
});

export const listOccupantsQuerySchema = z.object({ ...paginationQueryFields });

export type ListOccupantsQuery = z.infer<typeof listOccupantsQuerySchema>;
export type CreateLeaseInput = z.infer<typeof createLeaseSchema>;
export type UpdateLeaseInput = z.infer<typeof updateLeaseSchema>;
export type ListLeasesQuery = z.infer<typeof listLeasesQuerySchema>;
export type AddOccupantInput = z.infer<typeof addOccupantSchema>;
export type ExtendLeaseInput = z.infer<typeof extendLeaseSchema>;
export type CancelLeaseInput = z.infer<typeof cancelLeaseSchema>;
export type ContractUploadInput = z.infer<typeof contractUploadSchema>;
export type ContractConfirmInput = z.infer<typeof contractConfirmSchema>;
