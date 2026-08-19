import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as roomsApi from '@/features/rooms/api'
import type { CreateRoomFormOutput, UpdateRoomFormOutput } from '@/features/rooms/schema'
import type { ListRoomsParams } from '@/features/rooms/types'

const ROOMS_KEY = ['rooms'] as const

export function useRooms(params: ListRoomsParams) {
  return useQuery({
    queryKey: [...ROOMS_KEY, 'list', params],
    queryFn: () => roomsApi.listRooms(params),
  })
}

/**
 * Invalidates every rooms query, not just the one on screen.
 *
 * The same rooms appear on their own screen and inside a building's view, under
 * different params and therefore different keys. Refreshing only the active one
 * would leave the other showing a room that has since been retired.
 */
function useInvalidateRooms() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ROOMS_KEY })
}

export function useCreateRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (input: CreateRoomFormOutput) => roomsApi.createRoom(input),
    onSuccess: invalidate,
  })
}

export function useUpdateRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateRoomFormOutput }) =>
      roomsApi.updateRoom(id, input),
    onSuccess: invalidate,
  })
}

export function useRetireRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (id: number) => roomsApi.retireRoom(id),
    onSuccess: invalidate,
  })
}

export function useRestoreRoom() {
  const invalidate = useInvalidateRooms()
  return useMutation({
    mutationFn: (id: number) => roomsApi.restoreRoom(id),
    onSuccess: invalidate,
  })
}
