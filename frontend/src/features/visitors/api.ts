import { apiClient } from '@/lib/api-client'
import { storageFetch } from '@/lib/storage-fetch'
import type {
  ResidenceFilingPreview,
  ResidenceForm,
  Visitor,
  VisitorInput,
  VisitorPatch,
} from '@/features/visitors/types'

/** A card is photographed, not scanned to PDF — so no PDF here. */
export const ID_CARD_ACCEPT = 'image/jpeg,image/png,image/heic'

/** The ONLY thing a blank residence form may be — see the service for why. */
export const RESIDENCE_FORM_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export interface SignedUpload {
  url: string
  key: string
  expiresAt: string
  maxBytes: number
}

/* ---------------- registrations ---------------- */

export async function listLeaseVisitors(leaseId: number): Promise<{ data: Visitor[] }> {
  const { data } = await apiClient.get<{ data: Visitor[] }>(`/leases/${leaseId}/visitors`)
  return data
}

export async function createVisitor(leaseId: number, input: VisitorInput): Promise<Visitor> {
  const { data } = await apiClient.post<Visitor>(`/leases/${leaseId}/visitors`, input)
  return data
}

export async function updateVisitor(id: number, patch: VisitorPatch): Promise<Visitor> {
  const { data } = await apiClient.patch<Visitor>(`/visitors/${id}`, patch)
  return data
}

export async function cancelVisitor(id: number): Promise<Visitor> {
  const { data } = await apiClient.post<Visitor>(`/visitors/${id}/cancel`)
  return data
}

/* ---------------- the identity document ---------------- */

export async function signIdCardUpload(
  id: number,
  side: 'front' | 'back',
  contentType: string,
): Promise<SignedUpload> {
  const { data } = await apiClient.post<SignedUpload>(`/visitors/${id}/id-card-url`, {
    side,
    contentType,
  })
  return data
}

/** Sends the bytes to storage, NOT through the API — a plain fetch, no session. */
export async function uploadToStorage(signed: SignedUpload, file: File): Promise<void> {
  const response = await storageFetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Kho lưu trữ từ chối tệp này (${response.status})`)
  }
}

export async function confirmIdCard(
  id: number,
  side: 'front' | 'back',
  key: string,
): Promise<Visitor> {
  const { data } = await apiClient.post<Visitor>(`/visitors/${id}/id-card`, { side, key })
  return data
}

export async function idCardDownloadUrl(
  id: number,
  side: 'front' | 'back',
): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>(
    `/visitors/${id}/id-card/${side}/download`,
  )
  return data
}

/* ---------------- the blank CT01 ---------------- */

export async function getResidenceForm(): Promise<ResidenceForm> {
  const { data } = await apiClient.get<ResidenceForm>('/residence-form')
  return data
}

export async function signResidenceFormUpload(fileName: string): Promise<SignedUpload> {
  const { data } = await apiClient.post<SignedUpload>('/residence-form/upload-url', {
    fileName,
    contentType: RESIDENCE_FORM_TYPE,
  })
  return data
}

export async function confirmResidenceForm(key: string): Promise<ResidenceForm> {
  const { data } = await apiClient.post<ResidenceForm>('/residence-form', { key })
  return data
}

export async function residenceFormDownloadUrl(): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>('/residence-form/download')
  return data
}

export async function removeResidenceForm(): Promise<ResidenceForm> {
  const { data } = await apiClient.delete<ResidenceForm>('/residence-form')
  return data
}

/** The blank's bytes, read straight from storage so saving navigates nowhere. */
export async function fetchResidenceFormFile(url: string): Promise<Blob> {
  const response = await storageFetch(url)
  if (!response.ok) {
    throw new Error(`Không tải được tệp từ kho lưu trữ (${response.status})`)
  }
  return response.blob()
}

/* ---------------- the filled filing ---------------- */

export async function previewFiling(
  leaseId: number,
  visitorIds: number[],
): Promise<ResidenceFilingPreview> {
  const { data } = await apiClient.get<ResidenceFilingPreview>(
    `/leases/${leaseId}/residence-filing`,
    { params: { visitorIds: visitorIds.join(',') } },
  )
  return data
}

/**
 * The filled document, as a blob.
 *
 * ── Why this one does not use a signed URL ──────────────────────────────────
 *
 * Every other file in this system is fetched straight from storage. This one is
 * GENERATED on request and stored nowhere, so there is no object to sign a link
 * for — the API answers with the bytes themselves.
 *
 * `responseType: 'blob'` is essential: without it axios parses the response as
 * text, and a .docx is a ZIP. The file would download and Word would refuse it.
 *
 * The name comes from the response rather than being built here, so the server
 * owns what the file is called.
 */
export async function downloadFiling(
  leaseId: number,
  visitorIds: number[],
): Promise<{ blob: Blob; fileName: string }> {
  const response = await apiClient.get<Blob>(
    `/leases/${leaseId}/residence-filing/document`,
    { params: { visitorIds: visitorIds.join(',') }, responseType: 'blob' },
  )

  const disposition = response.headers['content-disposition']
  const match = typeof disposition === 'string' ? /filename\*=UTF-8''([^;]+)/.exec(disposition) : null
  const fileName = match ? decodeURIComponent(match[1]!) : 'CT01.docx'

  return { blob: response.data, fileName }
}
