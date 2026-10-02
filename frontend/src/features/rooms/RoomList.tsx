import { useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'
import { useIsOwner } from '@/features/auth/useAuth'
import { roomPhotoDownload } from '@/features/rooms/api'
// The same "last day covered" rendering the tenancy screens use: a stored end
// is the first day NOT covered, so showing it raw would be a day late.
import { formatCoveredThrough } from '@/features/leases/dates'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { RoomRowActions } from '@/features/rooms/RoomRowActions'
import type { Room } from '@/features/rooms/types'

interface RoomListProps {
  rooms: Room[]
  /**
   * Suppresses the building column and card line. Inside a building's own view
   * the building is established by context, and repeating it on every row is
   * noise.
   */
  hideBuilding?: boolean
  onEdit: (room: Room) => void
  onRetire: (room: Room) => void
  onRestore: (room: Room) => void
  onStartLease: (room: Room) => void
  /**
   * Opening a room that is LET opens the tenancy holding it.
   *
   * Nothing an owner clicking a let room wants is on the room's own record —
   * the terms, the tenant, the bills and the dates are all on the tenancy, and
   * the room is how they got there. A vacant room has no tenancy to open, so
   * its row stays inert.
   */
  onOpenRoom: (roomId: number) => void
}

/**
 * A room out of service.
 *
 * The row is greyed, but grey alone is not a label: it does not survive a
 * screenshot sent to somebody, it says nothing to a reader who cannot pick the
 * shade out, and on the phone cards there is no row of neighbours to compare
 * against. So the state is still written, quietly.
 *
 * Its opposite is NOT written. "Đang hoạt động" on every row of an in-service
 * list marks nothing — a mark that applies to everything distinguishes nothing.
 */
function RetiredChip() {
  return <Chip label="Đã ngưng" size="small" variant="outlined" />
}

/**
 * Ảnh đại diện của một phòng: tấm ĐẦU TIÊN, hoặc một ô giữ chỗ cùng kích cỡ.
 *
 * Ô giữ chỗ phải cùng kích cỡ, nếu không bảng sẽ nhảy cao thấp giữa các trang
 * tuỳ trang đó có phòng nào có ảnh hay không.
 *
 * Link tải về sống ngắn nên không gắn thẳng vào src được — hỏi khi ô hiện ra.
 */
function Thumb({ room }: { room: Room }) {
  const first = room.photos?.[0]
  const [url, setUrl] = useState<string | null>(null)
  const asked = useRef(false)

  if (first && !asked.current) {
    asked.current = true
    roomPhotoDownload(room.id, first.id)
      .then((signed) => setUrl(signed.url))
      .catch(() => undefined)
  }

  return (
    <Box
      sx={{
        width: 56,
        height: 42,
        borderRadius: 1,
        bgcolor: 'action.hover',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {url && (
        <Box
          component="img"
          src={url}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </Box>
  )
}

/** Nền xám cho phòng đã ngưng, lấy từ theme chứ không gõ mã màu. */
const NGUNG_SX = {
  backgroundColor: 'action.hover',
  '& .MuiTypography-root': { color: 'text.secondary' },
} as const

/**
 * Whether the room is currently let, read from what the API reports about the
 * room rather than worked out from the tenancies.
 *
 * Shown beside "in service" because they answer different questions and are
 * routinely confused: a room can be in service and let, in service and empty,
 * or retired. Only the second can take a new tenancy.
 */
function OccupancyChip({ isLet }: { isLet: boolean }) {
  return isLet ? (
    <Chip label="Đang cho thuê" size="small" color="info" variant="outlined" />
  ) : (
    <Chip label="Còn trống" size="small" variant="outlined" />
  )
}

/**
 * One list, two homes: the rooms screen and a building's own view.
 *
 * The difference is a single column, so it is a prop rather than a second
 * component — the rows, cards, actions and dialogs are identical.
 *
 * Both presentations are always mounted and toggled with `display`, matching
 * the shell's drawers: a `useMediaQuery` branch returns false on first render
 * and would flash the wrong layout.
 */
export function RoomList({
  rooms,
  hideBuilding,
  onEdit,
  onRetire,
  onRestore,
  onStartLease,
  onOpenRoom,
}: RoomListProps) {
  /*
    Cột thao tác chỉ dành cho chủ nhà.

    Hệ quả: quản lí mất lối tắt "Hợp đồng mới" vốn nằm trong menu của hàng
    phòng. Họ vẫn ký được từ màn Hợp đồng — chỉ là phải chọn phòng trong form
    thay vì bắt đầu từ phòng đang nhìn.
  */
  const coThaoTac = useIsOwner()

  const actions = (room: Room) => (
    <RoomRowActions
      room={room}
      onEdit={onEdit}
      onRetire={onRetire}
      onRestore={onRestore}
      onStartLease={onStartLease}
    />
  )

  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 72 }} />
              <TableCell>Phòng</TableCell>
              {!hideBuilding && <TableCell>Toà nhà</TableCell>}
              <TableCell>Giá thuê</TableCell>
              {/*
                "Đang thuê" says whether the room is free today. This says WHEN
                — the question an owner has in front of a waiting tenant, and
                one they could otherwise answer only by looking the room up in
                the tenancy list.
              */}
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Trả phòng</TableCell>
              <TableCell>Trạng thái</TableCell>
              {/* Cột thao tác biến mất hẳn khi vai này không có thao tác nào —
                  một cột rỗng suốt bảng chỉ tổ chiếm chỗ. */}
              {coThaoTac && <TableCell align="right">Thao tác</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow
                key={room.id}
                hover
                // Mọi hàng mở được, kể cả phòng trống: trang phòng nói về
                // PHÒNG, nên nó luôn có gì đó để xem.
                sx={{ cursor: 'pointer', ...(room.isActive ? {} : NGUNG_SX) }}
                onClick={() => onOpenRoom(room.id)}
              >
                <TableCell sx={{ width: 72 }}>
                  <Thumb room={room} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {room.roomCode}
                  </Typography>
                </TableCell>
                {!hideBuilding && (
                  <TableCell>
                    <Typography variant="body2">{room.building.displayName}</Typography>
                  </TableCell>
                )}
                <TableCell>
                  <Typography variant="body2">{formatMoney(room.baseRent)} / tháng</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    {room.freeFrom ? formatCoveredThrough(room.freeFrom) : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {/*
                      Phòng đã ngưng KHÔNG hiện "Còn trống": nó trống thật,
                      nhưng không cho thuê được, và nói "còn trống" là mời
                      người ta ký vào một phòng API sẽ từ chối.
                    */}
                    {room.isActive ? <OccupancyChip isLet={room.isLet} /> : <RetiredChip />}
                  </Stack>
                </TableCell>
                {/* The actions are their own targets; a click here is not a
                    click on the row. */}
                {coThaoTac && (
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    {actions(room)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {rooms.map((room) => (
          <Card
            key={room.id}
            variant="outlined"
            sx={{ cursor: 'pointer', ...(room.isActive ? {} : NGUNG_SX) }}
            onClick={() => onOpenRoom(room.id)}
          >
            <CardContent sx={{ pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Thumb room={room} />
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {room.roomCode}
                  </Typography>
                  {!hideBuilding && (
                    <Typography variant="body2" color="text.secondary">
                      {room.building.displayName}
                    </Typography>
                  )}
                  <Typography variant="body2">{formatMoney(room.baseRent)} / tháng</Typography>
                  {room.freeFrom && (
                    <Typography variant="body2" color="text.secondary">
                      Trả phòng {formatCoveredThrough(room.freeFrom)}
                    </Typography>
                  )}
                </Box>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                  {room.isActive ? <OccupancyChip isLet={room.isLet} /> : <RetiredChip />}
                  {/* Their own targets, not the card's. */}
                  {coThaoTac && (
                    <Box onClick={(event) => event.stopPropagation()}>{actions(room)}</Box>
                  )}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}
