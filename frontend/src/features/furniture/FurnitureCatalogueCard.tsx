import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArchiveIcon from '@mui/icons-material/Archive'
import EditIcon from '@mui/icons-material/Edit'
import UnarchiveIcon from '@mui/icons-material/Unarchive'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useIsOwner } from '@/features/auth/useAuth'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { FurnitureItemDialog } from '@/features/furniture/FurnitureItemDialog'
import {
  useFurnitureCatalogue,
  useRestoreFurnitureItem,
  useRetireFurnitureItem,
} from '@/features/furniture/hooks'
import type { FurnitureItem } from '@/features/furniture/types'

function ItemRow({
  item,
  actions,
  muted = false,
}: {
  item: FurnitureItem
  actions: React.ReactNode
  muted?: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        flexWrap: 'wrap',
        py: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, color: muted ? 'text.secondary' : 'text.primary' }}>
            {item.name}
          </Typography>
          <Chip size="small" variant="outlined" label={item.kind} />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatMoney(item.unitValue)} / cái
          {item.make && ` · ${item.make}`}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
        {actions}
      </Stack>
    </Box>
  )
}

/**
 * The building's furniture catalogue, beside its service-fee catalogue.
 *
 * ── Why the two are easy to confuse, and what keeps them apart ─────────────
 *
 * Both are per-building lists the owner maintains, sitting on the same page.
 * The difference is the whole point and each card has to say it: a service fee
 * is CHARGED every month, a furniture entry is HANDED OVER once. Neither does
 * anything by itself — a tenancy takes up a fee, a room holds an item.
 */
export function FurnitureCatalogueCard({ buildingId }: { buildingId: number }) {
  const isOwner = useIsOwner()
  // A retired entry is worth showing to the owner, who may want it back. To a
  // manager it is noise about a thing they cannot act on.
  const query = useFurnitureCatalogue(buildingId, isOwner)
  const retire = useRetireFurnitureItem(buildingId)
  const restore = useRestoreFurnitureItem(buildingId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FurnitureItem | null>(null)
  const [retiring, setRetiring] = useState<FurnitureItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const items = query.data?.data ?? []
  const dangDung = items.filter((item) => item.isActive)
  const daNgung = items.filter((item) => !item.isActive)

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      setRetiring(null)
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
            Nội thất
          </Typography>
          {isOwner && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              Thêm món
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Danh mục đồ đạc của toà — giường, tủ lạnh, máy lạnh… Khác với phí dịch vụ ở
          trên: <strong>phí thu hàng tháng, còn nội thất bàn giao một lần</strong>. Đặt ở
          đây chưa trang bị cho phòng nào; vào trang từng phòng để chọn ra.
        </Typography>

        {error && (
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {query.isPending ? (
          <Typography variant="body2" color="text.secondary">
            Đang tải…
          </Typography>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isOwner
              ? 'Toà này chưa khai món nội thất nào. Thêm giường, tủ lạnh, máy lạnh… nếu có.'
              : 'Toà này chưa khai món nội thất nào.'}
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {dangDung.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                actions={
                  isOwner ? (
                    <>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          setEditing(item)
                          setFormOpen(true)
                        }}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="warning"
                        startIcon={<ArchiveIcon />}
                        onClick={() => setRetiring(item)}
                      >
                        Ngưng
                      </Button>
                    </>
                  ) : null
                }
              />
            ))}

            {/*
              Retired entries, kept visible to the owner and set apart. Never
              deleted: rooms still hold them and hand-over records still name
              them, so "no longer offered" has to look different from "never
              existed".
            */}
            {isOwner && daNgung.length > 0 && (
              <Box sx={{ pt: 1.5 }}>
                <Typography variant="overline" color="text.secondary">
                  Đã ngưng dùng
                </Typography>
                <Stack divider={<Divider />}>
                  {daNgung.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      muted
                      actions={
                        <Button
                          size="small"
                          startIcon={<UnarchiveIcon />}
                          onClick={() => void run(() => restore.mutateAsync(item.id))}
                        >
                          Dùng lại
                        </Button>
                      }
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </CardContent>

      <FurnitureItemDialog
        open={formOpen}
        buildingId={buildingId}
        item={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={retiring !== null}
        title={`Ngưng dùng “${retiring?.name}”?`}
        description="Món này sẽ không còn hiện ra khi trang bị cho phòng. Những phòng đang có nó, và những bản bàn giao đã ghi nó, đều giữ nguyên."
        confirmLabel="Ngưng dùng"
        busy={retire.isPending}
        error={error}
        onClose={() => {
          setRetiring(null)
          setError(null)
        }}
        onConfirm={() => void run(() => retire.mutateAsync(retiring!.id))}
      />
    </Card>
  )
}
