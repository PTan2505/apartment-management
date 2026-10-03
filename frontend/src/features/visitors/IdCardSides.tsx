import { useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BadgeIcon from '@mui/icons-material/Badge'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import * as visitorsApi from '@/features/visitors/api'
import { ID_CARD_ACCEPT } from '@/features/visitors/api'
import { useUploadIdCard } from '@/features/visitors/hooks'
import type { Visitor } from '@/features/visitors/types'

type Side = 'front' | 'back'
const LABEL: Record<Side, string> = { front: 'Mặt trước', back: 'Mặt sau' }

/** Opens a photograph on a link signed at the moment it is asked for. */
async function openSide(id: number, side: Side) {
  const { url } = await visitorsApi.idCardDownloadUrl(id, side)
  window.open(url, '_blank', 'noopener')
}

/**
 * The two sides of a visitor's identity document.
 *
 * ── Why a failure is reported PER SIDE ──────────────────────────────────────
 *
 * There are two pickers and two uploads. "Tải ảnh thất bại" on a card with both
 * tells the reader to redo both, and the one that worked is then replaced for
 * nothing. So the message names the side, and the side that succeeded keeps its
 * photograph.
 *
 * Both sides are optional. Somebody standing in a corridor without their
 * cousin's card should be able to file the registration and add the pictures
 * afterwards, which is why nothing here blocks anything.
 */
export function IdCardSides({ visitor }: { visitor: Visitor }) {
  const upload = useUploadIdCard(visitor.leaseId)
  const inputs = {
    front: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  }
  const [busySide, setBusySide] = useState<Side | null>(null)
  const [failed, setFailed] = useState<{ side: Side; message: string } | null>(null)

  const onFile = async (side: Side, file: File | undefined) => {
    if (file === undefined) return
    setFailed(null)
    setBusySide(side)
    try {
      await upload.mutateAsync({ id: visitor.id, side, file })
    } catch (cause) {
      setFailed({
        side,
        message: isApiError(cause)
          ? errorMessage(cause)
          : cause instanceof Error
            ? cause.message
            : 'Không tải được ảnh lên.',
      })
    } finally {
      setBusySide(null)
    }
  }

  const has: Record<Side, boolean> = {
    front: visitor.hasIdCardFront,
    back: visitor.hasIdCardBack,
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <BadgeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        {(['front', 'back'] as Side[]).map((side) => (
          <Box key={side} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <input
              ref={inputs[side]}
              type="file"
              accept={ID_CARD_ACCEPT}
              hidden
              onChange={(event) => {
                void onFile(side, event.target.files?.[0])
                // Cleared so choosing the same file twice fires a change again.
                event.target.value = ''
              }}
            />
            {has[side] ? (
              <Button size="small" variant="outlined" onClick={() => void openSide(visitor.id, side)}>
                {LABEL[side]}
              </Button>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {LABEL[side]}: chưa có
              </Typography>
            )}
            <Button
              size="small"
              startIcon={
                busySide === side ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PhotoCameraIcon fontSize="small" />
                )
              }
              disabled={busySide !== null}
              onClick={() => inputs[side].current?.click()}
            >
              {has[side] ? 'Thay' : 'Thêm'}
            </Button>
          </Box>
        ))}
      </Stack>
      {failed !== null && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {LABEL[failed.side]}: {failed.message}
        </Alert>
      )}
    </Box>
  )
}
