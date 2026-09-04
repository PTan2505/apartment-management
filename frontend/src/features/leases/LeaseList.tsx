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
import { formatCoveredThrough, formatDate, isTermRunOut } from '@/features/leases/dates'
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
  return lease.status === 'active' ? 'Chưa ai đứng tên' : 'Không có người đứng tên'
}

function tenantColor(lease: Lease): 'text.primary' | 'text.secondary' | 'warning.main' {
  if (lease.tenant?.fullName) return 'text.primary'
  return lease.status === 'active' ? 'warning.main' : 'text.secondary'
}

/**
 * The status of a tenancy, and the one thing that has to be visible without
 * being asked for.
 *
 * A running tenancy whose agreed term has passed with no move-out needs
 * attention and nothing announces it: no further invoice can be issued against
 * it, and its room stays held against a new tenancy. It is marked here, in the
 * list, rather than only being reachable through a filter — a filter finds
 * these for an owner who already suspects they exist, which is precisely the
 * owner who does not need finding them.
 */
function StatusChips({ lease }: { lease: Lease }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {/*
        Three labels, not two. A cancelled tenancy shown as "Ended" would be
        counted among the times a room was let and a person rented — history
        that never happened, and unrecoverable once it reads that way.
      */}
      <Chip
        size="small"
        label={
          lease.status === 'active'
            ? 'Đang thuê'
            : lease.status === 'cancelled'
              ? 'Đã huỷ'
              : 'Đã kết thúc'
        }
        color={
          lease.status === 'active'
            ? 'success'
            : lease.status === 'cancelled'
              ? 'error'
              : 'default'
        }
        variant={lease.status === 'finalized' ? 'outlined' : 'filled'}
      />
      {isTermRunOut(lease) && (
        <Chip
          size="small"
          color="warning"
          icon={<WarningAmberIcon />}
          label="Hết hạn"
        />
      )}
    </Stack>
  )
}

/** What the tenancy covers, always as the last day covered — never the boundary. */
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
              <TableCell>Người đứng tên</TableCell>
              <TableCell>Giá thuê</TableCell>
              <TableCell>Thời gian ở</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leases.map((lease) => (
              <TableRow key={lease.id} hover sx={{ cursor: 'pointer' }} onClick={() => onOpen(lease)}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {roomLabel(lease)}
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
                <TableCell>
                  <Typography variant="body2">{coverLabel(lease)}</Typography>
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
