import { apiClient } from '@/lib/api-client'
import { storageFetch } from '@/lib/storage-fetch'

/** What a blank contract plausibly is: something to print. */
export const TEMPLATE_ACCEPT =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/heic'

export type ContractTemplate =
  | { exists: false }
  | { exists: true; fileName: string; size: number; uploadedAt: string }

export interface SignedUpload {
  url: string
  key: string
  expiresAt: string
  maxBytes: number
}

/** What is on file, or that there is none. Absence is an answer, not an error. */
export async function getTemplate(): Promise<ContractTemplate> {
  const { data } = await apiClient.get<ContractTemplate>('/contract-template')
  return data
}

export async function signTemplateUpload(
  fileName: string,
  contentType: string,
): Promise<SignedUpload> {
  const { data } = await apiClient.post<SignedUpload>('/contract-template/upload-url', {
    fileName,
    contentType,
  })
  return data
}

/** Sends the file to storage, NOT through the API — a plain `fetch` carrying no session. */
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

export async function confirmTemplate(key: string): Promise<ContractTemplate> {
  const { data } = await apiClient.post<ContractTemplate>('/contract-template', { key })
  return data
}

/** Short-lived, and signed to arrive under the name it was uploaded with. */
export async function getTemplateDownloadUrl(): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>('/contract-template/download')
  return data
}

/**
 * The file's bytes, fetched straight from storage — NOT through the API.
 *
 * Read here rather than by sending the browser to the signed link, so that
 * saving the file neither opens a tab nor navigates this screen away. It also
 * keeps a refusal on this screen: a link the browser follows on its own turns
 * a storage error into a page of XML, while this one becomes a message above
 * the list.
 */
export async function fetchTemplateFile(url: string): Promise<Blob> {
  const response = await storageFetch(url)
  if (!response.ok) {
    throw new Error(`Không tải được tệp từ kho lưu trữ (${response.status})`)
  }
  return response.blob()
}

export async function removeTemplate(): Promise<ContractTemplate> {
  const { data } = await apiClient.delete<ContractTemplate>('/contract-template')
  return data
}
