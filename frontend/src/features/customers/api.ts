import { apiClient } from '@/lib/api-client'
import type {
  CreateCustomerResult,
  Customer,
  ListCustomersParams,
  Paginated,
} from '@/features/customers/types'
import type { CustomerFormOutput } from '@/features/customers/schema'

function toQuery(params: ListCustomersParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  // One field matches both name and phone, so there is nothing to say about
  // which the text is.
  if (params.search) query.search = params.search
  return query
}

export async function listCustomers(
  params: ListCustomersParams,
): Promise<Paginated<Customer>> {
  const { data } = await apiClient.get<Paginated<Customer>>('/customers', {
    params: toQuery(params),
  })
  return data
}

/**
 * Creates a customer, or reports that the phone number already belongs to one.
 *
 * The status code is the only thing that separates the two, and this is the one
 * place it is visible — by the time a caller has the parsed body, a created
 * person and a matched one look identical. So the distinction is captured here
 * rather than reconstructed later.
 *
 * It cannot be reconstructed later, in fact: comparing the returned name to the
 * submitted one fails exactly when someone with the same name already holds the
 * number, which is the case most likely to mislead.
 *
 *   201 → created: true   a new person exists
 *   200 → created: false  `customer` is whoever already held the phone number,
 *                         and the submitted name was not saved anywhere
 *   409 → throws          the number belongs to an owner account
 */
/** One customer, for a screen that knows only their id — the signatory of a tenancy. */
export async function getCustomer(id: number): Promise<Customer> {
  const { data } = await apiClient.get<Customer>(`/customers/${id}`)
  return data
}

export async function createCustomer(
  input: CustomerFormOutput,
): Promise<CreateCustomerResult> {
  const response = await apiClient.post<Customer>('/customers', input)
  return { created: response.status === 201, customer: response.data }
}

/** Answers 409 when the phone number already belongs to someone else. */
export async function updateCustomer(
  id: number,
  input: CustomerFormOutput,
): Promise<Customer> {
  const { data } = await apiClient.patch<Customer>(`/customers/${id}`, input)
  return data
}

/** What a phone photographs a card as. No PDF: a card is one side of one card. */
export const ID_CARD_ACCEPT = 'image/jpeg,image/png,image/heic'

export type IdCardSide = 'front' | 'back'

export interface SignedUpload {
  url: string
  key: string
  expiresAt: string
  maxBytes: number
}

/**
 * The same three steps the tenancy's contract uses, for one side of a card.
 *
 * The caller names a side and a kind of file; the destination is the API's to
 * choose, so a URL obtained for one customer cannot be turned into a write
 * against another.
 */
export async function signIdCardUpload(
  customerId: number,
  side: IdCardSide,
  contentType: string,
): Promise<SignedUpload> {
  const { data } = await apiClient.post<SignedUpload>(
    `/customers/${customerId}/id-card-upload-url`,
    { side, contentType },
  )
  return data
}

/**
 * Sends the image to storage, NOT through the API.
 *
 * A plain `fetch`: this request carries no session, goes to another host, and
 * must send exactly the Content-Type bound into the signature.
 */
export async function uploadIdCardToStorage(signed: SignedUpload, file: File): Promise<void> {
  const response = await fetch(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Kho lưu trữ từ chối ảnh này (${response.status})`)
  }
}

/** Records one side, once the API has confirmed the object really arrived. */
export async function confirmIdCard(
  customerId: number,
  side: IdCardSide,
  key: string,
): Promise<Customer> {
  const { data } = await apiClient.post<Customer>(`/customers/${customerId}/id-card`, {
    side,
    key,
  })
  return data
}

/** A short-lived link for reading. Answers 404 where that side is not on file. */
export async function getIdCardUrl(
  customerId: number,
  side: IdCardSide,
): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>(
    `/customers/${customerId}/id-card/${side}`,
  )
  return data
}

export async function removeIdCard(customerId: number, side: IdCardSide): Promise<Customer> {
  const { data } = await apiClient.delete<Customer>(`/customers/${customerId}/id-card/${side}`)
  return data
}

/**
 * Attaches whatever images the owner chose, and says what actually happened.
 *
 * Never throws. It is called AFTER a tenancy has been created, and a tenancy
 * that exists must not be reported as a failure because a photograph did not
 * upload — the screen says the tenancy was signed and the images were not
 * attached, which is both halves of the truth.
 */
export async function attachIdCards(
  customerId: number,
  files: { front?: File | null; back?: File | null },
): Promise<{ failed: IdCardSide[] }> {
  const failed: IdCardSide[] = []
  for (const side of ['front', 'back'] as const) {
    const file = files[side]
    if (!file) continue
    try {
      const signed = await signIdCardUpload(customerId, side, file.type)
      if (file.size > signed.maxBytes) {
        throw new Error('too large')
      }
      await uploadIdCardToStorage(signed, file)
      await confirmIdCard(customerId, side, signed.key)
    } catch {
      failed.push(side)
    }
  }
  return { failed }
}
