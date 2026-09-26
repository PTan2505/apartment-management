import { useState, type ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon from '@mui/icons-material/Edit'
import { Link as RouterLink, useParams } from 'react-router'

import { CreateRoomButton } from '@/features/rooms/CreateRoomButton'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import type { Building } from '@/features/buildings/types'
import { ListSurface } from '@/components/ListSurface'
import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { useListParams } from '@/lib/useListParams'
import { useBuilding } from '@/features/buildings/hooks'
import { BuildingFormDialog } from '@/features/buildings/BuildingFormDialog'
import { useIsOwner } from '@/features/auth/useAuth'
import { ServiceFeesCard } from '@/features/buildings/ServiceFeesCard'
import { useRooms } from '@/features/rooms/hooks'
import { RoomsSection } from '@/features/rooms/RoomsSection'

/**
 * A building on its own, with the rooms that belong to it.
 *
 * `web-buildings` deferred this page on the grounds that it would only repeat
 * what the list row already shows. That was true of the building's own fields —
 * what makes the page worth having is the rooms, so it arrives with them.
 */
/**
 * One configured fact: what it is called, and what it is set to.
 *
 * Same shape as the tenancy page's, deliberately — an owner reading a rate here
 * and a rate there should not have to learn two layouts for the same kind of
 * information.
 */
function Field({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary" component="div">
        {label}
      </Typography>
      <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" component="div">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/**
 * What the owner has set this building to, gathered in one place.
 *
 * These figures used to sit in a single line of running text with two emoji in
 * it, which said what they were but not that they were SETTINGS — the reader
 * could not tell the rates apart from the address above them. They are the
 * numbers every tenancy signed here inherits, so they are shown as what they
 * are: fields, with what each one reaches stated beneath it.
 *
 * The fee catalogue is NOT here: it is a list that grows and has its own
 * controls, so it earns a card of its own directly below.
 */
function ConfigCard({ building, onEdit }: { building: Building; onEdit: (() => void) | null }) {
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
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h3">
            Cấu hình toà nhà
          </Typography>
          {/*
            Only the owner. A manager reads every figure here — they quote the
            rates when they sign — but what the building charges is not theirs
            to move, and a button that answers 403 teaches nothing.
          */}
          {onEdit && (
            <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>
              Sửa toà nhà
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            // Three across on a desktop; stacked on a phone, where three
            // columns would break "đ / người / tháng" across three lines.
            gridTemplateColumns: { xs: '1fr', [MOBILE_BREAKPOINT]: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <Field
            label="Giá điện"
            value={`${formatMoney(building.electricityRate)} / kWh`}
            hint="Áp cho hợp đồng ký từ nay về sau"
          />
          <Field
            label="Giá nước"
            value={`${formatMoney(building.waterRatePerPerson)} / người / tháng`}
            hint="Áp cho hợp đồng ký từ nay về sau"
          />
          <Field
            label="Tiền cọc mặc định"
            value={
              building.defaultDepositMonths === 0
                ? 'Không thu cọc'
                : `${building.defaultDepositMonths} tháng tiền thuê`
            }
            hint="Điền sẵn khi ký hợp đồng ở toà này"
          />
        </Box>

      </CardContent>
    </Card>
  )
}

/**
 * How full the building is, in the four numbers the rooms table cannot show at
 * a glance. Figures come from the API — a retired room is in neither the let
 * nor the empty count, and is reported on its own.
 */
function RoomStats({ building }: { building: Building }) {
  const items: { nhan: string; so: number; mau: string }[] = [
    { nhan: 'Đang hoạt động', so: building.roomsLet + building.roomsEmpty, mau: 'text.primary' },
    { nhan: 'Đang cho thuê', so: building.roomsLet, mau: 'success.main' },
    { nhan: 'Đang trống', so: building.roomsEmpty, mau: 'warning.main' },
    { nhan: 'Đang ngưng hoạt động', so: building.roomsRetired, mau: 'text.secondary' },
  ]
  return (
    <Box
      sx={{
        display: 'grid',
        // Four across on a desktop, two across on a phone: four columns at
        // 390px leave each figure about 80px, and the labels wrap to three lines.
        gridTemplateColumns: { xs: '1fr 1fr', [MOBILE_BREAKPOINT]: 'repeat(4, 1fr)' },
        gap: 1.5,
        mb: 2,
      }}
    >
      {items.map((item) => (
        <Paper key={item.nhan} variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {item.nhan}
          </Typography>
          <Typography variant="h5" sx={{ color: item.mau, fontWeight: 600 }}>
            {item.so}
          </Typography>
        </Paper>
      ))}
    </Box>
  )
}

export function BuildingDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const isOwner = useIsOwner()
  const [suaMo, setSuaMo] = useState(false)
  const { page, setPage } = useListParams<Record<string, string | undefined>>([])

  const buildingQuery = useBuilding(id)
  const roomsQuery = useRooms({ page, buildingId: Number.isFinite(id) ? id : undefined })

  if (!Number.isInteger(id) || id <= 0) {
    return <NotFound />
  }

  if (buildingQuery.isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (buildingQuery.isError) {
    const error = buildingQuery.error
    if (isApiError(error) && error.isNotFound) return <NotFound />
    return (
      <Alert severity={isApiError(error) && error.isTransport ? 'warning' : 'error'}>
        <AlertTitle>Không tải được toà nhà này</AlertTitle>
        {errorMessage(error)}
      </Alert>
    )
  }

  const building = buildingQuery.data

  return (
    <Box>
      <Button component={RouterLink} to="/buildings" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        Tất cả toà nhà
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2">
          {building.displayName}
        </Typography>
        {!building.isActive && <Chip label="Đang ngưng hoạt động" size="small" variant="outlined" />}
      </Box>
      {/*
        The address identifies the building; the settings below say how it
        bills. Kept apart on purpose — they used to run together, and the rates
        read as part of the address.
      */}
      <Typography color="text.secondary">{building.address}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {building.ward} · {building.city} · {building.country}
      </Typography>

      <ConfigCard building={building} onEdit={isOwner ? () => setSuaMo(true) : null} />

      <ServiceFeesCard buildingId={building.id} />

      <BuildingFormDialog
        open={suaMo}
        building={building}
        onClose={() => setSuaMo(false)}
      />

      {/*
        Kept, where the page titles were dropped: this one names a SECTION
        inside a page rather than the page. The shell's own title says "Toà
        nhà", so nothing else on the screen says what the table below is.
      */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Typography variant="h6" component="h3">
          Phòng
        </Typography>
        <CreateRoomButton buildingId={building.id} />
      </Box>

      {/*
        The four figures an owner opens a building for, above the table rather
        than counted off it: the table pages at twenty rooms, so counting what
        is on screen would answer for the page and not for the building.

        "Đang hoạt động" is stated rather than left to be added up, because it is the
        denominator the other two are read against.
      */}
      <RoomStats building={building} />
      <ListSurface>
        <RoomsSection
          rooms={roomsQuery.data?.data}
          meta={roomsQuery.data?.meta}
          isPending={roomsQuery.isPending}
          error={roomsQuery.error}
          onRetry={() => roomsQuery.refetch()}
          onPageChange={setPage}
          buildingId={building.id}
        />
      </ListSurface>
    </Box>
  )
}

function NotFound() {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Không tìm thấy toà nhà
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Không có toà nhà nào ở địa chỉ này. Có thể nó đã bị xoá, hoặc
        địa chỉ sai.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/buildings">
        Tất cả toà nhà
      </Button>
    </Box>
  )
}
