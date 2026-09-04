import type { Account, Role } from '@/features/auth/types'

/**
 * What a role is called to the person who has it.
 *
 * A record rather than a function with a default, so that adding a role to the
 * `Role` union without naming it here fails to compile. The alternative — a
 * fallback that prints whatever it was given — is how `owner` reached the screen
 * in the first place.
 */
const ROLE_LABELS: Record<Role, string> = {
  owner: 'Chủ nhà',
  customer: 'Khách thuê',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role]
}

/** Said when an account has no phone number, rather than leaving a gap. */
export const NO_PHONE = 'Chưa có số điện thoại'

export function phoneLabel(account: Account): string {
  return account.phone ?? NO_PHONE
}

/**
 * A name shortened to fit an avatar.
 *
 * Vietnamese names run family-name first and are commonly four words, so the
 * useful pair is the FIRST word and the LAST — the family name and the given
 * name a person is actually addressed by. Taking the first two would produce the
 * family name and a middle name, which identifies almost nobody.
 *
 *   "Nguyễn Văn An"        → NA
 *   "Phạm Thị Kim Oanh"    → PO
 *   "Owner"                → O
 */
export function initials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0]![0]!
  const last = words.length > 1 ? words[words.length - 1]![0]! : ''
  return (first + last).toUpperCase()
}
