import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddPhotoIcon from '@mui/icons-material/AddAPhoto'
import DeleteIcon from '@mui/icons-material/Delete'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useIsOwner } from '@/features/auth/useAuth'
import { errorMessage } from '@/lib/error-messages'
import {
  ROOM_PHOTO_ACCEPT,
  roomPhotoDownload,
} from '@/features/rooms/api'
import {
  useAttachRoomPhotos,
  useRemoveRoomPhoto,
  useRoomPhotos,
} from '@/features/rooms/hooks'
import type { RoomPhoto } from '@/features/rooms/types'

/**
 * A photograph's bytes are fetched through a link that expires, so the <img>
 * cannot simply point at a stable URL. Asked for when the tile mounts.
 */
function PhotoTile({
  roomId,
  photo,
  onRemove,
}: {
  roomId: number
  photo: RoomPhoto
  onRemove: (() => void) | null
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const asked = useRef(false)

  if (!asked.current) {
    asked.current = true
    roomPhotoDownload(roomId, photo.id)
      .then((signed) => setUrl(signed.url))
      .catch(() => setFailed(true))
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: 160,
        height: 120,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        flexShrink: 0,
      }}
    >
      {url && (
        <Box
          component="img"
          src={url}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
          onClick={() => window.open(url, '_blank', 'noopener')}
        />
      )}
      {failed && (
        <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: 'block' }}>
          Không tải được ảnh
        </Typography>
      )}
      {onRemove && (
        <IconButton
          size="small"
          aria-label="Xoá ảnh"
          onClick={onRemove}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'background.paper',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
}

/**
 * The room's photographs.
 *
 * Uploading is the same three steps every other image in this application
 * takes — the API signs, the browser sends the bytes to storage, the API
 * confirms — so a photograph never passes through the API process.
 *
 * Several at once are sent ONE AT A TIME, and a rejection is reported against
 * the file that failed rather than against the batch: choosing four and losing
 * all four because one was too large is the failure worth avoiding.
 */
export function RoomPhotosCard({ roomId, canEdit }: { roomId: number; canEdit: boolean }) {
  const isOwner = useIsOwner()
  const photosQuery = useRoomPhotos(roomId)
  const attach = useAttachRoomPhotos(roomId)
  const remove = useRemoveRoomPhoto(roomId)
  const input = useRef<HTMLInputElement>(null)
  const [removing, setRemoving] = useState<RoomPhoto | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const photos = photosQuery.data ?? []

  async function onChosen(files: FileList | null) {
    if (!files || files.length === 0) return
    setNote(null)
    setError(null)
    try {
      const failed = await attach.mutateAsync([...files])
      if (failed.length > 0) {
        setNote(`Không tải lên được: ${failed.join(', ')}. Ảnh quá 10 MB hoặc sai định dạng.`)
      }
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 1.5,
          }}
        >
          <Typography variant="h6" component="h3">
            Hình ảnh phòng
          </Typography>
          {canEdit && (
            <>
              <input
                ref={input}
                type="file"
                accept={ROOM_PHOTO_ACCEPT}
                multiple
                hidden
                onChange={(event) => {
                  void onChosen(event.target.files)
                  // Cho phép chọn lại đúng tệp vừa chọn.
                  event.target.value = ''
                }}
              />
              <Button
                variant="outlined"
                startIcon={
                  attach.isPending ? <CircularProgress size={18} /> : <AddPhotoIcon />
                }
                disabled={attach.isPending}
                onClick={() => input.current?.click()}
              >
                {attach.isPending ? 'Đang tải lên…' : 'Thêm ảnh'}
              </Button>
            </>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}
        {note && (
          <Alert severity="warning" sx={{ mb: 1.5 }} onClose={() => setNote(null)}>
            {note}
          </Alert>
        )}

        {photosQuery.isPending ? (
          <Typography variant="body2" color="text.secondary">
            Đang tải…
          </Typography>
        ) : photos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {canEdit
              ? 'Chưa có ảnh nào. Thêm vài tấm để nhận ra phòng này trong danh sách.'
              : 'Chưa có ảnh nào cho phòng này.'}
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {photos.map((photo) => (
              <PhotoTile
                key={photo.id}
                roomId={roomId}
                photo={photo}
                onRemove={canEdit ? () => setRemoving(photo) : null}
              />
            ))}
          </Stack>
        )}

        {photos.length > 0 && isOwner && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Ảnh đầu tiên là ảnh đại diện, hiện trong bảng danh sách phòng.
          </Typography>
        )}
      </CardContent>

      <ConfirmDialog
        open={removing !== null}
        title="Xoá ảnh này?"
        description="Ảnh bị xoá hẳn khỏi kho lưu trữ, không lấy lại được."
        confirmLabel="Xoá ảnh"
        busyLabel="Đang xoá…"
        destructive
        busy={remove.isPending}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          setError(null)
          try {
            await remove.mutateAsync(removing!.id)
            setRemoving(null)
          } catch (cause) {
            setRemoving(null)
            setError(errorMessage(cause))
          }
        }}
      />
    </Card>
  )
}
