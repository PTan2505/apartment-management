import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BadgeIcon from '@mui/icons-material/Badge'
import DeleteIcon from '@mui/icons-material/Delete'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import * as customersApi from '@/features/customers/api'
import { ID_CARD_ACCEPT, type IdCardSide } from '@/features/customers/api'
import { useCustomer, useIdCardUrl } from '@/features/customers/hooks'

const TEN: Record<IdCardSide, string> = { front: 'Mặt trước', back: 'Mặt sau' }

/**
 * The signatory's ID card, on the tenancy's page.
 *
 * It belongs to the PERSON, and says so: replacing it here replaces it for
 * every tenancy they have signed, which is the point — one person, one card.
 *
 * Reading is through a link the API signs and that expires in minutes, so
 * nothing here holds a permanent address to somebody's identity document.
 */
export function IdCardCard({ customerId, name }: { customerId: number; name: string | null }) {
  const customerQuery = useCustomer(customerId)
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['customers'] })
  }

  async function upload(side: IdCardSide, file: File) {
    setError(null)
    setBusy(`${side}:uploading`)
    try {
      const signed = await customersApi.signIdCardUpload(customerId, side, file.type)
      // Checked before the upload as well as at confirmation: the upload is the
      // slow part, and refusing after it wastes the wait.
      if (file.size > signed.maxBytes) {
        throw new Error(`Ảnh vượt quá ${Math.round(signed.maxBytes / 1024 / 1024)} MB`)
      }
      await customersApi.uploadIdCardToStorage(signed, file)
      await customersApi.confirmIdCard(customerId, side, signed.key)
      refresh()
    } catch (cause) {
      setError(
        isApiError(cause)
          ? errorMessage(cause)
          : cause instanceof Error
            ? cause.message
            : 'Không tải lên được ảnh này.',
      )
    } finally {
      setBusy(null)
    }
  }

  async function remove(side: IdCardSide) {
    setError(null)
    setBusy(`${side}:removing`)
    try {
      await customersApi.removeIdCard(customerId, side)
      refresh()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(null)
    }
  }

  const customer = customerQuery.data

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <BadgeIcon color="action" />
          <Typography variant="h6" component="h3">
            Căn cước công dân
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Của {name ?? 'người đứng tên'}. Ảnh lưu theo khách, dùng chung cho mọi hợp đồng của
          người này.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {customerQuery.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {(['front', 'back'] as const).map((side) => (
              <MotCanhCuoc
                key={side}
                customerId={customerId}
                side={side}
                coAnh={
                  (side === 'front' ? customer?.hasIdCardFront : customer?.hasIdCardBack) ?? false
                }
                busy={busy}
                onUpload={upload}
                onRemove={remove}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * One side, with the image itself rather than a button that fetches it.
 *
 * The picture IS the information here: an owner checking a tenant's card wants
 * to see the card, and "Đã có ảnh" beside a button asks them to take that on
 * trust and click to find out. Clicking the image still opens it full size,
 * because a card photographed at phone resolution is unreadable this small.
 *
 * The link is signed and expires in ten minutes, which is why it comes from a
 * query that refreshes rather than a URL held in state.
 */
function MotCanhCuoc({
  customerId,
  side,
  coAnh,
  busy,
  onUpload,
  onRemove,
}: {
  customerId: number
  side: IdCardSide
  coAnh: boolean
  busy: string | null
  onUpload: (side: IdCardSide, file: File) => Promise<void>
  onRemove: (side: IdCardSide) => Promise<void>
}) {
  const input = useRef<HTMLInputElement>(null)
  const linkQuery = useIdCardUrl(customerId, side, coAnh)

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        {TEN[side]}
      </Typography>

      {coAnh ? (
        linkQuery.data ? (
          <Box
            component="a"
            href={linkQuery.data.url}
            target="_blank"
            rel="noopener"
            title="Mở ảnh kích thước đầy đủ"
            sx={{ display: 'block', mb: 1 }}
          >
            <Box
              component="img"
              src={linkQuery.data.url}
              alt={`${TEN[side]} căn cước`}
              sx={{
                width: '100%',
                height: 160,
                // The whole card must be visible: cropping to fill would cut off
                // exactly the edges somebody is checking.
                objectFit: 'contain',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                bgcolor: 'action.hover',
                display: 'block',
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              height: 160,
              mb: 1,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {linkQuery.isError ? (
              <Typography variant="body2" color="text.secondary">
                Không tải được ảnh
              </Typography>
            ) : (
              <CircularProgress size={20} />
            )}
          </Box>
        )
      ) : (
        <Box
          sx={{
            height: 160,
            mb: 1,
            borderRadius: 1,
            border: 1,
            borderStyle: 'dashed',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Chưa có ảnh
          </Typography>
        </Box>
      )}

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          size="small"
          startIcon={<PhotoCameraIcon />}
          disabled={busy !== null}
          onClick={() => input.current?.click()}
        >
          {busy === `${side}:uploading` ? 'Đang tải lên…' : coAnh ? 'Thay ảnh' : 'Tải ảnh lên'}
        </Button>
        {coAnh && (
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={busy !== null}
            onClick={() => void onRemove(side)}
          >
            {busy === `${side}:removing` ? 'Đang xoá…' : 'Xoá'}
          </Button>
        )}
      </Stack>

      <input
        ref={input}
        type="file"
        accept={ID_CARD_ACCEPT}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void onUpload(side, file)
          event.target.value = ''
        }}
      />
    </Box>
  )
}
