import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useIsOwner } from '@/features/auth/useAuth'
import { errorMessage } from '@/lib/error-messages'
import { formatDate } from '@/features/leases/dates'
import { formatMoney } from '@/lib/format'
import { AddRoomFurnitureDialog } from '@/features/furniture/AddRoomFurnitureDialog'
import { FURNITURE_CONDITIONS, conditionColor, conditionLabel } from '@/features/furniture/labels'
import {
  useRemoveRoomFurniture,
  useRoomFurniture,
  useUpdateRoomFurniture,
} from '@/features/furniture/hooks'
import type { FurnitureCondition, RoomFurniture } from '@/features/furniture/types'

/**
 * What this room holds, and what the list is for.
 *
 * ── Why it says what it is for ─────────────────────────────────────────────
 *
 * The list alone is ambiguous. These items are written into the hand-over
 * record of every tenancy signed from now on, and they are what a departing
 * tenant is checked against — a reader who takes it for an inventory kept for
 * its own sake will not keep it current, and the first anybody notices is an
 * argument at move-out with nothing to settle it.
 */
export function RoomFurnitureCard({
  roomId,
  buildingId,
}: {
  roomId: number
  buildingId: number
}) {
  const isOwner = useIsOwner()
  const query = useRoomFurniture(roomId)
  const update = useUpdateRoomFurniture(roomId)
  const remove = useRemoveRoomFurniture(roomId)

  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<RoomFurniture | null>(null)
  const [error, setError] = useState<string | null>(null)

  const holdings = query.data?.data ?? []
  const total = query.data?.totalValue ?? 0

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      setRemoving(null)
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
            mb: 0.5,
          }}
        >
          <Typography variant="h6" component="h3">
            Nội thất trong phòng
          </Typography>
          {isOwner && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Thêm đồ
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Danh sách này được <strong>chép vào bản bàn giao của mọi hợp đồng ký từ nay</strong>,
          và là thứ đối chiếu khi khách trả phòng. Đồ thuộc về phòng, không mất đi khi
          khách dọn ra.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {query.isPending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : query.error ? (
          <Alert severity="error">{errorMessage(query.error)}</Alert>
        ) : holdings.length === 0 ? (
          <Alert severity="info">
            Phòng này chưa có đồ nào. Hợp đồng ký ở đây sẽ ghi{' '}
            <strong>bàn giao không có nội thất</strong>.
          </Alert>
        ) : (
          <>
            <Stack divider={<Divider />}>
              {holdings.map((holding) => (
                <Box key={holding.id} sx={{ py: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 600 }}>{holding.name}</Typography>
                        <Chip size="small" variant="outlined" label={holding.kind} />
                        {/*
                          The catalogue entry behind it was retired. The room
                          keeps the item — said here so the owner is not left
                          wondering why it no longer appears in the picker.
                        */}
                        {holding.itemRetired && (
                          <Chip size="small" color="warning" variant="outlined" label="Đã ngưng trong danh mục" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {holding.quantity} × {formatMoney(holding.unitValue)} ={' '}
                        <strong>{formatMoney(holding.totalValue)}</strong>
                        {holding.make && ` · ${holding.make}`} · từ {formatDate(holding.acquiredOn)}
                      </Typography>
                      {holding.note && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          {holding.note}
                        </Typography>
                      )}
                    </Box>

                    {isOwner ? (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                        <TextField
                          select
                          size="small"
                          label="Tình trạng"
                          value={holding.condition}
                          onChange={(event) =>
                            void run(() =>
                              update.mutateAsync({
                                id: holding.id,
                                input: { condition: event.target.value as FurnitureCondition },
                              }),
                            )
                          }
                          sx={{ minWidth: 120 }}
                        >
                          {FURNITURE_CONDITIONS.map((value) => (
                            <MenuItem key={value} value={value}>
                              {conditionLabel(value)}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => setRemoving(holding)}
                        >
                          Bỏ
                        </Button>
                      </Stack>
                    ) : (
                      <Chip
                        size="small"
                        color={conditionColor(holding.condition)}
                        label={conditionLabel(holding.condition)}
                      />
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body2" sx={{ textAlign: 'right' }}>
              Tổng giá trị: <strong>{formatMoney(total)}</strong>
            </Typography>
          </>
        )}
      </CardContent>

      <AddRoomFurnitureDialog
        open={addOpen}
        roomId={roomId}
        buildingId={buildingId}
        onClose={() => setAddOpen(false)}
      />

      <ConfirmDialog
        open={removing !== null}
        title={`Bỏ “${removing?.name}” khỏi phòng?`}
        description="Dùng khi đồ bị vứt đi hoặc chuyển sang phòng khác. Những bản bàn giao đã ghi món này vẫn giữ nguyên — chúng ghi lại thứ đã trao cho khách hôm đó."
        confirmLabel="Bỏ khỏi phòng"
        destructive
        busy={remove.isPending}
        error={error}
        onClose={() => {
          setRemoving(null)
          setError(null)
        }}
        onConfirm={() => void run(() => remove.mutateAsync(removing!.id))}
      />
    </Card>
  )
}
