import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as leasesApi from '@/features/leases/api'
import type { CreateLeaseFormOutput, UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { ListLeasesParams } from '@/features/leases/types'

const LEASES_KEY = ['leases'] as const
const ROOMS_KEY = ['rooms'] as const

export function useLeases(params: ListLeasesParams) {
  return useQuery({
    queryKey: [...LEASES_KEY, 'list', params],
    queryFn: () => leasesApi.listLeases(params),
  })
}

/**
 * How many tenancies need attention, asked for on its own.
 *
 * The list marks them, but marking is not announcing: leases are ordered most
 * recently begun first, and a tenancy whose term ran out is usually an OLD one
 * — so it sinks to the last page, which is the page nobody opens. The very
 * record that needs chasing ends up the hardest to see.
 *
 * One row is fetched and thrown away; only `meta.total` is wanted, and the
 * shared paginated shape reports it whatever the page size.
 */
export function useOverdueLeaseCount() {
  return useQuery({
    queryKey: [...LEASES_KEY, 'overdue-count'],
    queryFn: () => leasesApi.listLeases({ overdue: true, pageSize: 1 }),
    select: (page) => page.meta.total,
  })
}

export function useLease(id: number) {
  return useQuery({
    queryKey: [...LEASES_KEY, 'detail', id],
    queryFn: () => leasesApi.getLease(id),
  })
}

export function useOccupants(leaseId: number) {
  return useQuery({
    queryKey: [...LEASES_KEY, 'occupants', leaseId],
    queryFn: () => leasesApi.listOccupants(leaseId),
  })
}

/**
 * Refreshes leases AND rooms.
 *
 * Signing or closing a tenancy changes whether its room is let, and that is now
 * a fact the rooms screen shows and the create form filters on. Refreshing only
 * the leases would leave a room still offered for letting after it was let —
 * and the next attempt would be refused by the API for a reason the screen had
 * already been told about and thrown away.
 */
function useInvalidateLeases() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: LEASES_KEY })
    void queryClient.invalidateQueries({ queryKey: ROOMS_KEY })
  }
}

export function useCreateLease() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: (input: CreateLeaseFormOutput) => leasesApi.createLease(input),
    onSuccess: invalidate,
  })
}

export function useUpdateLease() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    // Partial, as the endpoint is: the billed-count dialog sends that one field
    // and must not send back terms it never displayed.
    mutationFn: ({ id, input }: { id: number; input: Partial<UpdateLeaseFormOutput> }) =>
      leasesApi.updateLease(id, input),
    onSuccess: invalidate,
  })
}

/**
 * Cancelling frees the room, so this invalidates rooms alongside leases —
 * without it the room the cancellation just released would still be missing
 * from the create form's list of rooms that can be let.
 */
export function useCancelLease() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({
      id,
      settlement,
    }: {
      id: number
      settlement: { depositReturned: number; depositKept: number } | null
    }) => leasesApi.cancelLease(id, settlement),
    onSuccess: invalidate,
  })
}

export function useAddOccupant() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ leaseId, customerId }: { leaseId: number; customerId: number }) =>
      leasesApi.addOccupant(leaseId, customerId),
    onSuccess: invalidate,
  })
}

/**
 * Departs an occupant, transferring responsibility first where one is named.
 *
 * The API refuses to depart the person responsible while other occupants
 * remain, because responsibility has to pass to somebody. The screen knows who
 * the candidates are, so it resolves that rather than reporting the refusal.
 *
 * Deliberately two calls and deliberately in this order. They are not atomic
 * and do not need to be: if the transfer succeeds and the departure fails, the
 * result is a tenancy whose responsibility moved and whose occupant did not
 * leave — visible on the same screen, correct as far as it went, and repairable
 * by trying again. The reverse order cannot leave a mess because the API
 * refuses it outright.
 */
export function useDepartOccupant() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: async ({
      leaseId,
      occupantId,
      leftAt,
      transferTo,
    }: {
      leaseId: number
      occupantId: number
      leftAt: string
      /** The customer taking over, where this occupant is the responsible one. */
      transferTo?: number
    }) => {
      if (transferTo !== undefined) {
        await leasesApi.transferPrimary(leaseId, transferTo)
      }
      return leasesApi.departOccupant(leaseId, occupantId, leftAt)
    },
    onSuccess: invalidate,
  })
}

export function useTransferPrimary() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ leaseId, customerId }: { leaseId: number; customerId: number }) =>
      leasesApi.transferPrimary(leaseId, customerId),
    onSuccess: invalidate,
  })
}
