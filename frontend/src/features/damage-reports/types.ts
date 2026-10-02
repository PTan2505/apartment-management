/** Where a report stands. No way back from `done`: a fault that returns is a new report. */
export type ReportState = 'new' | 'scheduled' | 'done'

export interface DamageReportPhoto {
  id: number
  contentType: string
  uploadedAt: string
}

export interface DamageReport {
  id: number
  leaseId: number
  description: string
  state: ReportState
  reportedAt: string
  scheduledFor: string | null
  scheduleNote: string | null
  scheduledAt: string | null
  closedAt: string | null
  closingNote: string | null
  photos: DamageReportPhoto[]
  /**
   * What the repair cost the owner, or null where nobody has priced it.
   *
   * Null and an amount of zero are different facts: zero is a repair somebody
   * recorded as costing nothing. The amount lives on the expense this points
   * at, never on the report itself — see the API's schema.
   */
  cost: { id: number; amount: number; incurredAt: string; description: string } | null
  room: { id: number; roomCode: string }
  building: { id: number; displayName: string }
  /**
   * Whoever signed the tenancy, so the person handling this can ring them.
   * Either may be absent: a tenancy can run with nobody named on it.
   */
  tenant: { fullName: string | null; phone: string | null }
}

export interface ListReportsParams {
  state?: ReportState
  open?: boolean
  buildingId?: number
  page?: number
  pageSize?: number
}
