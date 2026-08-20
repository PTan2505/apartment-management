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
