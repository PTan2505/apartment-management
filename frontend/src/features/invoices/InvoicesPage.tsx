import { Link as RouterLink, useNavigate } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'

import { isApiError } from '@/lib/api-error'
import { useListParams } from '@/lib/useListParams'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { useBuildings } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { useInvoices } from '@/features/invoices/hooks'
import { InvoiceList } from '@/features/invoices/InvoiceList'
import { monthLabel, recentMonths } from '@/features/invoices/labels'
import type { PaymentStatus } from '@/features/invoices/types'

interface InvoiceFilters extends Record<string, string | undefined> {
  buildingId?: string
  roomId?: string
  period?: string
  paymentStatus?: string
  includeVoided?: string
}

const FILTER_KEYS = [
  'buildingId',
  'roomId',
  'period',
  'paymentStatus',
  'includeVoided',
] as const

export function InvoicesPage() {
  const navigate = useNavigate()
  const { filters, page, setFilter, setFilters, clearFilters, setPage, hasFilters } =
    useListParams<InvoiceFilters>(FILTER_KEYS)

  const buildingId = filters.buildingId ? Number(filters.buildingId) : undefined
  // Year and month travel as one value: they are one choice, and holding them
  // as two filters lets a URL name a month without a year.
  const [year, month] = (filters.period ?? '').split('-').map(Number)

  const invoicesQuery = useInvoices({
    page,
    buildingId,
    roomId: filters.roomId ? Number(filters.roomId) : undefined,
    year: Number.isFinite(year) && year ? year : undefined,
    month: Number.isFinite(month) && month ? month : undefined,
    paymentStatus: (filters.paymentStatus as PaymentStatus | undefined) || undefined,
    includeVoided: filters.includeVoided === 'true',
  })

  const buildingsQuery = useBuildings({ pageSize: 200 })
  const roomsQuery = useRooms({ pageSize: 200, buildingId, includeInactive: true })
  const months = recentMonths()

  const invoices = invoicesQuery.data?.data
  const meta = invoicesQuery.data?.meta

  function body() {
    if (invoicesQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (invoicesQuery.error) {
      return (
        <Alert
          severity={
            isApiError(invoicesQuery.error) && invoicesQuery.error.isTransport
              ? 'warning'
              : 'error'
          }
          action={
            <Button color="inherit" size="small" onClick={() => void invoicesQuery.refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Could not load invoices</AlertTitle>
          {isApiError(invoicesQuery.error)
            ? invoicesQuery.error.message
            : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!invoices || invoices.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="No invoices match these filters"
          description="Try a different month or building, or clear the filters."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No invoices yet"
          description="Close off a month to bill the tenancies that occupied it."
          action={
            <Button
              variant="contained"
              startIcon={<EventAvailableIcon />}
              onClick={() => void navigate('/invoices/billing-run')}
            >
              Close off a month
            </Button>
          }
        />
      )
    }

    return (
      <>
        <InvoiceList
          invoices={invoices}
          onOpen={(invoice) => void navigate(`/invoices/${invoice.id}`)}
        />
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </>
    )
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Typography variant="h5" component="h2">
          Invoices
        </Typography>
        <Button
          variant="contained"
          startIcon={<EventAvailableIcon />}
          component={RouterLink}
          to="/invoices/billing-run"
        >
          Close off a month
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Building"
          size="small"
          value={filters.buildingId ?? ''}
          onChange={(event) =>
            // Both at once: a room belongs to one building, so changing the
            // building leaves a chosen room pointing somewhere it is not.
            setFilters({
              buildingId: event.target.value === '' ? undefined : event.target.value,
              roomId: undefined,
            })
          }
          sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">All buildings</MenuItem>
          {(buildingsQuery.data?.data ?? []).map((building) => (
            <MenuItem key={building.id} value={String(building.id)}>
              {building.displayName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Room"
          size="small"
          value={filters.roomId ?? ''}
          onChange={(event) =>
            setFilter('roomId', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">All rooms</MenuItem>
          {(roomsQuery.data?.data ?? []).map((room) => (
            <MenuItem key={room.id} value={String(room.id)}>
              {buildingId ? room.roomCode : `${room.roomCode} · ${room.building.displayName}`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Month"
          size="small"
          value={filters.period ?? ''}
          onChange={(event) =>
            setFilter('period', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">All months</MenuItem>
          {months.map((m) => (
            <MenuItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
              {monthLabel(m.year, m.month)}
            </MenuItem>
          ))}
        </TextField>

        {/*
          The filter this screen exists for. An owner chasing money asks "who
          has not paid", and no other ordering answers that question.
        */}
        <TextField
          select
          label="Settled"
          size="small"
          value={filters.paymentStatus ?? ''}
          onChange={(event) =>
            setFilter('paymentStatus', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Unpaid</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={filters.includeVoided === 'true'}
              onChange={(event) =>
                setFilter('includeVoided', event.target.checked ? 'true' : undefined)
              }
            />
          }
          label="Include voided"
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Clear filters
          </Button>
        )}
      </Box>

      {body()}
    </Box>
  )
}
