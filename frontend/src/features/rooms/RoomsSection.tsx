import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import AddIcon from '@mui/icons-material/Add'

import { isApiError } from '@/lib/api-error'
import { EmptyState } from '@/components/EmptyState'
import { Pagination, type PageMeta } from '@/components/Pagination'
import { RoomList } from '@/features/rooms/RoomList'
import { RoomFormDialog } from '@/features/rooms/RoomFormDialog'
import { RetireRoomDialog } from '@/features/rooms/RetireRoomDialog'
import { useRestoreRoom } from '@/features/rooms/hooks'
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

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  async function handleRestore(room: Room) {
    setRestoreError(null)
    try {
      await restoreMutation.mutateAsync(room.id)
    } catch (err) {
      // Restoring is refused when another room in service has taken this code
      // since it was retired. The owner did nothing wrong and the reason is not
      // obvious, so the API's own message is shown rather than a generic one.
      setRestoreError(
        isApiError(err) ? err.message : 'Could not restore that room.',
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
              Retry
            </Button>
          }
        >
          <AlertTitle>Could not load rooms</AlertTitle>
          {isApiError(error) ? error.message : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!rooms || rooms.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="No rooms match these filters"
          description="Try a different building or code, or clear the filters."
          action={
            onClearFilters && (
              <Button variant="outlined" onClick={onClearFilters}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <EmptyState
          title="No rooms yet"
          description={
            buildingId
              ? 'Add the first room in this building.'
              : 'Add the first room you manage to get started.'
          }
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              New room
            </Button>
          }
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
        />
        {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
      </>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          New room
        </Button>
      </Box>

      {restoreError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setRestoreError(null)}>
          <AlertTitle>Cannot restore this room</AlertTitle>
          {restoreError}
        </Alert>
      )}

      {body()}

      <RoomFormDialog
        open={formOpen}
        room={editing}
        buildingId={buildingId}
        onClose={() => setFormOpen(false)}
        onCreated={() => {
          // Rooms are ordered by creation, so a new one lands last — often on a
          // page the owner is not on.
          const total = meta?.total ?? 0
          const pageSize = meta?.pageSize ?? 20
          onPageChange(Math.ceil((total + 1) / pageSize))
        }}
      />
      <RetireRoomDialog room={retiring} onClose={() => setRetiring(null)} />
    </Box>
  )
}
