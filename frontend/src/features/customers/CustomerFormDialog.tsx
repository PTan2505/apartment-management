import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { isApiError } from '@/lib/api-error'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useCreateCustomer, useUpdateCustomer } from '@/features/customers/hooks'
import { customerFormSchema, type CustomerFormValues } from '@/features/customers/schema'
import type { Customer } from '@/features/customers/types'

interface CustomerFormDialogProps {
  open: boolean
  /** The customer being edited, or null to create one. */
  customer: Customer | null
  onClose: () => void
  /** Called only when someone was actually created, never on a matched phone. */
  onCreated?: (customer: Customer) => void
}

/**
 * One dialog for both create and edit: unlike a room, every field a customer
 * has can be set at creation and changed afterwards, so there is no control
 * that would be inert in one mode.
 *
 * What is unusual here is the create result. `POST /customers` is find-or-create
 * — a phone number already on file returns the person holding it and creates
 * nobody — and both outcomes are 2xx. Awaiting the mutation and closing on
 * success would report a creation that did not happen, so the submit handler
 * branches on `created` rather than on the promise resolving.
 */
export function CustomerFormDialog({
  open,
  customer,
  onClose,
  onCreated,
}: CustomerFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT))

  const isEdit = customer !== null
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const [formError, setFormError] = useState<string | null>(null)
  /** The person an entered phone number turned out to belong to. */
  const [matched, setMatched] = useState<Customer | null>(null)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema) as never,
    defaultValues: { fullName: '', phone: '' },
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setMatched(null)
    reset(
      customer
        ? { fullName: customer.fullName, phone: customer.phone ?? '' }
        : { fullName: '', phone: '' },
    )
  }, [open, customer, reset])

  async function onSubmit(values: CustomerFormValues) {
    setFormError(null)
    setMatched(null)
    const input = customerFormSchema.parse(values)

    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, input })
        onClose()
        return
      }

      const result = await createMutation.mutateAsync(input)

      if (!result.created) {
        // Nobody was created. `result.customer` is whoever already holds the
        // phone number, and the name just entered was never stored. Closing
        // here would leave the owner believing they added that person.
        setMatched(result.customer)
        return
      }

      onCreated?.(result.customer)
      onClose()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Something went wrong. Please try again.')
        return
      }
      // A phone number belonging to an owner account, or to another customer on
      // edit, arrives as a conflict. The API's message is more specific than
      // anything this form could invent.
      const fieldErrors = error.fieldErrors
      let attributed = false
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (['fullName', 'phone'].includes(field) && messages[0]) {
          setError(field as keyof CustomerFormValues, { type: 'server', message: messages[0] })
          attributed = true
        }
      }
      if (!attributed) setFormError(error.message)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? 'Edit customer' : 'New customer'}</DialogTitle>

      {/* noValidate: without it the browser validates first and its own bubble
          pre-empts the field message, which has bitten both earlier form
          dialogs on this project. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {matched && (
              <Alert severity="warning">
                <AlertTitle>That phone number already belongs to someone</AlertTitle>
                {matched.phone} is already on file for <strong>{matched.fullName}</strong>. No new
                customer was created, and the name you entered was not saved. Correct the number
                to add someone new, or close this if {matched.fullName} is who you meant.
              </Alert>
            )}

            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="Full name"
              required
              autoFocus
              {...register('fullName')}
              error={Boolean(errors.fullName)}
              helperText={errors.fullName?.message}
              fullWidth
            />

            <TextField
              label="Phone number"
              {...register('phone')}
              error={Boolean(errors.phone)}
              helperText={
                errors.phone?.message ??
                (isEdit && customer?.phone
                  ? 'Leaving this empty keeps the current number — a phone number cannot be removed once recorded.'
                  : 'Optional. Someone without a phone of their own can be left blank.')
              }
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={20} /> : isEdit ? 'Save' : 'Add customer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
