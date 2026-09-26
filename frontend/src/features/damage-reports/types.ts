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
