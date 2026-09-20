import { apiClient } from '@/lib/api-client'
import { storageFetch } from '@/lib/storage-fetch'
import type { CreateLeaseFormOutput, UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { Lease, ListLeasesParams, Occupant, Paginated } from '@/features/leases/types'

function toQuery(params: ListLeasesParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.roomId) query.roomId = params.roomId
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.customerId) query.customerId = params.customerId
  // Absent means both running and ended, so only a decided value is sent.
  if (params.active !== undefined) query.active = params.active ? 'true' : 'false'
  if (params.overdue) query.overdue = 'true'
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
