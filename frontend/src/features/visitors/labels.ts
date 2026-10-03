import type { Sex, VisitorState } from '@/features/visitors/types'

export const VISITOR_STATES: VisitorState[] = ['upcoming', 'staying', 'finished', 'cancelled']

const STATE_LABEL: Record<VisitorState, string> = {
  upcoming: 'Sắp đến',
  staying: 'Đang ở',
  finished: 'Đã về',
  cancelled: 'Đã huỷ',
}

export function visitorStateLabel(state: VisitorState): string {
  return STATE_LABEL[state]
}

type ChipColour = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

const STATE_COLOUR: Record<VisitorState, ChipColour> = {
  upcoming: 'info',
  staying: 'primary',
  finished: 'default',
  cancelled: 'default',
}

export function visitorStateColor(state: VisitorState): ChipColour {
  return STATE_COLOUR[state]
}

export const SEXES: Sex[] = ['male', 'female']

const SEX_LABEL: Record<Sex, string> = { male: 'Nam', female: 'Nữ' }

/** Nam / Nữ, as the residence form asks it. */
export function sexLabel(sex: Sex): string {
  return SEX_LABEL[sex]
}
