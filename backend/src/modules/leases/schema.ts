import { z } from "zod";
import { paginationQueryFields } from "@/lib/pagination.js";

const isoDate = z.coerce.date();

/**
 * Terms of the agreement, as distinct from what it takes to bill it.
 *
 * Optional, on creation and on correction alike. An owner recording a tenancy
 * signed years ago may not have the date, and demanding it would turn missing
 * history into an obstacle.
 *
 * `reference` is absent on purpose: it is generated, never accepted. A typed
 * reference drifts — two leases get the same one, a typo makes one unfindable,
 * and the field becomes a place people write notes.
 *
 * Three fields were removed from here — `noticeDays`, `paymentDay` and
 * `startWaterReading` — along with their columns. Every one was accepted,
 * stored, reported, and read by nothing.
 */
const agreementTermFields = {
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
  // Optional for the same reason again: the service defaults each to the
  // building's current rate. Supplied, they record a price agreed with THIS
  // tenant without changing what the building charges the next one.
  electricityRate: z.coerce.number().nonnegative("must not be negative").optional(),
  waterRatePerPerson: z.coerce.number().nonnegative("must not be negative").optional(),
  /*
    Optional, and zero is allowed.

    It used to be required, on the reasoning that defaulting a missing value to
    zero would make "no deposit" and "forgot to record the deposit" the same
    record. That reasoning stands; what changed is where the default comes from.
    Omitting it now resolves to the building's `defaultDepositMonths` — a figure
    the OWNER stated — rather than to zero, so the two cases are still distinct
    and a manager who may not set a deposit has something to fall back on.
  */
  depositMonths: z.coerce
    .number()
    .int("must be a whole number of months")
    .nonnegative("must not be negative")
    .optional(),
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
    /*
      The utility rates this tenancy is billed at.
      
      Editable because the alternative is worse: once a rate lives on the
      tenancy, an owner who raises the building's rates has no way to bring an
      existing tenant along short of renewing them early. Correcting a figure
      that was mistyped at signing has the same shape.

      It changes what this tenancy is billed FROM NOW ON. Invoices already
      issued keep their own line items, which record the rate that produced
      each charge, so nothing already billed moves.
    */
    electricityRate: z.coerce.number().nonnegative("must not be negative"),
    waterRatePerPerson: z.coerce.number().nonnegative("must not be negative"),
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
  // Photographs only. PDF was accepted and is not any more: a contract is kept
  // as the pages it has, and a mixture of pages that display and files that
  // download makes a screen that shows neither well.
  contentType: z.enum(["image/jpeg", "image/png", "image/heic"]),
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
  /*
    Which of the six states to list.

    Replaces the `active` boolean and the `overdue` one. Both were filters
    standing in for a status the row did not report: "active" hid four states,
    and "overdue" answered a question the row itself could not.
  */
  status: z
    .enum(["overdue", "dueSoon", "active", "upcoming", "finalized", "cancelled"])
    .optional(),
  /*
    Two independent bounds, each constraining its own end of a tenancy: `from`
    the day it began, `to` the day it covers to. Given both, they mean
    containment — the tenancies that began AND ended inside the window, which
    is what an owner naming a window is asking for.

    Deliberately not an overlap filter. A tenancy that began years earlier and
    is still running did not begin and end inside the period; returning it
    would answer a different question from the one the two dates ask.
  */
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const addOccupantSchema = z.object({
  customerId: z.coerce.number().int().positive("customerId is required"),
  joinedAt: isoDate.optional(),
});

export const departOccupantSchema = z.object({
  leftAt: isoDate,
  /**
   * Who takes over the agreement, where the person leaving is the one holding
   * it and others remain.
   *
   * Carried on the departure rather than left to a separate transfer call: two
   * requests can half-succeed, and the half that lands — a handover to somebody
   * who never took it over, while the previous holder still lives there — is
   * invisible unless a reader compares the occupant list against the signatory.
   */
  successorId: z.coerce.number().int().positive("successorId must be a customer id").optional(),
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
