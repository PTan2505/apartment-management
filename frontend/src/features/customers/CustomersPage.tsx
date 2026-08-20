import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

import { isApiError } from '@/lib/api-error'
import { useListParams } from '@/lib/useListParams'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { SearchField } from '@/components/SearchField'
import { CustomerList } from '@/features/customers/CustomerList'
import { CustomerFormDialog } from '@/features/customers/CustomerFormDialog'
import { useCustomers } from '@/features/customers/hooks'
import type { Customer } from '@/features/customers/types'

interface CustomerFilters extends Record<string, string | undefined> {
  search?: string
}

const FILTER_KEYS = ['search'] as const
/**
 * Typing must not leave a history entry per keystroke, or back removes one
 * character at a time instead of leaving the search. Search is the only filter
 * here, so it is the only key — and it replaces.
 */
const REPLACE_KEYS = ['search'] as const

/**
 * Customers, unlike rooms, have exactly one home. Rooms needed a separate
 * section component because the same list appears on its own screen and inside
 * a building's view; there is no second place a customer list belongs, so
 * splitting one would be a component with a single caller.
 */
export function CustomersPage() {
  const { filters, page, setFilter, clearFilters, setPage, hasFilters } =
    useListParams<CustomerFilters>(FILTER_KEYS, { replaceKeys: REPLACE_KEYS })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const customersQuery = useCustomers({ page, search: filters.search })
  const customers = customersQuery.data?.data
  const meta = customersQuery.data?.meta

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function body() {
    if (customersQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    // A failure must not render as an empty list — the two mean opposite things
    // and look identical if this branch is missed.
    if (customersQuery.error) {
      const error = customersQuery.error
      return (
        <Alert
          severity={isApiError(error) && error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={() => customersQuery.refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Could not load customers</AlertTitle>
          {isApiError(error) ? error.message : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!customers || customers.length === 0) {
      // Two different emptinesses: nothing matched a search, versus nothing on
      // file at all. Offering "add the first customer" to someone whose search
      // simply missed would be answering a question they did not ask.
      return hasFilters ? (
        <EmptyState
          title="No customers match this search"
          description="Try a different name or phone number, or clear the search."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No customers yet"
          description="Add the first customer to get started."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New customer
            </Button>
          }
        />
      )
    }

    return (
      <>
        <CustomerList
          customers={customers}
          onEdit={(customer) => {
            setEditing(customer)
            setFormOpen(true)
          }}
        />
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </>
    )
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Customers
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <SearchField
          label="Search customers"
          size="small"
          value={filters.search ?? ''}
          onDebouncedChange={(value) => setFilter('search', value || undefined)}
          helperText="Matches a name or a phone number — diacritics optional"
          sx={{ minWidth: 260, flexGrow: { xs: 1, sm: 0 } }}
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Clear search
          </Button>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New customer
        </Button>
      </Box>

      {body()}

      <CustomerFormDialog
        open={formOpen}
        customer={editing}
        onClose={() => setFormOpen(false)}
        onCreated={(customer) => {
          setCreated(customer.fullName)
          // Customers are ordered by creation, so a new one lands last — often
          // on a page the owner is not looking at, which reads as the form
          // having done nothing.
          const total = meta?.total ?? 0
          const pageSize = meta?.pageSize ?? 20
          setPage(Math.ceil((total + 1) / pageSize))
        }}
      />

      <Snackbar
        open={created !== null}
        autoHideDuration={4000}
        onClose={() => setCreated(null)}
        message={created ? `Added ${created}` : ''}
      />
    </Box>
  )
}
