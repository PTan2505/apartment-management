import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as customersApi from '@/features/customers/api'
import type { CustomerFormOutput } from '@/features/customers/schema'
import type { ListCustomersParams } from '@/features/customers/types'

const CUSTOMERS_KEY = ['customers'] as const

export function useCustomers(params: ListCustomersParams) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, 'list', params],
    queryFn: () => customersApi.listCustomers(params),
  })
}

/** One customer by id. Skipped while the id is unknown. */
export function useCustomer(id: number | undefined) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, 'detail', id],
    queryFn: () => customersApi.getCustomer(id!),
    enabled: id !== undefined,
  })
}

/**
 * A link to one side of a customer's ID card.
 *
 * The API signs these for ten minutes, so this refetches well inside that: an
 * owner who leaves the page open would otherwise come back to a broken image.
 * `enabled` keeps it from asking for a side that is not on file, which answers
 * 404 by design.
 */
export function useIdCardUrl(
  customerId: number | undefined,
  side: customersApi.IdCardSide,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...CUSTOMERS_KEY, 'id-card', customerId, side],
    queryFn: () => customersApi.getIdCardUrl(customerId!, side),
    enabled: customerId !== undefined && enabled,
    // Well inside the ten minutes the link lives, so a page left open keeps a
    // link that still works.
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  })
}

function useInvalidateCustomers() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_KEY })
}

/**
 * Resolves with `{ created, customer }` rather than a bare customer, because a
 * matched phone number resolves too. See `api.createCustomer` — the caller must
 * branch on `created`, not on the mutation having succeeded.
 *
 * The list is invalidated either way: on a match nothing changed, but a refresh
 * costs one request and guarantees the screen agrees with the server.
 */
export function useCreateCustomer() {
  const invalidate = useInvalidateCustomers()
  return useMutation({
    mutationFn: (input: CustomerFormOutput) => customersApi.createCustomer(input),
    onSuccess: invalidate,
  })
}

export function useUpdateCustomer() {
  const invalidate = useInvalidateCustomers()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomerFormOutput }) =>
      customersApi.updateCustomer(id, input),
    onSuccess: invalidate,
  })
}
