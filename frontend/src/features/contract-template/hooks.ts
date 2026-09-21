import { useQuery, useQueryClient } from '@tanstack/react-query'

import * as templateApi from '@/features/contract-template/api'

const TEMPLATE_KEY = ['contract-template'] as const

export function useContractTemplate() {
  return useQuery({
    queryKey: TEMPLATE_KEY,
    queryFn: templateApi.getTemplate,
  })
}

/**
 * Writes back what the API answered with, instead of asking again.
 *
 * Asking again would list the storage prefix, and a listing lags a write — the
 * screen would show the file that was just replaced. The upload and the delete
 * both report the resulting state, so that is what the screen shows.
 */
export function useSetContractTemplate() {
  const queryClient = useQueryClient()
  return (template: templateApi.ContractTemplate) =>
    queryClient.setQueryData(TEMPLATE_KEY, template)
}
