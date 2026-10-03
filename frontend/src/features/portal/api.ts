import { forgetToken } from '@/features/portal/token'
import { messageForCode } from '@/lib/error-messages'

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
 */
declare const __API_URL__: string

/**
 * Where to reach the API — by the same rule the owner application uses.
 *
 * This used to be `__API_URL__` unconditionally, with a note saying no proxy
 * stands in front of this application. That was true while the portal was a
 * separate bundle with its own entry point. It stopped being true when the
 * portal became a route in this one, and the note outlived the fact: with
 * `VITE_API_URL` blank for local development, the portal fetched a relative
 * `/portal` from the dev server and got `index.html` back — a tenant screen
 * reporting that HTML is not JSON.
 *
 * Blank means "go through the proxy", exactly as in lib/api-client.ts. Nothing
 * else about the portal changes: it still sends no cookie, so it still does not
 * depend on sharing an origin.
 */
const API_URL = __API_URL__ === '' ? '/api' : __API_URL__.replace(/\/$/, '')

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

  // 401 is a request that carried no token at all.
  if (response.status === 401) {
    forgetToken()
    throw new PortalLinkInvalid()
  }

  const body = (await response.json().catch(() => null)) as BackendError | null

  /*
    A 404 means the LINK is dead only when it says so.

    Every kind of bad token — unknown, withdrawn, malformed — answers
    `PORTAL_NOT_FOUND`, and that is the one worth throwing the session away for.

    This used to treat every 404 that way, which was safe while the portal only
    read bills. It stopped being safe once the portal could name a record by id:
    asking after a registration that is not this tenancy's also answers 404, and
    the tenant would have been signed out of their own link and told it had
    expired. So the code decides, and anything else becomes a message on the
    page the tenant is already on.
  */
  if (response.status === 404 && (body?.code === undefined || body.code === 'PORTAL_NOT_FOUND')) {
    forgetToken()
    throw new PortalLinkInvalid()
  }
  // Phrased from the code, not taken from the body. The API answers callers; a
  // tenant is a reader, and this used to put the API's English sentence in front
  // of one.
  throw new PortalRequestFailed(
    messageForCode(body?.code, response.status),
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
  /**
   * Which place the room is in.
   *
   * Non-null: the mapper reads it through a required relation, so a bill
   * cannot exist without one. Room codes repeat across buildings, and this is
   * the only thing on the record that tells two of them apart.
   */
  buildingName: string
  /**
   * The day the money landed, for a bill that has been settled.
   *
   * Null for an unpaid bill, and ALSO for a settled one whose payment carries
   * no date — written off, or settled against a deposit before dates were
   * recorded. Both cases reach the screen, so neither may be substituted for.
   */
  settledAt: string | null
  meterReadingFrom: number | null
  meterReadingTo: number | null
  charges: PortalCharge[]
  totalAmount: number
  isPaid: boolean
  hasPaymentInProgress: boolean
}

export interface PortalOverview {
  /*
    Who the bills are addressed to — which may be nobody. A link belongs to the
    tenancy, and a tenancy can run with no signatory named on it; the API
    reports null rather than inventing a name for a page about money.
  */
  tenant: { fullName: string | null; phone: string | null }
  /** The room this link is for, reported by the API rather than read off the bills. */
  room: { roomCode: string; buildingName: string }
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

/* ------------------------------------------------------------------ */
/* Reporting something broken                                          */
/* ------------------------------------------------------------------ */

/** Where a report stands, in the staff's vocabulary. The screen translates. */
export type PortalReportState = 'new' | 'scheduled' | 'done'

export interface PortalReport {
  id: number
  description: string
  state: PortalReportState
  reportedAt: string
  scheduledFor: string | null
  scheduleNote: string | null
  closedAt: string | null
  closingNote: string | null
  photos: { id: number; contentType: string; uploadedAt: string }[]
}

export async function fetchReports(): Promise<PortalReport[]> {
  const { data } = await request<{ data: PortalReport[] }>('/portal/reports')
  return data
}

/**
 * Raises a report. Nothing about WHERE: the link already answers that, and a
 * tenant who can name a room can name somebody else's.
 */
export async function raiseReport(description: string): Promise<PortalReport> {
  return request<PortalReport>('/portal/reports', {
    method: 'POST',
    body: JSON.stringify({ description }),
  })
}

/** Step one of a photograph: ask for somewhere to put it. */
export async function signReportPhoto(
  reportId: number,
  contentType: string,
): Promise<{ url: string; key: string; maxBytes: number }> {
  return request<{ url: string; key: string; maxBytes: number }>(
    `/portal/reports/${reportId}/photo-url`,
    { method: 'POST', body: JSON.stringify({ contentType }) },
  )
}

/** Step three: tell the API the bytes arrived. */
export async function confirmReportPhoto(reportId: number, key: string): Promise<PortalReport> {
  return request<PortalReport>(`/portal/reports/${reportId}/photos`, {
    method: 'POST',
    body: JSON.stringify({ key }),
  })
}

/* ---------------- registering somebody who is staying ---------------- */

/**
 * A visitor, as the tenant's own portal sees one.
 *
 * The same record the staff screens read, minus nothing — a tenant may see what
 * they filed. The storage keys for the identity photographs are not in it
 * because they are not in the API's answer to anybody.
 */
export interface PortalVisitor {
  id: number
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: 'male' | 'female'
  permanentAddress: string
  relationToSignatory: string
  phone: string | null
  email: string | null
  occupation: string | null
  arrivesOn: string
  expectedUntil: string
  note: string | null
  addedByStaff: boolean
  cancelledAt: string | null
  state: 'upcoming' | 'staying' | 'finished' | 'cancelled'
  stayDays: number
  isOverlong: boolean
  needsAttention: boolean
  overlongAfterDays: number
  hasIdCardFront: boolean
  hasIdCardBack: boolean
}

export interface PortalVisitorInput {
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: 'male' | 'female'
  permanentAddress: string
  relationToSignatory: string
  phone?: string
  email?: string
  occupation?: string
  arrivesOn: string
  expectedUntil: string
  note?: string
}

export async function fetchVisitors(): Promise<PortalVisitor[]> {
  const { data } = await request<{ data: PortalVisitor[] }>('/portal/visitors')
  return data
}

/**
 * Registers somebody. Nothing about WHERE: the link already answers that.
 */
export async function registerVisitor(input: PortalVisitorInput): Promise<PortalVisitor> {
  return request<PortalVisitor>('/portal/visitors', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function cancelVisitor(id: number): Promise<PortalVisitor> {
  return request<PortalVisitor>(`/portal/visitors/${id}/cancel`, { method: 'POST' })
}

/** Step one of a photograph of an identity document: somewhere to put it. */
export async function signVisitorIdCard(
  id: number,
  side: 'front' | 'back',
  contentType: string,
): Promise<{ url: string; key: string; maxBytes: number }> {
  return request<{ url: string; key: string; maxBytes: number }>(
    `/portal/visitors/${id}/id-card-url`,
    { method: 'POST', body: JSON.stringify({ side, contentType }) },
  )
}

/** Step three: tell the API the bytes arrived. */
export async function confirmVisitorIdCard(
  id: number,
  side: 'front' | 'back',
  key: string,
): Promise<PortalVisitor> {
  return request<PortalVisitor>(`/portal/visitors/${id}/id-card`, {
    method: 'POST',
    body: JSON.stringify({ side, key }),
  })
}
