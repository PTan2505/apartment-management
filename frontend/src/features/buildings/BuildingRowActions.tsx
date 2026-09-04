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

import type { Building } from '@/features/buildings/types'

interface BuildingRowActionsProps {
  building: Building
  onEdit: (building: Building) => void
  onRetire: (building: Building) => void
  onRestore: (building: Building) => void
}

/** Shared by the table and the cards, so both offer exactly the same actions. */
export function BuildingRowActions({
  building,
  onEdit,
  onRetire,
  onRestore,
}: BuildingRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const close = () => setAnchorEl(null)

  function run(action: (building: Building) => void) {
    close()
    action(building)
  }

  return (
    <>
      <IconButton
        aria-label={`Actions for ${building.displayName}`}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={close}>
        <MenuItem onClick={() => run(onEdit)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sửa</ListItemText>
        </MenuItem>
        {building.isActive ? (
          <MenuItem onClick={() => run(onRetire)}>
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ngừng sử dụng</ListItemText>
          </MenuItem>
        ) : (
          // No confirmation: restoring is not destructive.
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
