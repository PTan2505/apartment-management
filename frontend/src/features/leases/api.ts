import { apiClient } from '@/lib/api-client'
import { storageFetch } from '@/lib/storage-fetch'
import type { CreateLeaseFormOutput, UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { Lease, ListLeasesParams, Occupant, Paginated } from '@/features/leases/types'
import type { ServiceFeeBasis } from '@/features/buildings/types'

function toQuery(params: ListLeasesParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.roomId) query.roomId = params.roomId
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.customerId) query.customerId = params.customerId
  // Absent means every state, so only a chosen one is sent.
  if (params.status) query.status = params.status
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  return query
}

export async function listLeases(params: ListLeasesParams): Promise<Paginated<Lease>> {
  const { data } = await apiClient.get<Paginated<Lease>>('/leases', { params: toQuery(params) })
  return data
}

export async function getLease(id: number): Promise<Lease> {
  const { data } = await apiClient.get<Lease>(`/leases/${id}`)
  return data
}

/** Answers 409 when the room acquired a tenancy since the form was opened. */
export async function createLease(input: CreateLeaseFormOutput): Promise<Lease> {
  const { data } = await apiClient.post<Lease>('/leases', input)
  return data
}

/** Answers 409 on a lease that has recorded a move-out. */
export async function updateLease(
  id: number,
  input: Partial<UpdateLeaseFormOutput>,
): Promise<Lease> {
  const { data } = await apiClient.patch<Lease>(`/leases/${id}`, input)
  return data
}

/**
 * Records that a tenancy never took place, and settles whatever deposit was
 * held against it.
 *
 * Both amounts are sent together or neither is. Where a holding exists the API
 * requires them to account for all of it and answers 400 otherwise; where
 * nothing was collected it answers 400 for amounts sent anyway. Answers 409 on
 * a tenancy that has been billed a month, has ended, or was already cancelled.
 */
export async function cancelLease(
  id: number,
  settlement: { depositReturned: number; depositKept: number } | null,
): Promise<Lease> {
  const { data } = await apiClient.post<Lease>(`/leases/${id}/cancel`, settlement ?? {})
  return data
}

export async function listOccupants(leaseId: number): Promise<Paginated<Occupant>> {
  const { data } = await apiClient.get<Paginated<Occupant>>(`/leases/${leaseId}/occupants`, {
    // Occupants of one tenancy are few, and the screen shows the whole history
    // rather than paging it — somebody who left is the point of the record.
    params: { pageSize: 200 },
  })
  return data
}

/** Answers 409 when that person is already a current occupant. */
export async function addOccupant(leaseId: number, customerId: number): Promise<Occupant> {
  const { data } = await apiClient.post<Occupant>(`/leases/${leaseId}/occupants`, { customerId })
  return data
}

/**
 * Answers 409 when the occupant is the one responsible and others remain —
 * responsibility has to pass to somebody first. `DepartOccupantDialog` performs
 * that transfer rather than surfacing the refusal.
 */
export async function departOccupant(
  leaseId: number,
  occupantId: number,
  leftAt: string,
  /** Who takes over the agreement, where this occupant is the one holding it. */
  successorId?: number,
): Promise<Occupant> {
  const { data } = await apiClient.post<Occupant>(
    `/leases/${leaseId}/occupants/${occupantId}/depart`,
    successorId === undefined ? { leftAt } : { leftAt, successorId },
  )
  return data
}

/** Answers 400 when the person is not a current occupant of this lease. */
export async function transferPrimary(leaseId: number, customerId: number): Promise<Lease> {
  const { data } = await apiClient.post<Lease>(
    `/leases/${leaseId}/occupants/transfer-primary`,
    { customerId },
  )
  return data
}

/**
 * Photographs, and nothing else.
 *
 * PDF was accepted here and is not any more: a contract is kept as the pages it
 * has, and a screen that shows some pages and offers others as downloads shows
 * neither well.
 */
export const CONTRACT_ACCEPT = 'image/jpeg,image/png,image/heic'

export interface SignedUpload {
  url: string
  key: string
  expiresAt: string
  maxBytes: number
}

/** One photographed page, with a link that expires in minutes. */
export interface ContractPage {
  id: number
  contentType: string
  uploadedAt: string
  url: string
  expiresAt: string
}

/**
 * Asks for a URL to upload one page with.
 *
 * Answers 503 where storage is not configured on the server — a state, not a
 * fault, and one the screen says out loud rather than offering an action that
 * cannot work.
 */
export async function signContractUpload(
  leaseId: number,
  contentType: string,
): Promise<SignedUpload> {
  const { data } = await apiClient.post<SignedUpload>(
    `/leases/${leaseId}/contract-upload-url`,
    { contentType },
  )
  return data
}

/**
 * Sends the file to storage, NOT through the API.
 *
 * A plain `fetch` rather than the API client: this request carries no session,
 * goes to another host entirely, and must send exactly the Content-Type that
 * was bound into the signature — anything else and storage refuses it.
 */
export async function uploadToStorage(signed: SignedUpload, file: File): Promise<void> {
  const response = await storageFetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Kho lưu trữ từ chối ảnh này (${response.status})`)
  }
}

/** Records one page, once the API has confirmed the object really arrived. */
export async function confirmContractPage(
  leaseId: number,
  key: string,
): Promise<ContractPage[]> {
  const { data } = await apiClient.post<{ pages: ContractPage[] }>(
    `/leases/${leaseId}/contract`,
    { key },
  )
  return data.pages
}

/** The pages on file, oldest first, each with a fresh signed link. */
export async function getContractPages(leaseId: number): Promise<ContractPage[]> {
  const { data } = await apiClient.get<{ pages: ContractPage[] }>(`/leases/${leaseId}/contract`)
  return data.pages
}

export async function removeContractPage(
  leaseId: number,
  pageId: number,
): Promise<ContractPage[]> {
  const { data } = await apiClient.delete<{ pages: ContractPage[] }>(
    `/leases/${leaseId}/contract/${pageId}`,
  )
  return data.pages
}

/**
 * Attaches one page, and says whether it worked.
 *
 * Never throws, for the same reason `attachIdCards` does not: it is called
 * AFTER the tenancy exists, and a tenancy that exists must not be reported as a
 * failure because a photograph did not upload.
 */
export async function attachContractPage(leaseId: number, file: File): Promise<boolean> {
  try {
    const signed = await signContractUpload(leaseId, file.type)
    if (file.size > signed.maxBytes) return false
    await uploadToStorage(signed, file)
    await confirmContractPage(leaseId, signed.key)
    return true
  } catch {
    return false
  }
}

/**
 * Attaches several pages, IN SEQUENCE, and reports how many failed.
 *
 * One at a time rather than at once: a phone on a weak connection uploading
 * four 8 MB photographs in parallel fails all four, and sequential uploads make
 * progress reportable and failures individual. A page that fails does not take
 * the pages that succeeded with it — they are independent pages, not one
 * document.
 */
export async function attachContractPages(
  leaseId: number,
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  let failed = 0
  for (const [index, file] of files.entries()) {
    if (!(await attachContractPage(leaseId, file))) failed += 1
    onProgress?.(index + 1, files.length)
  }
  return failed
}

export interface ExtendLeaseInput {
  /** The closing reading of the predecessor, which is also where the successor starts. */
  endMeterReading: number
  durationMonths: number
  /** Absent means the room's current rent — which is where a price rise takes effect. */
  baseRent?: number
  /**
   * Absent means the predecessor's number of deposit months, carried over.
   *
   * Present only when the owner changes it: a renewal is the moment a deposit
   * can be renegotiated, and without this the successor could never be agreed
   * on anything but the figure the first tenancy was signed at.
   */
  depositMonths?: number
  /**
   * Whether the difference between the deposit carried and the deposit now
   * required is charged on the successor's first invoice. Declining leaves it
   * as a shortfall the owner settles in cash.
   */
  settleDepositOnInvoice?: boolean
}

/**
 * Renews a tenancy: closes it on its agreed end date and opens a successor
 * beginning that day, in one operation.
 *
 * Both tenancies come back. A caller that only saw the successor could not tell
 * what closing the predecessor did to its deposit.
 */
export async function extendLease(
  leaseId: number,
  input: ExtendLeaseInput,
): Promise<{ previous: Lease; lease: Lease }> {
  const { data } = await apiClient.post<{ previous: Lease; lease: Lease }>(
    `/leases/${leaseId}/extend`,
    input,
  )
  return data
}

export interface MoveOutInput {
  /** The day the tenant actually left. */
  moveOutDate: string
  endMeterReading: number
  /**
   * Charges for days beyond the agreed term, each named from the building's
   * catalogue with an amount of the owner's own. Ignored by the API where the
   * departure falls within the term; an empty list is a deliberate waiver.
   */
  overdueCharges?: { buildingServiceFeeId: number; amount: number }[]
}

/**
 * Closes a tenancy the way it actually ended.
 *
 * One operation: the occupancy records close, the final bill is issued, the
 * room is freed. Not to be confused with cancelling, which records a tenancy as
 * never having happened.
 */
export async function recordMoveOut(leaseId: number, input: MoveOutInput): Promise<Lease> {
  const { data } = await apiClient.post<Lease>(`/leases/${leaseId}/move-out`, input)
  return data
}

/** The figures a deposit decision is made from. Deliberately not netted together. */
export interface DepositSettlement {
  leaseId: number
  status: string
  depositRequired: number
  depositHeld: number
  depositCarriedIn: number
  deductedFromDeposit: number
  outstandingInvoices: number
  depositRefunded: number | null
  depositRefundedAt: string | null
}

export async function getDepositSettlement(leaseId: number): Promise<DepositSettlement> {
  const { data } = await apiClient.get<DepositSettlement>(`/leases/${leaseId}/deposit-settlement`)
  return data
}

export async function refundDeposit(leaseId: number, refundedAt: string): Promise<DepositSettlement> {
  const { data } = await apiClient.post<DepositSettlement>(`/leases/${leaseId}/deposit-refund`, {
    refundedAt,
  })
  return data
}

/**
 * The link a tenancy is paid through.
 *
 * `token` and `hasLink` answer different questions, and the pair of them says
 * which of three situations this is: no link at all, a link that can be shown,
 * or a link that exists and cannot be read back because the API's secret has
 * changed since it was issued. That last one still WORKS for whoever holds it,
 * which is why it is not reported as absent.
 */
export interface LeasePortalLink {
  leaseId: number
  hasLink: boolean
  token: string | null
  issuedAt: string | null
  lastUsedAt: string | null
}

export async function getPortalLink(leaseId: number): Promise<LeasePortalLink> {
  const { data } = await apiClient.get<LeasePortalLink>(`/leases/${leaseId}/portal-link`)
  return data
}

/** Issues a new link. Whatever the tenancy had stops working immediately. */
export async function reissuePortalLink(leaseId: number): Promise<LeasePortalLink> {
  const { data } = await apiClient.post<LeasePortalLink>(`/leases/${leaseId}/portal-link`)
  return data
}

/** Leaves the tenancy with no working link at all. Answers 404 if it has none. */
export async function revokePortalLink(leaseId: number): Promise<void> {
  await apiClient.delete(`/leases/${leaseId}/portal-link`)
}

// ── The service fees this tenancy took up ──────────────────────────────────
//
// The building sets what is ON OFFER; a tenancy says which of those it agreed
// to, at what quantity, and from when. This is the half that reaches an
// invoice: closing a month charges every fee whose period covers it.

export interface LeaseServiceFee {
  id: number
  leaseId: number
  buildingServiceFeeId: number
  name: string | null
  /** False when the building has since retired it. This lease keeps it anyway. */
  isOfferedByBuilding: boolean | null
  /** What THIS tenancy agreed, copied when it was taken up — not today's price. */
  unitAmount: number
  /** Copied at the same moment, for the same reason. */
  basis: ServiceFeeBasis
  /** The multiplier for a per-room fee. Always 1, and meaningless, for a per-person one. */
  quantity: number
  effectiveFrom: string
  /** Null while it still applies. */
  effectiveTo: string | null
  /**
   * Price times quantity for a per-room fee — the whole story.
   *
   * For a per-person fee this is the amount for ONE person: the real figure
   * needs the tenancy's occupant count, which the API does not fold in here
   * because it is read fresh at billing. The screen multiplies it.
   */
  monthlyAmount: number
}

export async function listLeaseServiceFees(leaseId: number): Promise<LeaseServiceFee[]> {
  const { data } = await apiClient.get<{ serviceFees: LeaseServiceFee[] }>(
    `/leases/${leaseId}/service-fees`,
  )
  return data.serviceFees
}

export interface SelectServiceFeeInput {
  buildingServiceFeeId: number
  /** Omitted for a per-person fee, which the API refuses a quantity on. */
  quantity?: number
  /** Omitted means the tenancy's start date, which is where a fee agreed at signing began. */
  effectiveFrom?: string
}

export async function selectLeaseServiceFee(
  leaseId: number,
  input: SelectServiceFeeInput,
): Promise<LeaseServiceFee> {
  const { data } = await apiClient.post<LeaseServiceFee>(`/leases/${leaseId}/service-fees`, input)
  return data
}

export async function updateLeaseServiceFeeQuantity(
  leaseId: number,
  selectionId: number,
  quantity: number,
): Promise<LeaseServiceFee> {
  const { data } = await apiClient.patch<LeaseServiceFee>(
    `/leases/${leaseId}/service-fees/${selectionId}`,
    { quantity },
  )
  return data
}

/**
 * Giving a fee up. Records the date it stopped rather than deleting the row —
 * a month already lived through still has to be billable — so it answers with
 * the ended record, not 204.
 */
export async function endLeaseServiceFee(
  leaseId: number,
  selectionId: number,
  effectiveTo?: string,
): Promise<LeaseServiceFee> {
  const { data } = await apiClient.delete<LeaseServiceFee>(
    `/leases/${leaseId}/service-fees/${selectionId}`,
    { data: effectiveTo ? { effectiveTo } : {} },
  )
  return data
}
