export type Sex = 'male' | 'female'

/** Derived by the API from the dates and the cancellation, never stored. */
export type VisitorState = 'upcoming' | 'staying' | 'finished' | 'cancelled'

export interface Visitor {
  id: number
  leaseId: number
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: Sex
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
  createdAt: string
  room: { id: number; roomCode: string }
  building: { id: number; displayName: string }

  /** Whether a side is on file. The storage keys never reach the browser. */
  hasIdCardFront: boolean
  hasIdCardBack: boolean

  state: VisitorState
  stayDays: number
  /** This stay HAS run past the threshold — stays true once it happens. */
  isOverlong: boolean
  /**
   * It is overlong AND still running, so it is still the owner's problem.
   *
   * The distinction matters for what gets a badge: `isOverlong` alone would
   * mark a visit that ended last year forever.
   */
  needsAttention: boolean
  overlongAfterDays: number
}

export interface VisitorInput {
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: Sex
  permanentAddress: string
  relationToSignatory: string
  phone?: string
  email?: string
  occupation?: string
  arrivesOn: string
  expectedUntil: string
  note?: string
}

export type VisitorPatch = Partial<{
  fullName: string
  idCardNumber: string
  dateOfBirth: string
  sex: Sex
  permanentAddress: string
  relationToSignatory: string
  phone: string | null
  email: string | null
  occupation: string | null
  arrivesOn: string
  expectedUntil: string
  note: string | null
}>

/** What the blank CT01 on file is, or that there is none. */
export type ResidenceForm =
  | { exists: false }
  | { exists: true; fileName: string; size: number; uploadedAt: string }

/**
 * What the form would say, and which boxes nothing could fill.
 *
 * Asked for BEFORE the download, so the screen can name the empty boxes while
 * the owner is still at a keyboard rather than at a printer.
 */
export interface ResidenceFilingPreview {
  lease: {
    id: number
    room: { id: number; roomCode: string }
    building: { id: number; displayName: string }
  }
  declarant: { id: number; fullName: string }
  householdCount: number
  signatory: { id: number; fullName: string; hasIdCardNumber: boolean } | null
  /** Labelled as the form numbers them, e.g. "13. Số định danh… của chủ hộ". */
  emptyBoxes: string[]
}
