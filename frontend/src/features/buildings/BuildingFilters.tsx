import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'

import type { BuildingLocation } from '@/features/buildings/types'

interface BuildingFiltersProps {
  locations: BuildingLocation[]
  city: string | undefined
  ward: string | undefined
  includeInactive: boolean
  onCityChange: (city: string | undefined, wardStillValid: boolean) => void
  onWardChange: (ward: string | undefined) => void
  onIncludeInactiveChange: (includeInactive: boolean) => void
  onClear: () => void
  hasFilters: boolean
}

/**
 * Choices, not free text.
 *
 * The database folds case for ASCII only, so a typed "đức" never finds
 * "Thủ Đức". A value taken from `GET /buildings/locations` is byte-identical to
 * what is stored, so it matches without any folding — which is why this endpoint
 * exists.
 */
export function BuildingFilters({
  locations,
  city,
  ward,
  includeInactive,
  onCityChange,
  onWardChange,
  onIncludeInactiveChange,
  onClear,
  hasFilters,
}: BuildingFiltersProps) {
  // Wards narrow to the selected city, from the same response — the grouped
  // shape means no second request when the city changes.
  const wardsForCity = city
    ? (locations.find((location) => location.city === city)?.wards ?? [])
    : [...new Set(locations.flatMap((location) => location.wards))].sort()

  function handleCityChange(nextCity: string) {
    const value = nextCity === '' ? undefined : nextCity
    const wardsInNextCity = value
      ? (locations.find((location) => location.city === value)?.wards ?? [])
      : []
    // A ward that does not exist in the newly chosen city would produce a pair
    // matching nothing, which reads as a broken screen rather than an empty
    // result.
    const wardStillValid = !ward || !value || wardsInNextCity.includes(ward)
    onCityChange(value, wardStillValid)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        mb: 2,
      }}
    >
      <TextField
        select
        label="City"
        size="small"
        value={city ?? ''}
        onChange={(event) => handleCityChange(event.target.value)}
        sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
      >
        <MenuItem value="">All cities</MenuItem>
        {locations.map((location) => (
          <MenuItem key={location.city} value={location.city}>
            {location.city}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        label="Ward"
        size="small"
        value={ward ?? ''}
        onChange={(event) => onWardChange(event.target.value === '' ? undefined : event.target.value)}
        sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
      >
        <MenuItem value="">All wards</MenuItem>
        {wardsForCity.map((wardName) => (
          <MenuItem key={wardName} value={wardName}>
            {wardName}
          </MenuItem>
        ))}
      </TextField>

      <FormControlLabel
        control={
          <Switch
            checked={includeInactive}
            onChange={(event) => onIncludeInactiveChange(event.target.checked)}
          />
        }
        label="Include retired"
      />

      {hasFilters && (
        <Button onClick={onClear} size="small">
          Clear filters
        </Button>
      )}
    </Box>
  )
}
