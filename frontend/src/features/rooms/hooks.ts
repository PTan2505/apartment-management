import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as roomsApi from '@/features/rooms/api'
import type { CreateRoomFormOutput, UpdateRoomFormOutput } from '@/features/rooms/schema'
import type { ListRoomsParams } from '@/features/rooms/types'

const ROOMS_KEY = ['rooms'] as const

export function useRooms(params: ListRoomsParams, enabled = true) {
  return useQuery({
    queryKey: [...ROOMS_KEY, 'list', params],
    queryFn: () => roomsApi.listRooms(params),
    // Off until the caller has what the question needs — the signing form
    // cannot ask which rooms fit a date before a date is chosen.
    enabled,
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

/**
 * A room's latest meter reading, fetched only once a room has been chosen.
 *
 * `enabled` keeps it from firing with no room: the lease form mounts before one
 * is picked, and requesting `/rooms/undefined/...` would 400 on every open.
 */
/**
 * One room. Used where a screen needs the room's CURRENT rent — renewing, where
 * a price rise takes effect — which the lease deliberately does not carry: a
 * tenancy is governed by the rent it agreed, not by what the room asks now.
 */
export function useRoom(id: number | undefined, enabled = true) {
  return useQuery({
    queryKey: [...ROOMS_KEY, 'one', id],
    queryFn: () => roomsApi.getRoom(id!),
    enabled: id !== undefined && enabled,
  })
}

export function useRoomMeterReading(roomId: number | undefined) {
  return useQuery({
    queryKey: [...ROOMS_KEY, 'meter', roomId],
    queryFn: () => roomsApi.getRoomMeterReading(roomId as number),
    enabled: roomId !== undefined && roomId > 0,
  })
}
