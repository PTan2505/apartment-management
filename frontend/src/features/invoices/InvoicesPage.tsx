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
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách hoá đơn</AlertTitle>
          {isApiError(invoicesQuery.error)
            ? invoicesQuery.error.message
            : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!invoices || invoices.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có hoá đơn nào khớp bộ lọc"
          description="Thử tháng hoặc toà nhà khác, hoặc xoá bộ lọc."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Chưa có hoá đơn nào"
          description="Chốt sổ một tháng để xuất hoá đơn cho các hợp đồng đã ở trong tháng đó."
          action={
            <Button
              variant="contained"
              startIcon={<EventAvailableIcon />}
              onClick={() => void navigate('/invoices/billing-run')}
            >
              Chốt sổ tháng
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
          Hoá đơn
        </Typography>
        <Button
          variant="contained"
          startIcon={<EventAvailableIcon />}
          component={RouterLink}
          to="/invoices/billing-run"
        >
          Chốt sổ tháng
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Toà nhà"
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
          <MenuItem value="">Tất cả toà nhà</MenuItem>
          {(buildingsQuery.data?.data ?? []).map((building) => (
            <MenuItem key={building.id} value={String(building.id)}>
              {building.displayName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Phòng"
          size="small"
          value={filters.roomId ?? ''}
          onChange={(event) =>
            setFilter('roomId', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">Tất cả phòng</MenuItem>
          {(roomsQuery.data?.data ?? []).map((room) => (
            <MenuItem key={room.id} value={String(room.id)}>
              {buildingId ? room.roomCode : `${room.roomCode} · ${room.building.displayName}`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Tháng"
          size="small"
          value={filters.period ?? ''}
          onChange={(event) =>
            setFilter('period', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Tất cả các tháng</MenuItem>
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
          label="Tình trạng"
          size="small"
          value={filters.paymentStatus ?? ''}
          onChange={(event) =>
            setFilter('paymentStatus', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Chưa trả</MenuItem>
          <MenuItem value="paid">Đã trả</MenuItem>
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
          label="Kể cả đã rút"
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Xoá bộ lọc
          </Button>
        )}
      </Box>

      {body()}
    </Box>
  )
}
