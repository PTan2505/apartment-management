import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as visitorsApi from '@/features/visitors/api'
import type {
  ResidenceForm,
  Visitor,
  VisitorInput,
  VisitorPatch,
} from '@/features/visitors/types'

const VISITORS_KEY = ['visitors'] as const
const RESIDENCE_FORM_KEY = ['residence-form'] as const

export function useLeaseVisitors(leaseId: number) {
  return useQuery({
    queryKey: [...VISITORS_KEY, 'lease', leaseId],
    queryFn: () => visitorsApi.listLeaseVisitors(leaseId),
  })
}

/**
 * Invalidates the tenancy's list, and nothing else.
 *
 * Deliberately NOT the tenancy itself or its invoices: a registration changes
 * no occupant count and no charge, so refetching either would suggest to the
 * next reader of this file that it might.
 */
function useInvalidateVisitors(leaseId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [...VISITORS_KEY, 'lease', leaseId] })
}

export function useCreateVisitor(leaseId: number) {
  const invalidate = useInvalidateVisitors(leaseId)
  return useMutation({
    mutationFn: (input: VisitorInput) => visitorsApi.createVisitor(leaseId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateVisitor(leaseId: number) {
  const invalidate = useInvalidateVisitors(leaseId)
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: VisitorPatch }) =>
      visitorsApi.updateVisitor(id, patch),
    onSuccess: invalidate,
  })
}

export function useCancelVisitor(leaseId: number) {
  const invalidate = useInvalidateVisitors(leaseId)
  return useMutation({
    mutationFn: (id: number) => visitorsApi.cancelVisitor(id),
    onSuccess: invalidate,
  })
}

/**
 * One side of an identity document, through the three steps.
 *
 * Reports which SIDE failed, because "the upload failed" on a form with two
 * file pickers tells the owner to redo both.
 */
export function useUploadIdCard(leaseId: number) {
  const invalidate = useInvalidateVisitors(leaseId)
  return useMutation({
    mutationFn: async ({
      id,
      side,
      file,
    }: {
      id: number
      side: 'front' | 'back'
      file: File
    }): Promise<Visitor> => {
      const signed = await visitorsApi.signIdCardUpload(id, side, file.type)
      await visitorsApi.uploadToStorage(signed, file)
      return visitorsApi.confirmIdCard(id, side, signed.key)
    },
    onSuccess: invalidate,
  })
}

/* ---------------- the blank CT01 ---------------- */

export function useResidenceForm() {
  return useQuery({
    queryKey: RESIDENCE_FORM_KEY,
    queryFn: visitorsApi.getResidenceForm,
  })
}

/**
 * Writes back what the API answered with, instead of asking again.
 *
 * Asking again would list the storage prefix, and a listing lags a write — the
 * screen would show the file that was just replaced. Same reasoning as the
 * blank contract, and the same mistake was made there first.
 */
export function useSetResidenceForm() {
  const queryClient = useQueryClient()
  return (form: ResidenceForm) => queryClient.setQueryData(RESIDENCE_FORM_KEY, form)
}

export function useUploadResidenceForm() {
  const setForm = useSetResidenceForm()
  return useMutation({
    mutationFn: async (file: File): Promise<ResidenceForm> => {
      const signed = await visitorsApi.signResidenceFormUpload(file.name)
      await visitorsApi.uploadToStorage(signed, file)
      return visitorsApi.confirmResidenceForm(signed.key)
    },
    onSuccess: setForm,
  })
}

export function useRemoveResidenceForm() {
  const setForm = useSetResidenceForm()
  return useMutation({
    mutationFn: visitorsApi.removeResidenceForm,
    onSuccess: setForm,
  })
}

/* ---------------- the filing ---------------- */

/**
 * What the form would say, for the registrations currently chosen.
 *
 * `enabled` keeps it quiet until something is selected: the endpoint refuses an
 * empty selection, and asking anyway would paint an error over a dialog the
 * owner has not finished filling in.
 */
export function useFilingPreview(leaseId: number, visitorIds: number[]) {
  return useQuery({
    queryKey: [...VISITORS_KEY, 'filing', leaseId, visitorIds],
    queryFn: () => visitorsApi.previewFiling(leaseId, visitorIds),
    enabled: visitorIds.length > 0,
  })
}

export function useDownloadFiling(leaseId: number) {
  return useMutation({
    mutationFn: (visitorIds: number[]) => visitorsApi.downloadFiling(leaseId, visitorIds),
  })
}
