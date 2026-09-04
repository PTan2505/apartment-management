import { useState } from 'react'
import { useNavigate } from 'react-router'
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
import AddIcon from '@mui/icons-material/Add'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { useListParams } from '@/lib/useListParams'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { useBuildings } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { useCustomers } from '@/features/customers/hooks'
import { useLeases, useOverdueLeaseCount } from '@/features/leases/hooks'
import { LeaseList } from '@/features/leases/LeaseList'
import { LeaseFormDialog } from '@/features/leases/LeaseFormDialog'

interface LeaseFilters extends Record<string, string | undefined> {
  buildingId?: string
  roomId?: string
  customerId?: string
  active?: string
  overdue?: string
}

const FILTER_KEYS = ['buildingId', 'roomId', 'customerId', 'active', 'overdue'] as const

export function LeasesPage() {
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)

  const { filters, page, setFilter, setFilters, clearFilters, setPage, hasFilters } =
    useListParams<LeaseFilters>(FILTER_KEYS)

  const buildingId = filters.buildingId ? Number(filters.buildingId) : undefined

  const leasesQuery = useLeases({
    page,
    buildingId,
    roomId: filters.roomId ? Number(filters.roomId) : undefined,
    customerId: filters.customerId ? Number(filters.customerId) : undefined,
    // Absent means both, so only a decided value becomes a filter.
    active: filters.active === undefined ? undefined : filters.active === 'true',
    overdue: filters.overdue === 'true',
  })

  // Every room, including let ones: the filter is for finding a room's history,
  // which is mostly the tenancies that have ended.
  //
  // Narrowed to the chosen building, which is the point of having one. A flat
  // list of every room across every building is unusable past a handful, and a
  // room code alone is ambiguous anyway — the same code exists in several
  // buildings.
  const roomsQuery = useRooms({ pageSize: 200, buildingId })
  const buildingsQuery = useBuildings({ pageSize: 200 })
  const customersQuery = useCustomers({ pageSize: 200 })

  const overdueCount = useOverdueLeaseCount().data ?? 0
  const showingOverdue = filters.overdue === 'true'

  const leases = leasesQuery.data?.data
  const meta = leasesQuery.data?.meta

  function body() {
    if (leasesQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (leasesQuery.error) {
      return (
        <Alert
          severity={isApiError(leasesQuery.error) && leasesQuery.error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={() => void leasesQuery.refetch()}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách hợp đồng</AlertTitle>
          {errorMessage(leasesQuery.error)}
        </Alert>
      )
    }

    if (!leases || leases.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có hợp đồng nào khớp bộ lọc"
          description="Thử phòng hoặc người khác, hoặc xoá bộ lọc."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Chưa có hợp đồng nào"
          description="Ký hợp đồng đầu tiên để bắt đầu."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              Hợp đồng mới
            </Button>
          }
        />
      )
    }

    return (
      <>
        <LeaseList leases={leases} onOpen={(lease) => void navigate(`/leases/${lease.id}`)} />
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </>
    )
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Hợp đồng
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Toà nhà"
          size="small"
          value={filters.buildingId ?? ''}
          onChange={(event) =>
            // Both in one update: a room belongs to one building, so changing
            // the building leaves any chosen room pointing somewhere it is not.
            // Two `setFilter` calls would not compose — the second computes
            // from the params the first captured and discards its change.
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
          sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">Tất cả phòng</MenuItem>
          {(roomsQuery.data?.data ?? []).map((room) => (
            <MenuItem key={room.id} value={String(room.id)}>
              {/* The building is established by the filter above once chosen,
                  so repeating it on every row is noise. */}
              {buildingId ? room.roomCode : `${room.roomCode} · ${room.building.displayName}`}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Người"
          size="small"
          value={filters.customerId ?? ''}
          onChange={(event) =>
            setFilter('customerId', event.target.value === '' ? undefined : event.target.value)
          }
          // Finds every tenancy this person occupied, not only the ones they
          // signed — which is what makes it a question about their history.
          helperText="Bất kỳ ai từng ở, không riêng người đứng tên"
          sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">Bất kỳ ai</MenuItem>
          {(customersQuery.data?.data ?? []).map((customer) => (
            <MenuItem key={customer.id} value={String(customer.id)}>
              {customer.fullName}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Trạng thái"
          size="small"
          value={filters.active ?? ''}
          onChange={(event) =>
            setFilter('active', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Tất cả</MenuItem>
          <MenuItem value="true">Đang thuê</MenuItem>
          <MenuItem value="false">Đã kết thúc</MenuItem>
        </TextField>

        <FormControlLabel
          control={
            <Switch
              checked={filters.overdue === 'true'}
              onChange={(event) =>
                setFilter('overdue', event.target.checked ? 'true' : undefined)
              }
            />
          }
          label="Cần xử lý"
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Xoá bộ lọc
          </Button>
        )}
      </Box>

      {/*
        Announced, not merely marked.

        Each such tenancy carries a chip in the list, but the list is ordered
        most recently begun first and these are usually the oldest — so they sit
        on the last page, which nobody opens. A mark nobody scrolls to is not a
        warning. This says the number wherever the owner is, and offers the
        filter that finds them.

        Hidden while that filter is already applied: repeating "3 need
        attention" above the three of them is noise.
      */}
      {overdueCount > 0 && !showingOverdue && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setFilter('overdue', 'true')}>
              Xem ngay
            </Button>
          }
        >
          <AlertTitle>
            {overdueCount === 1
              ? '1 hợp đồng cần xử lý'
              : `${overdueCount} hợp đồng cần xử lý`}
          </AlertTitle>
          Đã hết hạn thoả thuận mà chưa ghi nhận trả phòng. Không xuất thêm được
          hoá đơn nào cho chúng, và phòng vẫn bị giữ, không cho thuê lại được.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Hợp đồng mới
        </Button>
      </Box>

      {body()}

      <LeaseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        // Straight to the tenancy: what follows signing one is always something
        // on it — adding the other occupants, checking the deposit.
        onCreated={(lease) => void navigate(`/leases/${lease.id}`)}
      />
    </Box>
  )
}
