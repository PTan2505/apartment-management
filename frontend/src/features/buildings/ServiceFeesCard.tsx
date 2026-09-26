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
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { ServiceFeeFormDialog } from '@/features/buildings/ServiceFeeFormDialog'
import {
  useBuildingServiceFees,
  useRestoreServiceFee,
  useRetireServiceFee,
} from '@/features/buildings/hooks'
import type { BuildingServiceFee } from '@/features/buildings/types'

/** One row: what it is called, what it costs, and what can be done to it. */
function FeeRow({
  fee,
  actions,
  muted = false,
}: {
  fee: BuildingServiceFee
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
            {fee.name}
          </Typography>
          {/*
            Chỉ đánh dấu cái KHÁC thường. Gắn nhãn cho cả hai cách tính thì
            chẳng nhãn nào còn nổi bật, mà "theo phòng" mới là mặc định.
          */}
          {fee.basis === 'perPerson' && <Chip size="small" label="Theo đầu người" />}
          {fee.appliedByDefault && (
            <Chip size="small" color="primary" variant="outlined" label="Tự áp cho hợp đồng mới" />
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {formatMoney(fee.unitAmount)} / tháng
          {fee.basis === 'perPerson' && ' · mỗi người'}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
        {actions}
      </Stack>
    </Box>
  )
}

/**
 * The building's service-fee catalogue, and the owner's controls over it.
 *
 * What a building charges beside rent, electricity and water: rubbish,
 * internet, a parking space. Setting one here does NOT bill anybody — a
 * tenancy has to take it up, and the tenancy's own page is where that happens.
 * Said out loud on the card, because a list of fees that charges nobody is
 * exactly what an owner would assume was already working.
 *
 * Until now this had no screen at all: the rows could only be created with
 * `curl`, and the only place they were visible was a move-out dialog.
 */
export function ServiceFeesCard({ buildingId }: { buildingId: number }) {
  const isOwner = useIsOwner()
  // A retired fee is worth showing to the owner, who may want it back. To a
  // manager it is noise about a thing they cannot act on.
  const feesQuery = useBuildingServiceFees(buildingId, true, isOwner)
  const retireMutation = useRetireServiceFee(buildingId)
  const restoreMutation = useRestoreServiceFee(buildingId)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BuildingServiceFee | null>(null)
  const [retiring, setRetiring] = useState<BuildingServiceFee | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fees = feesQuery.data ?? []
  const dangDung = fees.filter((fee) => fee.isActive)
  const daNgung = fees.filter((fee) => !fee.isActive)

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(fee: BuildingServiceFee) {
    setEditing(fee)
    setFormOpen(true)
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
            Phí dịch vụ
          </Typography>
          {isOwner && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openAdd}>
              Thêm phí dịch vụ
            </Button>
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Các khoản thu hàng tháng ngoài tiền thuê, điện và nước — tiền rác, internet, giữ
          xe… Đặt ở đây là để chọn ra khi ký hợp đồng; hợp đồng nào có gắn thì mỗi lần
          chốt sổ sẽ tự cộng vào hoá đơn.
        </Typography>

        {error && (
          <Typography variant="body2" color="error.main" sx={{ mb: 1 }}>
            {error}
          </Typography>
        )}

        {feesQuery.isPending ? (
          <Typography variant="body2" color="text.secondary">
            Đang tải…
          </Typography>
        ) : dangDung.length === 0 && daNgung.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isOwner
              ? 'Toà này chưa có khoản thu nào. Thêm tiền rác, internet, giữ xe… nếu có.'
              : 'Toà này chưa có khoản thu nào ngoài tiền thuê, điện và nước.'}
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {dangDung.map((fee) => (
              <FeeRow
                key={fee.id}
                fee={fee}
                actions={
                  isOwner ? (
                    <>
                      <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(fee)}>
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="warning"
                        startIcon={<ArchiveIcon />}
                        onClick={() => setRetiring(fee)}
                      >
                        Ngưng
                      </Button>
                    </>
                  ) : null
                }
              />
            ))}

            {/*
              Retired fees, kept visible to the owner and set apart. A fee is
              never deleted — a tenancy that took it still has to be billable
              for the months it covered — so "gone" has to look different from
              "never existed".
            */}
            {daNgung.length > 0 && (
              <Box sx={{ pt: 1.5 }}>
                <Typography variant="overline" color="text.secondary" component="div">
                  Đã ngưng
                </Typography>
                <Stack divider={<Divider />}>
                  {daNgung.map((fee) => (
                    <FeeRow
                      key={fee.id}
                      fee={fee}
                      muted
                      actions={
                        <Button
                          size="small"
                          startIcon={<UnarchiveIcon />}
                          onClick={async () => {
                            setError(null)
                            try {
                              await restoreMutation.mutateAsync(fee.id)
                            } catch (cause) {
                              setError(errorMessage(cause))
                            }
                          }}
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

        {/* Đếm cho dễ liếc, chỉ khi có nhiều hơn một khoản. */}
        {dangDung.length > 1 && (
          <Box sx={{ mt: 1.5, display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
            {/*
              Cộng lại thì chỉ đúng khi mọi khoản đều tính theo phòng. Có một
              khoản theo đầu người là con số phụ thuộc hợp đồng nào, nên nói
              số lượng thay vì một tổng sai.
            */}
            <Chip
              size="small"
              variant="outlined"
              label={
                dangDung.some((fee) => fee.basis === 'perPerson')
                  ? `${dangDung.length} khoản đang áp dụng`
                  : `Tổng ${dangDung.length} khoản · ${formatMoney(
                      dangDung.reduce((tong, fee) => tong + fee.unitAmount, 0),
                    )} / tháng nếu gắn hết`
              }
            />
          </Box>
        )}
      </CardContent>

      <ServiceFeeFormDialog
        open={formOpen}
        buildingId={buildingId}
        fee={editing}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={retiring !== null}
        title="Ngưng khoản thu này?"
        description={
          retiring
            ? `"${retiring.name}" sẽ không chọn được cho hợp đồng mới nữa. Hợp đồng đang gắn nó vẫn tiếp tục bị tính như cũ — mỗi hợp đồng giữ giá riêng của nó. Ngưng xong vẫn dùng lại được.`
            : ''
        }
        confirmLabel="Ngưng khoản thu"
        busyLabel="Đang ngưng…"
        busy={retireMutation.isPending}
        error={error}
        onClose={() => setRetiring(null)}
        onConfirm={async () => {
          setError(null)
          try {
            await retireMutation.mutateAsync(retiring!.id)
            setRetiring(null)
          } catch (cause) {
            setRetiring(null)
            setError(errorMessage(cause))
          }
        }}
      />
    </Card>
  )
}
