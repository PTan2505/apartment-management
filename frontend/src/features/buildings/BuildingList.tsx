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

import { formatRate } from '@/lib/format'
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
  return <Chip label="Retired" size="small" color="default" variant="outlined" />
}

/** Rates use formatRate, never formatMoney: they are fractional. */
function Rates({ building }: { building: Building }) {
  return (
    <>
      <Typography variant="body2">⚡ {formatRate(building.electricityRate)} / kWh</Typography>
      <Typography variant="body2" color="text.secondary">
        💧 {formatRate(building.waterRatePerPerson)} / person
      </Typography>
    </>
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
              <TableCell>Building</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Rates</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {buildings.map((building) => (
              <TableRow key={building.id} hover>
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
                  <Rates building={building} />
                </TableCell>
                <TableCell>
                  {building.isActive ? (
                    <Chip label="Active" size="small" color="success" variant="outlined" />
                  ) : (
                    <RetiredChip />
                  )}
                </TableCell>
                <TableCell align="right">{actions(building)}</TableCell>
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
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {building.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {building.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {building.ward} · {building.city}
                  </Typography>
                  <Rates building={building} />
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
