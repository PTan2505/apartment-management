import { useState } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'

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
  const [open, setOpen] = useState(false)
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
