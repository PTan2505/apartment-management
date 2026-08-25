import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import DescriptionIcon from '@mui/icons-material/Description'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'

import type { Room } from '@/features/rooms/types'

interface RoomRowActionsProps {
  room: Room
  onEdit: (room: Room) => void
  onRetire: (room: Room) => void
  onRestore: (room: Room) => void
  /** Offered only where the room is in service and not already let. */
  onStartLease: (room: Room) => void
}

/**
 * Shared by the table and the cards, so both offer exactly the same actions.
 *
 * Deliberately not merged with the buildings' equivalent, despite the two being
 * structurally identical today. They already diverge in behaviour — restoring a
 * room can be refused where restoring a building cannot — and the screens still
 * to come (leases, invoices, expenses) have action sets that are not edit /
 * retire / restore at all. Two examples that happen to match is not evidence of
 * a shared shape; a third that differs would only force the abstraction back
 * apart.
 */
export function RoomRowActions({
  room,
  onEdit,
  onRetire,
  onRestore,
  onStartLease,
}: RoomRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const close = () => setAnchorEl(null)

  function run(action: (room: Room) => void) {
    close()
    action(room)
  }

  return (
    <>
      <IconButton
        aria-label={`Actions for ${room.roomCode}`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        {/*
          Signing a tenancy begins with a particular room — the owner knows
          which one is empty before they know whose name goes on it. Offered
          here so the work can start where it actually starts.

          Withheld on a room that is already let (it cannot take a second
          tenancy) and on a retired one (the API rejects it). Not offering
          beats explaining a refusal.
        */}
        {room.isActive && !room.isLet && (
          <MenuItem onClick={() => run(onStartLease)}>
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Hợp đồng mới</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={() => run(onEdit)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sửa</ListItemText>
        </MenuItem>
        {room.isActive ? (
          <MenuItem onClick={() => run(onRetire)}>
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ngừng sử dụng</ListItemText>
          </MenuItem>
        ) : (
          // Restoring can still be refused — another room may have taken this
          // code since — so it is attempted rather than assumed to succeed.
          <MenuItem onClick={() => run(onRestore)}>
            <ListItemIcon>
              <UnarchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Dùng lại</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
