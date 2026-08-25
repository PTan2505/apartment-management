import type { ExpenseCategory } from '@/features/expenses/types'

/**
 * The kinds of cost, in the words an owner would use.
 *
 * "Vacancy electricity" is named rather than left as its identifier because it
 * is the one an owner never entered themselves, and a label they do not
 * recognise beside a figure they did not type is how a real cost gets mistaken
 * for a mistake.
 */
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  repair: 'Repair',
  cleaning: 'Cleaning',
  vacancy_electricity: 'Vacancy electricity',
  other: 'Other',
}

export function categoryLabel(category: ExpenseCategory): string {
  return CATEGORY_LABELS[category] ?? category
}
