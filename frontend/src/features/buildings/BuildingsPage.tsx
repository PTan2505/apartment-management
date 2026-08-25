import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

import { isApiError } from '@/lib/api-error'
import { useListParams } from '@/lib/useListParams'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { BuildingFilters } from '@/features/buildings/BuildingFilters'
import { BuildingFormDialog } from '@/features/buildings/BuildingFormDialog'
import { BuildingList } from '@/features/buildings/BuildingList'
import { RetireBuildingDialog } from '@/features/buildings/RetireBuildingDialog'
import {
  useBuildingLocations,
  useBuildings,
  useRestoreBuilding,
} from '@/features/buildings/hooks'
import type { Building } from '@/features/buildings/types'

interface BuildingFilterParams extends Record<string, string | undefined> {
  city?: string
  ward?: string
  includeInactive?: string
}

const FILTER_KEYS = ['city', 'ward', 'includeInactive'] as const

export function BuildingsPage() {
  const { filters, page, setFilter, setFilters, clearFilters, setPage, hasFilters } =
    useListParams<BuildingFilterParams>(FILTER_KEYS)

  const includeInactive = filters.includeInactive === 'true'

  const buildingsQuery = useBuildings({
    page,
    city: filters.city,
    ward: filters.ward,
    includeInactive,
  })
  // Same includeInactive as the listing: offering a location whose only
  // buildings are filtered out would guarantee an empty result.
  const locationsQuery = useBuildingLocations(includeInactive)
  const restoreMutation = useRestoreBuilding()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Building | null>(null)
  const [retiring, setRetiring] = useState<Building | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(building: Building) {
    setEditing(building)
    setFormOpen(true)
  }

  const header = (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
      }}
    >
      <Typography variant="h5" component="h2">
        Toà nhà
      </Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
        Thêm toà nhà
      </Button>
    </Box>
  )

  function body() {
    // Loading must be distinguishable from empty: rendering "no buildings"
    // while the request is in flight tells the owner something untrue.
    if (buildingsQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (buildingsQuery.isError) {
      const error = buildingsQuery.error
      return (
        <Alert
          severity={isApiError(error) && error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={() => buildingsQuery.refetch()}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách toà nhà</AlertTitle>
          {isApiError(error) ? error.message : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    const { data, meta } = buildingsQuery.data

    if (data.length === 0) {
      // Two different emptinesses, two different remedies. Telling someone with
      // a filter applied that they have no buildings is simply false.
      return hasFilters ? (
        <EmptyState
          title="Không có toà nhà nào khớp bộ lọc"
          description="Thử tỉnh/thành hoặc phường/xã khác, hoặc xoá bộ lọc để xem tất cả."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Chưa có toà nhà nào"
          description="Thêm toà nhà đầu tiên bạn quản lý để bắt đầu."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Thêm toà nhà
            </Button>
          }
        />
      )
    }

    return (
      <>
        <BuildingList
          buildings={data}
          onEdit={openEdit}
          onRetire={setRetiring}
          onRestore={(building) => restoreMutation.mutate(building.id)}
        />
        <Pagination meta={meta} onPageChange={setPage} />
      </>
    )
  }

  return (
    <Box>
      {header}

      <BuildingFilters
        locations={locationsQuery.data ?? []}
        city={filters.city}
        ward={filters.ward}
        includeInactive={includeInactive}
        onCityChange={(city, wardStillValid) =>
          // One update, not two: changing the city and dropping a now-impossible
          // ward have to land together, or the second overwrites the first.
          setFilters({ city, ...(wardStillValid ? {} : { ward: undefined }) })
        }
        onWardChange={(ward) => setFilter('ward', ward)}
        onIncludeInactiveChange={(next) =>
          setFilter('includeInactive', next ? 'true' : undefined)
        }
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      {body()}

      <BuildingFormDialog
        open={formOpen}
        building={editing}
        onClose={() => setFormOpen(false)}
        onCreated={() => {
          // The API orders by creation time ascending, so a new building is
          // always last — and lands on a page the owner is probably not on.
          // Without this they create a building and appear to get nothing.
          const total = buildingsQuery.data?.meta.total ?? 0
          const pageSize = buildingsQuery.data?.meta.pageSize ?? 20
          setPage(Math.ceil((total + 1) / pageSize))
        }}
      />
      <RetireBuildingDialog building={retiring} onClose={() => setRetiring(null)} />
    </Box>
  )
}
