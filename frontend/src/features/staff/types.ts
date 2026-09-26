import type { AccountBuilding, Role } from '@/features/auth/types'

/** A staff account as the owner's screen shows it. Never a password. */
export interface Staff {
  id: number
  phone: string | null
  fullName: string
  role: Extract<Role, 'manager' | 'maintenance'>
  isActive: boolean
  /** Still holds a password the owner issued, and must replace it to work. */
  mustChangePassword: boolean
  buildings: AccountBuilding[]
  createdAt: string
}

/**
 * Creating an account, or resetting its password, answers with the password
 * ONCE. It is not stored anywhere it could be read again — which is the point,
 * and why the screen says so while showing it.
 */
export interface StaffWithPassword {
  staff: Staff
  password: string
}

export interface CreateStaffInput {
  phone: string
  fullName: string
  role: Staff['role']
  buildingIds?: number[]
}
