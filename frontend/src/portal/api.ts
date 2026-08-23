import { forgetToken } from '@/portal/token'

/**
 * The portal's own HTTP access, deliberately not the owner application's.
 *
 * That one installs an interceptor which refreshes the session on a 401. A
 * tenant has no session and no refresh cookie, so sharing it would mean the
 * first rejected request triggering a refresh that cannot succeed — against an
 * endpoint whose cookie the tenant does not hold. Working around it inside a
 * shared client means a flag meaning "this one is not really authenticated",
 * which is exactly the sort of thing that gets forgotten.
 *
 * Plain `fetch` rather than axios: there are three calls, none of them needs
 * interceptors, and the smaller the bundle the sooner a bill appears on a phone.
 *
 * The address is absolute and supplied at build time — there is no proxy in
 * front of this application, and none is needed: no cookie is sent, so nothing
 * depends on sharing an origin with the API.
 */
declare const __PORTAL_API_URL__: string

const API_URL = __PORTAL_API_URL__.replace(/\/$/, '')

/**
 * Distinguishes "the link is no longer valid" from everything else.
 *
 * The API answers an unknown token, a withdrawn one and a malformed one
 * identically — on purpose, so that probing reveals nothing. This carries that
 * single fact and no more, so the interface cannot accidentally tell a tenant
 * which of the three it was.
 */
export class PortalLinkInvalid extends Error {
  constructor() {
    super('Portal link is no longer valid')
    this.name = 'PortalLinkInvalid'
  }
}

export class PortalRequestFailed extends Error {
  // Declared and assigned rather than written as constructor parameter
  // properties: this project compiles with `erasableSyntaxOnly`, which forbids
  // syntax that emits code rather than being erased.
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'PortalRequestFailed'
    this.status = status
    this.code = code
  }
}

interface BackendError {
  status?: number
  code?: string
  message?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.sessionStorage.getItem('portal-token')
  if (!token) throw new PortalLinkInvalid()

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    })
  } catch {
    // A request that never reached the API at all — no signal, the server
    // asleep and refusing, DNS. `fetch` rejects with `TypeError: Failed to
    // fetch`, and without this that English string is what a tenant reads.
    throw new PortalRequestFailed('Không kết nối được. Vui lòng thử lại.', 0, 'NETWORK_ERROR')
  }

  if (response.ok) return (await response.json()) as T

  // 404 is what the API answers for every kind of bad token, and also for an
  // invoice this token cannot see — the two are indistinguishable by design.
  // 401 is a request that carried no token at all.
  if (response.status === 404 || response.status === 401) {
    forgetToken()
    throw new PortalLinkInvalid()
  }

  const body = (await response.json().catch(() => null)) as BackendError | null
  throw new PortalRequestFailed(
    body?.message ?? 'Không thể kết nối tới máy chủ',
    response.status,
    body?.code,
  )
}

export interface PortalCharge {
  kind: string
  description: string
  quantity: number | null
  unitAmount: number | null
  periodStart: string | null
  periodEnd: string | null
  amount: number
}

export interface PortalInvoice {
  id: number
  kind: string
  issueDate: string
  coversYear: number | null
  coversMonth: number | null
  periodStart: string | null
  periodEnd: string | null
  roomCode: string
  meterReadingFrom: number | null
  meterReadingTo: number | null
  charges: PortalCharge[]
  totalAmount: number
  isPaid: boolean
  hasPaymentInProgress: boolean
}

export interface PortalOverview {
  tenant: { fullName: string; phone: string | null }
  invoices: PortalInvoice[]
}

/** What the API hands back to pay a bill with. Notably absent: any gateway reference. */
export interface PaymentOffer {
  paymentId: number
  bin: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
  qrCode: string
  checkoutUrl: string
}

export function fetchOverview(): Promise<PortalOverview> {
  return request<PortalOverview>('/portal')
}

export function startPayment(invoiceId: number): Promise<PaymentOffer> {
  return request<PaymentOffer>(`/portal/invoices/${invoiceId}/pay`, {
    method: 'POST',
    body: JSON.stringify({
      // The gateway requires both. A tenant scanning the code never visits its
      // page, so neither is ever used — but a tenant who opens the checkout
      // link instead does come back here.
      returnUrl: window.location.origin,
      cancelUrl: window.location.origin,
    }),
  })
}
