import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import EditIcon from '@mui/icons-material/Edit'
import ArchiveIcon from '@mui/icons-material/Archive'
import UnarchiveIcon from '@mui/icons-material/Unarchive'

import type { Room } from '@/features/rooms/types'

interface RoomRowActionsProps {
  room: Room
  onEdit: (room: Room) => void
  onRetire: (room: Room) => void
  onRestore: (room: Room) => void
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
export function RoomRowActions({ room, onEdit, onRetire, onRestore }: RoomRowActionsProps) {
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
        <MenuItem onClick={() => run(onEdit)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        {room.isActive ? (
          <MenuItem onClick={() => run(onRetire)}>
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Retire</ListItemText>
          </MenuItem>
        ) : (
          // Restoring can still be refused — another room may have taken this
          // code since — so it is attempted rather than assumed to succeed.
          <MenuItem onClick={() => run(onRestore)}>
            <ListItemIcon>
              <UnarchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Restore</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
