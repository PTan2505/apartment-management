import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
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

import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { RoomRowActions } from '@/features/rooms/RoomRowActions'
import type { Room } from '@/features/rooms/types'

interface RoomListProps {
  rooms: Room[]
  /**
   * Suppresses the building column and card line. Inside a building's own view
   * the building is established by context, and repeating it on every row is
   * noise.
   */
  hideBuilding?: boolean
  onEdit: (room: Room) => void
  onRetire: (room: Room) => void
  onRestore: (room: Room) => void
}

function RetiredChip() {
  return <Chip label="Retired" size="small" variant="outlined" />
}

/**
 * One list, two homes: the rooms screen and a building's own view.
 *
 * The difference is a single column, so it is a prop rather than a second
 * component — the rows, cards, actions and dialogs are identical.
 *
 * Both presentations are always mounted and toggled with `display`, matching
 * the shell's drawers: a `useMediaQuery` branch returns false on first render
 * and would flash the wrong layout.
 */
export function RoomList({ rooms, hideBuilding, onEdit, onRetire, onRestore }: RoomListProps) {
  const actions = (room: Room) => (
    <RoomRowActions room={room} onEdit={onEdit} onRetire={onRetire} onRestore={onRestore} />
  )

  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Room</TableCell>
              {!hideBuilding && <TableCell>Building</TableCell>}
              <TableCell>Rent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {room.roomCode}
                  </Typography>
                </TableCell>
                {!hideBuilding && (
                  <TableCell>
                    <Typography variant="body2">{room.building.displayName}</Typography>
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2">{formatMoney(room.baseRent)} / month</Typography>
                </TableCell>
                <TableCell>
                  {room.isActive ? (
                    <Chip label="Active" size="small" color="success" variant="outlined" />
                  ) : (
                    <RetiredChip />
                  )}
                </TableCell>
                <TableCell align="right">{actions(room)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {rooms.map((room) => (
          <Card key={room.id} variant="outlined">
            <CardContent sx={{ pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {room.roomCode}
                  </Typography>
                  {!hideBuilding && (
                    <Typography variant="body2" color="text.secondary">
                      {room.building.displayName}
                    </Typography>
                  )}
                  <Typography variant="body2">{formatMoney(room.baseRent)} / month</Typography>
                </Box>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                  {!room.isActive && <RetiredChip />}
                  {actions(room)}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}
