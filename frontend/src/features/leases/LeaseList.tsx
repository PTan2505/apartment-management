import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { formatCoveredThrough, formatDate } from '@/features/leases/dates'
import { isLive, leaseStatusColor, leaseStatusLabel } from '@/features/leases/status'
import type { Lease } from '@/features/leases/types'

interface LeaseListProps {
  leases: Lease[]
  onOpen: (lease: Lease) => void
}

/** The room, unambiguous. A code identifies a room only within its building. */
function roomLabel(lease: Lease): string {
  if (!lease.room) return `Room #${lease.roomId}`
  const building = lease.room.building?.displayName
  return building ? `${lease.room.roomCode} · ${building}` : lease.room.roomCode
}

/**
 * A tenancy with nobody responsible for it.
 *
 * Rendering a blank would read as a name that failed to load, so it is stated
 * either way — but the two cases are not equally interesting.
 *
 * A finished tenancy names whoever held it at the end, so an absent name there
 * means the record genuinely never had one. A RUNNING tenancy with nobody
 * responsible is the case worth flagging: the last occupant left before a
 * move-out was recorded, and nobody is answerable for the agreement right now.
 */
function tenantLabel(lease: Lease): string {
  if (lease.tenant?.fullName) return lease.tenant.fullName
  return isLive(lease.status) ? 'Chưa ai đứng tên' : 'Không có người đứng tên'
}

function tenantColor(lease: Lease): 'text.primary' | 'text.secondary' | 'warning.main' {
  if (lease.tenant?.fullName) return 'text.primary'
  return isLive(lease.status) ? 'warning.main' : 'text.secondary'
}

/**
 * The status of a tenancy — the one thing that has to be visible without being
 * asked for, so it is a chip on every row rather than something a filter finds.
 * A filter finds these for an owner who already suspects they exist, which is
 * precisely the owner who does not need finding them.
 */
function StatusChips({ lease }: { lease: Lease }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      <Chip
        size="small"
        label={leaseStatusLabel(lease.status)}
        color={leaseStatusColor(lease.status)}
        variant={
          lease.status === 'finalized' || lease.status === 'upcoming' ? 'outlined' : 'filled'
        }
        icon={lease.status === 'overdue' ? <WarningAmberIcon /> : undefined}
      />
    </Stack>
  )
}

/** What the tenancy covers, always as the last day covered — never the boundary. */
/**
 * The day a tenancy covers to, and which kind of day it is.
 *
 * "Ended in June" and "agreed to end in June" are different claims about a
 * tenancy, and a column that flattened them would let a reader take one for
 * the other. A cancelled tenancy gets neither: it covered no days.
 */
function endCell(lease: Lease): { value: string; note: string | null } {
  if (lease.status === 'cancelled') {
    return { value: `Huỷ ngày ${formatDate(lease.cancelledAt)}`, note: null }
  }
  if (lease.moveOutDate !== null) {
    return { value: formatCoveredThrough(lease.moveOutDate), note: 'Đã trả phòng' }
  }
  return { value: formatCoveredThrough(lease.expectedEndDate), note: 'Theo hợp đồng' }
}

function startCell(lease: Lease): string {
  // A cancelled tenancy never began. Printing its agreed start under a heading
  // about occupancy would state the one thing the status denies.
  return lease.status === 'cancelled' ? '—' : formatDate(lease.startDate)
}

function coverLabel(lease: Lease): string {
  // A cancelled tenancy covered no days at all, so it gets no range. Printing
  // its agreed dates in a column headed "Covers" would state as occupancy the
  // one thing this status exists to deny.
  if (lease.status === 'cancelled') {
    return `Huỷ ngày ${formatDate(lease.cancelledAt)}`
  }
  const from = formatDate(lease.startDate)
  const to = formatCoveredThrough(lease.moveOutDate ?? lease.expectedEndDate)
  return `${from} – ${to}`
}

/**
 * Both presentations are always mounted and toggled with `display`, matching
 * the rooms list and the shell's drawers: a `useMediaQuery` branch returns
 * false on first render and would flash the wrong layout.
 */
export function LeaseList({ leases, onOpen }: LeaseListProps) {
  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Phòng</TableCell>
              {/*
                The building is its own column, not a suffix: two buildings may
                each hold a room with the same code, and a reader comparing
                rooms down the page cannot line up "Q54299A · Trọ thủ đức".
              */}
              <TableCell>Toà nhà</TableCell>
              <TableCell>Người đứng tên</TableCell>
              <TableCell>Giá thuê</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Bắt đầu</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Kết thúc</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leases.map((lease) => (
              <TableRow key={lease.id} hover sx={{ cursor: 'pointer' }} onClick={() => onOpen(lease)}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {lease.room?.roomCode ?? `Phòng #${lease.roomId}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {lease.room?.building?.displayName ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={tenantColor(lease)}>
                    {tenantLabel(lease)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{formatMoney(lease.baseRent)} / tháng</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">{startCell(lease)}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2">{endCell(lease).value}</Typography>
                  {endCell(lease).note && (
                    <Typography variant="caption" color="text.secondary">
                      {endCell(lease).note}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <StatusChips lease={lease} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {leases.map((lease) => (
          <Card key={lease.id} variant="outlined">
            <CardActionArea onClick={() => onOpen(lease)}>
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
                    <Typography sx={{ fontWeight: 600 }}>{roomLabel(lease)}</Typography>
                    <StatusChips lease={lease} />
                  </Box>
                  <Typography variant="body2" color={tenantColor(lease)}>
                    {tenantLabel(lease)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {coverLabel(lease)}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatMoney(lease.baseRent)} / tháng
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </>
  )
}
