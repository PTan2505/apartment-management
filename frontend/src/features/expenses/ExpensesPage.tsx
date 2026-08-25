import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PowerOffIcon from '@mui/icons-material/PowerOff'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useListParams } from '@/lib/useListParams'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { formatDate } from '@/features/leases/dates'
import { useBuildings } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { useDeleteExpense, useExpenses } from '@/features/expenses/hooks'
import { categoryLabel, CATEGORY_LABELS } from '@/features/expenses/labels'
import { ExpenseFormDialog } from '@/features/expenses/ExpenseFormDialog'
import type { Expense, ExpenseCategory } from '@/features/expenses/types'

interface ExpenseFilters extends Record<string, string | undefined> {
  buildingId?: string
  roomId?: string
  category?: string
  from?: string
  to?: string
}

const FILTER_KEYS = ['buildingId', 'roomId', 'category', 'from', 'to'] as const

/**
 * What a cost was measured from, where it was measured at all.
 *
 * Blank rather than a dash for an unmeasured cost: most spending is a figure on
 * a receipt with no basis, and a dash suggests a value that is missing.
 */
function basis(expense: Expense): string {
  if (expense.quantity === null || expense.unitRate === null) return ''
  return `${expense.quantity} × ${formatMoney(expense.unitRate)}`
}

export function ExpensesPage() {
  const { filters, page, setFilter, setFilters, clearFilters, setPage, hasFilters } =
    useListParams<ExpenseFilters>(FILTER_KEYS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const [removing, setRemoving] = useState<Expense | null>(null)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const buildingId = filters.buildingId ? Number(filters.buildingId) : undefined
  const expensesQuery = useExpenses({
    page,
    buildingId,
    roomId: filters.roomId ? Number(filters.roomId) : undefined,
    category: (filters.category as ExpenseCategory | undefined) || undefined,
    from: filters.from,
    to: filters.to,
  })
  const buildingsQuery = useBuildings({ pageSize: 200 })
  const roomsQuery = useRooms({ pageSize: 200, buildingId, includeInactive: true })
  const remove = useDeleteExpense()

  const expenses = expensesQuery.data?.data
  const meta = expensesQuery.data?.meta

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(expense: Expense) {
    setEditing(expense)
    setFormOpen(true)
  }

  async function confirmRemove() {
    if (!removing) return
    setRemoveError(null)
    try {
      await remove.mutateAsync(removing.id)
      setRemoving(null)
    } catch (cause) {
      setRemoveError(isApiError(cause) ? cause.message : 'Không xoá được chi phí đó.')
    }
  }

  /** The controls on a row, shared by both layouts. */
  function RowActions({ expense }: { expense: Expense }) {
    return (
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" aria-label="Sửa" onClick={() => openEdit(expense)}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          aria-label="Xoá"
          color="error"
          onClick={() => setRemoving(expense)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    )
  }

  function body() {
    if (expensesQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (expensesQuery.error) {
      return (
        <Alert
          severity={
            isApiError(expensesQuery.error) && expensesQuery.error.isTransport
              ? 'warning'
              : 'error'
          }
          action={
            <Button color="inherit" size="small" onClick={() => void expensesQuery.refetch()}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách chi phí</AlertTitle>
          {isApiError(expensesQuery.error)
            ? expensesQuery.error.message
            : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!expenses || expenses.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có chi phí nào khớp bộ lọc"
          description="Thử toà nhà hoặc khoảng thời gian khác, hoặc xoá bộ lọc."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Chưa ghi chi phí nào"
          description="Chưa ghi chi phí thì báo cáo doanh thu không trừ gì cả, và mọi con số trong đó đều đẹp hơn thực tế."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
              Ghi chi phí
            </Button>
          }
        />
      )
    }

    return (
      <>
        {/* Desktop */}
        <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ngày</TableCell>
                <TableCell>Nội dung</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Tính theo</TableCell>
                <TableCell align="right">Số tiền</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>
                    <Typography variant="body2">{formatDate(expense.incurredAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{expense.description}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" variant="outlined" label={categoryLabel(expense.category)} />
                      {/*
                        An owner scanning their spending needs to know that a
                        cost they never typed came from a room standing empty,
                        rather than wondering who put it there.
                      */}
                      {expense.origin === 'system' && (
                        <Chip size="small" color="info" variant="outlined" label="Tự động" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {basis(expense)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatMoney(expense.amount)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <RowActions expense={expense} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phone */}
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
          {expenses.map((expense) => (
            <Card key={expense.id} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{expense.description}</Typography>
                    <RowActions expense={expense} />
                  </Box>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip size="small" variant="outlined" label={categoryLabel(expense.category)} />
                    {expense.origin === 'system' && (
                      <Chip size="small" color="info" variant="outlined" label="Tự động" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(expense.incurredAt)}
                    {basis(expense) ? ` · ${basis(expense)}` : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatMoney(expense.amount)}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

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
          Chi phí
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PowerOffIcon />}
            component={RouterLink}
            to="/expenses/empty-rooms"
          >
            Phòng trống
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Ghi chi phí
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Toà nhà"
          size="small"
          value={filters.buildingId ?? ''}
          onChange={(event) =>
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
          label="Loại"
          size="small"
          value={filters.category ?? ''}
          onChange={(event) =>
            setFilter('category', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Tất cả các loại</MenuItem>
          {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((key) => (
            <MenuItem key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Từ"
          type="date"
          size="small"
          value={filters.from ?? ''}
          onChange={(event) =>
            setFilter('from', event.target.value === '' ? undefined : event.target.value)
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Đến"
          type="date"
          size="small"
          value={filters.to ?? ''}
          onChange={(event) =>
            setFilter('to', event.target.value === '' ? undefined : event.target.value)
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Xoá bộ lọc
          </Button>
        )}
      </Box>

      {body()}

      <ExpenseFormDialog open={formOpen} expense={editing} onClose={() => setFormOpen(false)} />

      {/*
        Called REMOVED, not withdrawn. An invoice is kept when voided; an expense
        is deleted outright. One word for both would teach an owner that "delete"
        leaves a record — true in one place and false in the other.
      */}
      <Dialog open={removing !== null} onClose={() => setRemoving(null)} fullWidth maxWidth="xs">
        <DialogTitle>Xoá chi phí này?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {removeError && <Alert severity="error">{removeError}</Alert>}
            <DialogContentText>
              {removing?.description} — {formatMoney(removing?.amount)}. Sẽ biến mất khỏi mọi danh sách và mọi con số tổng. Không hoàn tác được.
            </DialogContentText>
            {removing?.origin === 'system' && (
              <Alert severity="warning">
                Chi phí này do hệ thống tự ghi từ số công tơ. Nếu số điện sai thì sửa lại
                sẽ giữ được bản ghi; xoá thì không.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoving(null)} disabled={remove.isPending}>
            Giữ lại
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void confirmRemove()}
            disabled={remove.isPending}
          >
            {remove.isPending ? 'Đang xoá…' : 'Xoá'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
