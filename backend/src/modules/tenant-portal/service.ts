import { prisma } from "@/lib/prisma.js";
import { NotFoundError } from "@/lib/errors.js";
import {
  decryptToken,
  encryptToken,
  generateOpaqueToken,
  hashOpaqueToken,
} from "@/lib/opaque-token.js";
import type { Prisma } from "@/generated/prisma/client.js";
import { createGatewayPayment } from "@/modules/payment-gateway/service.js";
import * as reports from "@/modules/damage-reports/service.js";
import type {
  CreateReportInput,
  ReportPhotoConfirmInput,
  ReportPhotoUploadInput,
} from "@/modules/damage-reports/schema.js";
import { toPortalInvoice } from "./mapper.js";

/* ------------------------------------------------------------------ */
/* The owner's half: issuing, showing and withdrawing a link           */
/* ------------------------------------------------------------------ */

/**
 * Creates a tenancy's link, revoking whatever it had.
 *
 * Takes a transaction client so a tenancy and its link are created together:
 * a tenancy that exists without one is a tenancy whose tenant cannot pay,
 * discovered later by somebody wondering why there is no link to send.
 *
 * The token is stored twice over — hashed to be FOUND, encrypted to be SHOWN.
 * See `opaque-token.ts` for why each is the shape it is.
 */
export async function issueLeasePortalToken(
  tx: Prisma.TransactionClient,
  leaseId: number,
): Promise<string> {
  const token = generateOpaqueToken();

  await tx.leasePortalToken.updateMany({
    where: { leaseId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await tx.leasePortalToken.create({
    data: { leaseId, tokenHash: hashOpaqueToken(token), tokenCipher: encryptToken(token) },
  });

  return token;
}

async function findLease(leaseId: number) {
  const lease = await prisma.lease.findUnique({ where: { id: leaseId }, select: { id: true } });
  if (!lease) {
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }
  return lease;
}

/** Replaces a tenancy's link. The previous one stops working immediately. */
export async function reissueLeasePortalLink(leaseId: number) {
  await findLease(leaseId);
  const token = await prisma.$transaction((tx) => issueLeasePortalToken(tx, leaseId));
  return getLeasePortalLink(leaseId, token);
}

/**
 * The tenancy's current link, as the owner needs it: the token itself, when it
 * was issued, and whether anybody has ever opened it.
 *
 * `token` is null in two different situations, told apart by `hasLink`: there
 * is no link at all, or there is one that cannot be decrypted because the
 * application secret has changed since. The second still WORKS — a presented
 * token is found by its hash — so the honest report is "it exists and cannot be
 * shown", and reissuing gives one that can.
 */
export async function getLeasePortalLink(leaseId: number, justIssued?: string) {
  await findLease(leaseId);

  const active = await prisma.leasePortalToken.findFirst({
    where: { leaseId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { tokenCipher: true, createdAt: true, lastUsedAt: true },
  });

  if (!active) {
    return { leaseId, hasLink: false, token: null, issuedAt: null, lastUsedAt: null };
  }

  return {
    leaseId,
    hasLink: true,
    token: justIssued ?? decryptToken(active.tokenCipher),
    issuedAt: active.createdAt,
    lastUsedAt: active.lastUsedAt,
  };
}

/** Leaves the tenancy with no working link at all. */
export async function revokeLeasePortalLink(leaseId: number) {
  await findLease(leaseId);

  const active = await prisma.leasePortalToken.findFirst({
    where: { leaseId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!active) {
    throw new NotFoundError("PORTAL_LINK_NONE", "That tenancy has no portal link");
  }

  await prisma.leasePortalToken.update({
    where: { id: active.id },
    data: { revokedAt: new Date() },
  });

  return { leaseId, revokedAt: new Date() };
}

/* ------------------------------------------------------------------ */
/* The tenant's half: using a link                                     */
/* ------------------------------------------------------------------ */

/**
 * Resolves a presented token to the tenancy it belongs to, and records the use.
 *
 * By HASH alone: nothing is decrypted on a public request, so the encryption
 * key is never touched by a stranger's call and the lookup stays one indexed
 * equality.
 *
 * A token that is unknown, revoked, or not a token at all produces the same
 * NotFoundError. The distinction somebody probing wants is exactly the one
 * between "never existed" and "existed and was withdrawn" — the second confirms
 * a guess — and with no rate limit to blunt that, the answers have to be
 * indistinguishable.
 */
async function resolveToken(token: string) {
  const row = await prisma.leasePortalToken.findUnique({
    where: { tokenHash: hashOpaqueToken(token) },
    select: {
      id: true,
      leaseId: true,
      revokedAt: true,
      lease: {
        select: {
          id: true,
          /*
            Who signed, if anyone still holds it. A tenancy has no `tenant`
            column — the signatory is the occupant carrying `isPrimary`, and on
            a closed tenancy that is whoever held it at the end. Both are
            wanted here: the portal outlives the tenancy it belongs to, because
            the final bill is issued as the tenancy closes.
          */
          occupants: {
            where: { isPrimary: true },
            select: { leftAt: true, user: { select: { fullName: true, phone: true } } },
            orderBy: { joinedAt: "desc" },
          },
          room: { select: { roomCode: true, building: { select: { displayName: true } } } },
        },
      },
    },
  });

  if (!row || row.revokedAt !== null) {
    throw new NotFoundError("PORTAL_NOT_FOUND", "Portal not found");
  }

  await prisma.leasePortalToken.update({
    where: { id: row.id },
    data: { lastUsedAt: new Date() },
  });

  return row.lease;
}

/**
 * What a link may see: the bills of its own tenancy, and nothing else.
 *
 * One rule, used by both the reading and the paying — a token that cannot show
 * an invoice must not be able to pay one, and two copies of this would
 * eventually disagree about which.
 *
 * Every invoice of the tenancy, paid and unpaid. The occupancy-derived version
 * this replaces had to carve out an exception for the final bill, issued at the
 * moment somebody stops being an occupant; a link that belongs to the tenancy
 * needs no exception, because moving out does not change which tenancy it is
 * for.
 */
function visibleInvoiceFilter(leaseId: number): Prisma.InvoiceWhereInput {
  // Withdrawn bills are not shown. They were withdrawn.
  return { leaseId, voidedAt: null };
}

export async function getPortalOverview(token: string) {
  const lease = await resolveToken(token);
  const signatory = (lease.occupants.find((o) => o.leftAt === null) ?? lease.occupants[0])?.user;

  const invoices = await prisma.invoice.findMany({
    where: visibleInvoiceFilter(lease.id),
    select: {
      id: true,
      type: true,
      issueDate: true,
      year: true,
      month: true,
      periodStart: true,
      periodEnd: true,
      previousElectricityUse: true,
      currentElectricityUse: true,
      totalAmount: true,
      paymentStatus: true,
      lineItems: {
        select: {
          kind: true,
          description: true,
          quantity: true,
          unitAmount: true,
          periodStart: true,
          periodEnd: true,
          amount: true,
          position: true,
        },
      },
      lease: {
        select: {
          room: {
            select: { roomCode: true, building: { select: { displayName: true } } },
          },
        },
      },
      /*
        The payments, ONCE, carrying what both questions need — whether an
        attempt is under way, and when one landed.

        Selected once rather than twice under two names, which is not something
        Prisma allows: a relation appears in a `select` once, and a second entry
        for the same relation is an unknown field. The filtering that used to be
        in the query therefore moves to the mapper.
      */
      payments: {
        select: { id: true, state: true, paidAt: true, reversedAt: true },
        orderBy: { paidAt: "desc" },
      },
    },
    // Newest first: what a tenant opens the portal to check is almost always
    // the most recent bill.
    orderBy: { issueDate: "desc" },
  });

  return {
    /*
      Who the bills are addressed to, which may be nobody: a tenancy can run
      with no signatory named. Reported as null rather than filled in with
      something plausible — this page is about money, and a name invented for
      the sake of a non-empty field is a statement nobody made.
    */
    tenant: {
      fullName: signatory?.fullName ?? null,
      phone: signatory?.phone ?? null,
    },
    room: {
      roomCode: lease.room.roomCode,
      buildingName: lease.room.building.displayName,
    },
    invoices: invoices.map(toPortalInvoice),
  };
}

/**
 * Starts a payment for one of this tenancy's unpaid bills.
 *
 * The bills payable are exactly the bills visible, resolved by the same filter
 * the overview uses — so a request to pay an invoice the token cannot see fails
 * the same way a request to view it would, and for the same reason.
 */
export async function startPortalPayment(
  token: string,
  invoiceId: number,
  urls: { returnUrl: string; cancelUrl: string },
) {
  const lease = await resolveToken(token);

  const visible = await prisma.invoice.findFirst({
    where: { AND: [{ id: invoiceId }, visibleInvoiceFilter(lease.id)] },
    select: { id: true },
  });
  // Indistinguishable from an invoice that does not exist. A tenant learning
  // which invoice ids are real is a tenant learning about other tenancies.
  if (!visible) {
    throw new NotFoundError("INVOICE_NOT_FOUND", "Invoice not found");
  }

  return createGatewayPayment(invoiceId, urls);
}

/* ------------------------------------------------------------------ */
/* Reporting something broken                                          */
/* ------------------------------------------------------------------ */

/**
 * A report raised from a portal link.
 *
 * The tenancy comes from the token, so the room and the building follow from
 * it — a tenant never names where they live, because a tenant who can name a
 * room can name somebody else's.
 *
 * Accepted from a tenancy that has ended: something found broken after a
 * move-out is exactly when this matters.
 */
export async function raisePortalReport(token: string, input: CreateReportInput) {
  const lease = await resolveToken(token);
  return reports.raiseReport(lease.id, input);
}

/** The reports raised from this link, with their state and any appointment. */
export async function listPortalReports(token: string) {
  const lease = await resolveToken(token);
  return reports.listReportsForLease(lease.id);
}

/**
 * Photographs, through the same three-step path as a contract page.
 *
 * Both steps re-check the report belongs to the token's tenancy. A report id
 * is a number, and the link that reaches this endpoint is held by somebody the
 * system knows nothing else about.
 */
async function ownReportOrThrow(token: string, reportId: number) {
  const lease = await resolveToken(token);
  const report = await prisma.damageReport.findFirst({
    where: { id: reportId, leaseId: lease.id },
    select: { id: true },
  });
  if (!report) {
    throw new NotFoundError("REPORT_NOT_FOUND", "Report not found");
  }
  return report;
}

export async function signPortalReportPhoto(
  token: string,
  reportId: number,
  input: ReportPhotoUploadInput,
) {
  await ownReportOrThrow(token, reportId);
  return reports.signPhotoUpload(reportId, input);
}

export async function confirmPortalReportPhoto(
  token: string,
  reportId: number,
  input: ReportPhotoConfirmInput,
) {
  await ownReportOrThrow(token, reportId);
  return reports.confirmPhoto(reportId, input);
}
