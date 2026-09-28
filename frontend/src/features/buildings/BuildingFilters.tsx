import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

import { PickerField } from '@/components/PickerField'

import { ACTIVE_STATUS_OPTIONS, type ActiveStatus } from '@/lib/active-status'
import type { BuildingLocation } from '@/features/buildings/types'

interface BuildingFiltersProps {
  locations: BuildingLocation[]
  city: string | undefined
  ward: string | undefined
  status: ActiveStatus
  onCityChange: (city: string | undefined, wardStillValid: boolean) => void
  onWardChange: (ward: string | undefined) => void
  onStatusChange: (status: ActiveStatus) => void
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
  status,
  onCityChange,
  onWardChange,
  onStatusChange,
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
      {/*
        Gõ được, vì hai danh sách này do chủ nhà nhập và dài ra theo số toà —
        cuộn tìm một phường trong danh sách phẳng là việc không ai muốn làm.
      */}
      <Box sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}>
        <PickerField
          label="Tỉnh/Thành"
          size="small"
          value={city ?? ''}
          onChange={handleCityChange}
          options={locations.map((location) => ({ value: location.city, label: location.city }))}
          allLabel="Tất cả tỉnh/thành"
        />
      </Box>

      <Box sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}>
        <PickerField
          label="Phường/Xã"
          size="small"
          value={ward ?? ''}
          onChange={(value) => onWardChange(value || undefined)}
          options={wardsForCity.map((wardName) => ({ value: wardName, label: wardName }))}
          allLabel="Tất cả phường/xã"
        />
      </Box>

      <TextField
        select
        label="Trạng thái"
        size="small"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as ActiveStatus)}
        sx={{ minWidth: 200 }}
      >
        {ACTIVE_STATUS_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>

      {hasFilters && (
        <Button onClick={onClear} size="small">
          Xoá bộ lọc
        </Button>
      )}
    </Box>
  )
}
