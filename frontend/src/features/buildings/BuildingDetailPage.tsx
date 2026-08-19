import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Link as RouterLink, useParams } from 'react-router'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useListParams } from '@/lib/useListParams'
import { useBuilding } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { RoomsSection } from '@/features/rooms/RoomsSection'

/**
 * A building on its own, with the rooms that belong to it.
 *
 * `web-buildings` deferred this page on the grounds that it would only repeat
 * what the list row already shows. That was true of the building's own fields —
 * what makes the page worth having is the rooms, so it arrives with them.
 */
export function BuildingDetailPage() {
  const params = useParams()
  const id = Number(params.id)
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
        <AlertTitle>Could not load this building</AlertTitle>
        {isApiError(error) ? error.message : 'An unexpected error occurred.'}
      </Alert>
    )
  }

  const building = buildingQuery.data

  return (
    <Box>
      <Button component={RouterLink} to="/buildings" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        All buildings
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h5" component="h2">
          {building.displayName}
        </Typography>
        {!building.isActive && <Chip label="Retired" size="small" variant="outlined" />}
      </Box>
      <Typography color="text.secondary">{building.address}</Typography>
      <Typography color="text.secondary" sx={{ mb: 1 }}>
        {building.ward} · {building.city} · {building.country}
      </Typography>
      <Typography variant="body2">
        ⚡ {formatMoney(building.electricityRate)} / kWh &nbsp;&nbsp; 💧{' '}
        {formatMoney(building.waterRatePerPerson)} / person
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
        Rooms
      </Typography>
      <RoomsSection
        rooms={roomsQuery.data?.data}
        meta={roomsQuery.data?.meta}
        isPending={roomsQuery.isPending}
        error={roomsQuery.error}
        onRetry={() => roomsQuery.refetch()}
        onPageChange={setPage}
        buildingId={building.id}
      />
    </Box>
  )
}

function NotFound() {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Building not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        There is no building at this address. It may have been removed, or the
        link may be wrong.
      </Typography>
      <Button variant="contained" component={RouterLink} to="/buildings">
        All buildings
      </Button>
    </Box>
  )
}
