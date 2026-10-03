import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DescriptionIcon from '@mui/icons-material/Description'
import EditIcon from '@mui/icons-material/Edit'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'

import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useIsOwner } from '@/features/auth/useAuth'
import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { formatCoveredThrough } from '@/features/leases/dates'
import { useRoom } from '@/features/rooms/hooks'
import { RoomFormDialog } from '@/features/rooms/RoomFormDialog'
import { RoomPhotosCard } from '@/features/rooms/RoomPhotosCard'
import { RoomFurnitureCard } from '@/features/furniture/RoomFurnitureCard'
import type { Room } from '@/features/rooms/types'

/** One fact: what it is called, and what it is. Same shape as the tenancy page. */
function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
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
 * A room on its own.
 *
 * This did not exist: a room was a row, and clicking it opened the TENANCY in
 * it — useful, but it meant the room itself had nowhere to live. Photographs
 * needed a home and so does the furniture inventory that follows, and two
 * features both wanting the same missing page is what finally earned it.
 */
export function RoomDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const navigate = useNavigate()
  const isOwner = useIsOwner()
  const [editing, setEditing] = useState(false)

  const roomQuery = useRoom(Number.isFinite(id) ? id : undefined)

  if (!Number.isInteger(id) || id <= 0) return <NotFound />

  if (roomQuery.isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (roomQuery.isError) {
    const error = roomQuery.error
    if (isApiError(error) && error.isNotFound) return <NotFound />
    return (
      <Alert severity={isApiError(error) && error.isTransport ? 'warning' : 'error'}>
        <AlertTitle>Không tải được phòng này</AlertTitle>
        {errorMessage(error)}
      </Alert>
    )
  }

  const room: Room = roomQuery.data

  return (
    <Box>
      <Button component={RouterLink} to="/rooms" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        Tất cả phòng
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2">
          {room.roomCode}
        </Typography>
        {/*
          Phòng đã ngưng KHÔNG hiện "Còn trống": nó trống thật, nhưng không cho
          thuê được — cùng quy tắc với bảng danh sách.
        */}
        {room.isActive ? (
          room.isLet ? (
            <Chip label="Đang cho thuê" size="small" color="info" variant="outlined" />
          ) : (
            <Chip label="Còn trống" size="small" variant="outlined" />
          )
        ) : (
          <Chip label="Đã ngưng" size="small" variant="outlined" />
        )}
      </Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        <Box
          component={RouterLink}
          to={`/buildings/${room.building.id}`}
          sx={{ color: 'inherit' }}
        >
          {room.building.displayName}
        </Box>
      </Typography>

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
              Thông tin phòng
            </Typography>
            {isOwner && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)}>
                Sửa phòng
              </Button>
            )}
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', [MOBILE_BREAKPOINT]: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <Field
              label="Giá thuê"
              value={`${formatMoney(room.baseRent)} / tháng`}
              hint="Giá phòng hỏi khách mới. Hợp đồng đang chạy giữ giá đã ký."
            />
            <Field
              label="Số điện ban đầu"
              value={
                room.initialMeterReading === null
                  ? 'Chưa ghi'
                  : `${room.initialMeterReading.toLocaleString('vi-VN')} kWh`
              }
              hint="Số công tơ lúc thêm phòng vào hệ thống"
            />
            <Field
              label={room.isLet ? 'Trả phòng' : 'Tình trạng'}
              value={
                room.isLet
                  ? formatCoveredThrough(room.freeFrom)
                  : room.isActive
                    ? 'Đang trống, cho thuê được'
                    : 'Đã ngưng hoạt động'
              }
            />
          </Box>

          {room.currentLeaseId && (
            <Button
              startIcon={<DescriptionIcon />}
              sx={{ mt: 1.5 }}
              onClick={() => navigate(`/leases/${room.currentLeaseId}`)}
            >
              Xem hợp đồng đang chạy
            </Button>
          )}
        </CardContent>
      </Card>

      {/*
        Ảnh được quản lí sửa — một ngoại lệ có chủ ý so với "phòng là của chủ
        nhà": giá phòng là chuyện kinh doanh, còn phòng TRÔNG thế nào là chuyện
        của người đang đứng trong đó với cái điện thoại.
      */}
      {/*
        Above the photographs, because this one is operational and they are
        descriptive: what the room HOLDS is copied onto every tenancy signed
        from here and is what a departing tenant is checked against, while the
        pictures are how the room looks.
      */}
      <RoomFurnitureCard roomId={room.id} buildingId={room.building.id} />

      <RoomPhotosCard roomId={room.id} canEdit />

      <RoomFormDialog
        open={editing}
        room={room}
        buildingId={room.building.id}
        onClose={() => setEditing(false)}
      />
    </Box>
  )
}

function NotFound() {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Không tìm thấy phòng
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Không có phòng nào ở địa chỉ này. Có thể nó đã bị xoá, hoặc địa chỉ sai.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/rooms">
        Tất cả phòng
      </Button>
    </Box>
  )
}
