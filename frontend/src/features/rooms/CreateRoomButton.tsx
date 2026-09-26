import { useState } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'

import { useIsOwner } from '@/features/auth/useAuth'
import { RoomFormDialog } from '@/features/rooms/RoomFormDialog'

interface CreateRoomButtonProps {
  /** Fixed when the button sits on one building's page. */
  buildingId?: number
  onCreated?: () => void
}

/**
 * Adding a room, button and dialog together.
 *
 * Separate from `RoomsSection` because the two screens that list rooms put this
 * action in their own header — the rooms screen and a building's page — while
 * the section itself is the frame below. Keeping the dialog with the button
 * means neither screen has to wire it up twice.
 */
export function CreateRoomButton({ buildingId, onCreated }: CreateRoomButtonProps) {
  const isOwner = useIsOwner()
  const [open, setOpen] = useState(false)

  // A room is created with the rent it asks, so adding one sets a price. Both
  // screens that carry this button get the rule from here rather than each
  // asking on its own.
  if (!isOwner) {
    return null
  }

  return (
    <>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
        Thêm phòng
      </Button>
      <RoomFormDialog
        open={open}
        room={null}
        buildingId={buildingId}
        onClose={() => setOpen(false)}
        onCreated={onCreated}
      />
    </>
  )
}
