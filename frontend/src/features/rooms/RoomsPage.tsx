import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useListParams } from '@/lib/useListParams'
import { SearchField } from '@/components/SearchField'
import { useBuildings } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { RoomsSection } from '@/features/rooms/RoomsSection'

interface RoomFilters extends Record<string, string | undefined> {
  buildingId?: string
  search?: string
  includeInactive?: string
}

const FILTER_KEYS = ['buildingId', 'search', 'includeInactive'] as const
/**
 * Typing must not leave a history entry per keystroke, or back removes one
 * character at a time instead of leaving the search. Dropdowns still push:
 * choosing a building is a step worth undoing.
 */
const REPLACE_KEYS = ['search'] as const

export function RoomsPage() {
  const { filters, page, setFilter, clearFilters, setPage, hasFilters } =
    useListParams<RoomFilters>(FILTER_KEYS, { replaceKeys: REPLACE_KEYS })

  const includeInactive = filters.includeInactive === 'true'
  const buildingId = filters.buildingId ? Number(filters.buildingId) : undefined

  const roomsQuery = useRooms({
    page,
    buildingId,
    search: filters.search,
    includeInactive,
  })
  const buildingsQuery = useBuildings({ pageSize: 200, includeInactive })
  const buildings = buildingsQuery.data?.data ?? []

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Rooms
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          select
          label="Building"
          size="small"
          value={filters.buildingId ?? ''}
          onChange={(event) =>
            setFilter('buildingId', event.target.value === '' ? undefined : event.target.value)
          }
          sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
        >
          <MenuItem value="">All buildings</MenuItem>
          {buildings.map((building) => (
            <MenuItem key={building.id} value={String(building.id)}>
              {building.displayName}
            </MenuItem>
          ))}
        </TextField>

        <SearchField
          label="Search room code"
          size="small"
          value={filters.search ?? ''}
          onDebouncedChange={(value) => setFilter('search', value || undefined)}
          helperText="Matches any code containing what you type"
          sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={includeInactive}
              onChange={(event) =>
                setFilter('includeInactive', event.target.checked ? 'true' : undefined)
              }
            />
          }
          label="Include retired"
        />

        {hasFilters && (
          <Button onClick={clearFilters} size="small">
            Clear filters
          </Button>
        )}
      </Box>

      <RoomsSection
        rooms={roomsQuery.data?.data}
        meta={roomsQuery.data?.meta}
        isPending={roomsQuery.isPending}
        error={roomsQuery.error}
        onRetry={() => roomsQuery.refetch()}
        onPageChange={setPage}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />
    </Box>
  )
}
