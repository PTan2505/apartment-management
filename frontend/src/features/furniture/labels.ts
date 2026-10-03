import type { FurnitureCondition } from '@/features/furniture/types'

export const FURNITURE_CONDITIONS: FurnitureCondition[] = ['new', 'good', 'worn', 'damaged']

const LABEL: Record<FurnitureCondition, string> = {
  new: 'Mới',
  good: 'Tốt',
  worn: 'Cũ',
  damaged: 'Hỏng',
}

export function conditionLabel(condition: FurnitureCondition): string {
  return LABEL[condition]
}

type ChipColour = 'default' | 'success' | 'info' | 'warning' | 'error'

const COLOUR: Record<FurnitureCondition, ChipColour> = {
  new: 'success',
  good: 'info',
  worn: 'warning',
  damaged: 'error',
}

export function conditionColor(condition: FurnitureCondition): ChipColour {
  return COLOUR[condition]
}
