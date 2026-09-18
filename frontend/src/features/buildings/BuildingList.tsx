import type { MouseEvent } from 'react'
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
import Link from '@mui/material/Link'
import { Link as RouterLink, useNavigate } from 'react-router'

import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { BuildingRowActions } from '@/features/buildings/BuildingRowActions'
import type { Building } from '@/features/buildings/types'

interface BuildingListProps {
  buildings: Building[]
  onEdit: (building: Building) => void
  onRetire: (building: Building) => void
  onRestore: (building: Building) => void
}

function RetiredChip() {
  return <Chip label="Đang ngưng hoạt động" size="small" color="default" variant="outlined" />
}

/** One formatter: it shows a rate's fraction and leaves a whole value whole. */
function Rates({ building }: { building: Building }) {
  return (
    <>
      <Typography variant="body2">⚡ {formatMoney(building.electricityRate)} / kWh</Typography>
      <Typography variant="body2" color="text.secondary">
        💧 {formatMoney(building.waterRatePerPerson)} / người / tháng
      </Typography>
    </>
  )
}

/**
 * How full the building is, as two figures rather than "12 of 20".
 *
 * The empty count is the one that costs money, and making the reader subtract
 * to find it buries exactly the number they came for. Figures come from the
 * API, which counts rooms in service — a retired room is in neither.
 */
function Occupancy({ building }: { building: Building }) {
  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Chip
        size="small"
        variant="outlined"
        color={building.roomsLet > 0 ? 'success' : 'default'}
        label={`${building.roomsLet} đang thuê`}
      />
      <Chip
        size="small"
        variant="outlined"
        color={building.roomsEmpty > 0 ? 'warning' : 'default'}
        label={`${building.roomsEmpty} đang trống`}
      />
    </Stack>
  )
}

/**
 * Two renderings of the same data, chosen by width.
 *
 * A table of this width cannot usefully shrink — five columns crush below about
 * 700px, and horizontal scrolling hides exactly the columns being compared. The
 * cards carry the same fields and the same actions, restacked.
 *
 * Both are always mounted and toggled with `display`, matching the shell's
 * drawers: a `useMediaQuery` branch returns false on first render and would
 * flash the wrong layout.
 */
export function BuildingList({ buildings, onEdit, onRetire, onRestore }: BuildingListProps) {
  const navigate = useNavigate()

  /** A left click navigates in place; middle click or a modifier opens a tab. */
  const open = (building: Building, event: MouseEvent<HTMLElement>) => {
    const path = `/buildings/${building.id}`
    if (event.button === 1 || event.metaKey || event.ctrlKey || event.shiftKey) {
      event.preventDefault()
      window.open(path, '_blank', 'noopener')
      return
    }
    if (event.button === 0) {
      void navigate(path)
    }
  }

  const actions = (building: Building) => (
    <BuildingRowActions
      building={building}
      onEdit={onEdit}
      onRetire={onRetire}
      onRestore={onRestore}
    />
  )

  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Toà nhà</TableCell>
              <TableCell>Vị trí</TableCell>
              <TableCell>Phòng</TableCell>
              <TableCell>Đơn giá</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buildings.map((building) => (
              <TableRow
                key={building.id}
                hover
                /*
                  The row IS the link now, so it carries what a link carries:
                  the keyboard reaches it and Enter opens it, and a middle or
                  modifier click opens a new tab instead of doing nothing. A row
                  that navigates but silently loses "open in a new tab" is worse
                  than the small link it replaced.
                */
                role="link"
                tabIndex={0}
                aria-label={building.displayName}
                sx={{ cursor: 'pointer' }}
                onClick={(event) => open(building, event)}
                onAuxClick={(event) => open(building, event)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void navigate(`/buildings/${building.id}`)
                  }
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {building.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {building.address}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{building.ward}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {building.city}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Occupancy building={building} />
                </TableCell>
                <TableCell>
                  <Rates building={building} />
                </TableCell>
                <TableCell>
                  {building.isActive ? (
                    <Chip label="Đang hoạt động" size="small" color="success" variant="outlined" />
                  ) : (
                    <RetiredChip />
                  )}
                </TableCell>
                {/* The menu and everything it opens sit inside the row; without
                    this, using them would navigate out from under themselves. */}
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  {actions(building)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {buildings.map((building) => (
          <Card key={building.id} variant="outlined">
            <CardContent sx={{ pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Link
                    component={RouterLink}
                    to={`/buildings/${building.id}`}
                    variant="subtitle1"
                    sx={{ fontWeight: 500 }}
                  >
                    {building.displayName}
                  </Link>
                  <Typography variant="body2" color="text.secondary">
                    {building.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {building.ward} · {building.city}
                  </Typography>
                  <Rates building={building} />
                  <Box sx={{ mt: 1 }}>
                    <Occupancy building={building} />
                  </Box>
                </Box>
                <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                  {!building.isActive && <RetiredChip />}
                  {actions(building)}
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}
