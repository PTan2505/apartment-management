import { useState } from 'react'
import { useNavigate } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, type PageMeta } from '@/components/Pagination'
import { RoomList } from '@/features/rooms/RoomList'
import { CreateRoomButton } from '@/features/rooms/CreateRoomButton'
import { RoomFormDialog } from '@/features/rooms/RoomFormDialog'
import { RetireRoomDialog } from '@/features/rooms/RetireRoomDialog'
import { useRestoreRoom } from '@/features/rooms/hooks'
import { LeaseFormDialog } from '@/features/leases/LeaseFormDialog'
import type { Room } from '@/features/rooms/types'

interface RoomsSectionProps {
  rooms: Room[] | undefined
  meta: PageMeta | undefined
  isPending: boolean
  error: unknown
  onRetry: () => void
  onPageChange: (page: number) => void
  /** True when filters are applied, so emptiness means "no match". */
  hasFilters?: boolean
  onClearFilters?: () => void
  /** Fixes the building for new rooms, and hides the building column. */
  buildingId?: number
}

/**
 * Everything about rooms except how they were queried.
 *
 * Both the rooms screen and a building's own view render this; they differ only
 * in how they narrow the list and whether a building is already established.
 * Keeping the dialogs here means the two screens cannot drift apart on what
 * editing or retiring a room does.
 */
export function RoomsSection({
  rooms,
  meta,
  isPending,
  error,
  onRetry,
  onPageChange,
  hasFilters,
  onClearFilters,
  buildingId,
}: RoomsSectionProps) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [retiring, setRetiring] = useState<Room | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const restoreMutation = useRestoreRoom()
  const navigate = useNavigate()
  // The room a tenancy is being signed for, or null. The dialog is the same one
  // the leases screen opens — it simply arrives with the room already chosen.
  const [lettingRoom, setLettingRoom] = useState<Room | null>(null)

  async function handleRestore(room: Room) {
    setRestoreError(null)
    try {
      await restoreMutation.mutateAsync(room.id)
    } catch (err) {
      // Restoring is refused when another room in service has taken this code
      // since it was retired. The owner did nothing wrong and the reason is not
      // obvious, so the API's own message is shown rather than a generic one.
      setRestoreError(
        errorMessage(err),
      )
    }
  }

  function body() {
    if (isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (error) {
      return (
        <Alert
          severity={isApiError(error) && error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách phòng</AlertTitle>
          {errorMessage(error)}
        </Alert>
      )
    }

    if (!rooms || rooms.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có phòng nào khớp bộ lọc"
          description="Thử toà nhà hoặc mã phòng khác, hoặc xoá bộ lọc."
          action={
            onClearFilters && (
              <Button variant="outlined" onClick={onClearFilters}>
                Xoá bộ lọc
              </Button>
            )
          }
        />
      ) : (
        <EmptyState
          title="Chưa có phòng nào"
          description={
            buildingId
              ? 'Thêm phòng đầu tiên cho toà nhà này.'
              : 'Thêm phòng đầu tiên để bắt đầu.'
          }
          action={<CreateRoomButton buildingId={buildingId} />}
        />
      )
    }

    return (
      <>
        <RoomList
          rooms={rooms}
          hideBuilding={buildingId !== undefined}
          onEdit={(room) => {
            setEditing(room)
            setFormOpen(true)
          }}
          onRetire={setRetiring}
          onRestore={handleRestore}
          onStartLease={setLettingRoom}
        />
        {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
      </>
    )
  }

  return (
    <Box>
      {restoreError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setRestoreError(null)}>
          <AlertTitle>Chưa thể dùng lại phòng này</AlertTitle>
          {restoreError}
        </Alert>
      )}

      {body()}

      {/* Editing only. Adding a room lives beside each screen's title, in
          `CreateRoomButton`, so the action sits where every other screen puts
          it rather than above this frame. */}
      <RoomFormDialog
        open={formOpen}
        room={editing}
        buildingId={buildingId}
        onClose={() => setFormOpen(false)}
      />
      <RetireRoomDialog room={retiring} onClose={() => setRetiring(null)} />
      <LeaseFormDialog
        open={lettingRoom !== null}
        roomId={lettingRoom?.id}
        onClose={() => setLettingRoom(null)}
        onCreated={(lease) => void navigate(`/leases/${lease.id}`)}
      />
    </Box>
  )
}
