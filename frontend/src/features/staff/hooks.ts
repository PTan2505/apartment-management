import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as staffApi from '@/features/staff/api'
import type { CreateStaffInput } from '@/features/staff/types'

const STAFF_KEY = ['staff'] as const

export function useStaff() {
  return useQuery({ queryKey: STAFF_KEY, queryFn: () => staffApi.listStaff('all') })
}

function useInvalidateStaff() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: STAFF_KEY })
}

/**
 * The password comes back in the response and is handed to the caller from
 * there. It is deliberately NOT written into the query cache: cached, it would
 * survive a navigation and be readable again — the one thing the API refuses to
 * do.
 */
export function useCreateStaff() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: (input: CreateStaffInput) => staffApi.createStaff(input),
    onSuccess: () => void invalidate(),
  })
}

export function useAssignBuildings() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, buildingIds }: { id: number; buildingIds: number[] }) =>
      staffApi.assignBuildings(id, buildingIds),
    onSuccess: () => void invalidate(),
  })
}

export function useResetStaffPassword() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: (id: number) => staffApi.resetPassword(id),
    onSuccess: () => void invalidate(),
  })
}

export function useSetStaffActive() {
  const invalidate = useInvalidateStaff()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      isActive ? staffApi.restoreStaff(id) : staffApi.deactivateStaff(id),
    onSuccess: () => void invalidate(),
  })
}
