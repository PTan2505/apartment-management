import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as leasesApi from '@/features/leases/api'
import type { CreateLeaseFormOutput, UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { LeaseStatus, ListLeasesParams } from '@/features/leases/types'

const LEASES_KEY = ['leases'] as const
const ROOMS_KEY = ['rooms'] as const

export function useLeases(params: ListLeasesParams) {
  return useQuery({
    queryKey: [...LEASES_KEY, 'list', params],
    queryFn: () => leasesApi.listLeases(params),
  })
}

/**
 * How many tenancies are in one state, asked for on its own.
 *
 * The list already marks each row, but marking is not announcing: a count
 * stands where the owner is, whatever page the tenancies it counts are on.
 *
 * The listing itself asked with `pageSize=1` and read off `meta.total`, rather
 * than a counting endpoint: the number has to agree with the list it leads to,
 * and the surest way to agree with a query is to BE that query.
 */
export function useLeaseCount(status: LeaseStatus) {
  return useQuery({
    queryKey: [...LEASES_KEY, 'count', status],
    queryFn: () => leasesApi.listLeases({ status, pageSize: 1 }),
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
/**
 * The contract's pages, each carrying a link that expires in ten minutes.
 *
 * Refetched well inside that window so a page left open keeps links that still
 * work — the same reason the ID card's links come from a query rather than
 * being held in state.
 */
export function useContractPages(leaseId: number, enabled = true) {
  return useQuery({
    queryKey: [...LEASES_KEY, leaseId, 'contract-pages'],
    queryFn: () => leasesApi.getContractPages(leaseId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

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
/** Renewing: one request that closes a tenancy and opens its successor. */
export function useExtendLease() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: leasesApi.ExtendLeaseInput }) =>
      leasesApi.extendLease(id, input),
    onSuccess: invalidate,
  })
}

/** Closing a tenancy: the tenant left, the final bill goes out, the room frees. */
export function useRecordMoveOut() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: leasesApi.MoveOutInput }) =>
      leasesApi.recordMoveOut(id, input),
    onSuccess: invalidate,
  })
}

/** What the deposit settles to. Only asked for once a tenancy has closed. */
export function useDepositSettlement(leaseId: number, enabled: boolean) {
  return useQuery({
    queryKey: [...LEASES_KEY, leaseId, 'deposit-settlement'],
    queryFn: () => leasesApi.getDepositSettlement(leaseId),
    enabled,
  })
}

export function useRefundDeposit() {
  const invalidate = useInvalidateLeases()
  return useMutation({
    mutationFn: ({ id, refundedAt }: { id: number; refundedAt: string }) =>
      leasesApi.refundDeposit(id, refundedAt),
    onSuccess: invalidate,
  })
}

/** The building's fee catalogue, for naming charges beyond a term. */
export function useBuildingServiceFees(buildingId: number | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['buildings', buildingId, 'service-fees'],
    queryFn: () => leasesApi.listBuildingServiceFees(buildingId!),
    enabled: buildingId !== undefined && enabled,
  })
}

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
    }) =>
      /*
        One request, not two.

        This used to transfer and then depart. The transfer could land and the
        departure fail, leaving the agreement in the successor's name with the
        previous holder still living there — each request having done exactly
        what it said. The API now takes both and writes them together.
      */
      leasesApi.departOccupant(leaseId, occupantId, leftAt, transferTo),
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
