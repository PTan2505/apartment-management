import { apiClient } from '@/lib/api-client'
import type { CreateStaffInput, Staff, StaffWithPassword } from '@/features/staff/types'

export async function listStaff(status: 'active' | 'inactive' | 'all' = 'all'): Promise<Staff[]> {
  const { data } = await apiClient.get<{ data: Staff[] }>('/staff', { params: { status } })
  return data.data
}

/** Answers with the generated password. The only time it is ever returned. */
export async function createStaff(input: CreateStaffInput): Promise<StaffWithPassword> {
  const { data } = await apiClient.post<StaffWithPassword>('/staff', input)
  return data
}

/** Replaces the whole set of buildings; what is missing is unassigned. */
export async function assignBuildings(id: number, buildingIds: number[]): Promise<Staff> {
  const { data } = await apiClient.put<Staff>(`/staff/${id}/buildings`, { buildingIds })
  return data
}

/** A new password, shown once, and the account owes a change again. */
export async function resetPassword(id: number): Promise<StaffWithPassword> {
  const { data } = await apiClient.post<StaffWithPassword>(`/staff/${id}/password-reset`)
  return data
}

export async function deactivateStaff(id: number): Promise<Staff> {
  const { data } = await apiClient.post<Staff>(`/staff/${id}/deactivate`)
  return data
}

export async function restoreStaff(id: number): Promise<Staff> {
  const { data } = await apiClient.post<Staff>(`/staff/${id}/restore`)
  return data
}
