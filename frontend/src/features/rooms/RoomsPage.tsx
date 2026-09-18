import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";

import { PageHeader } from "@/components/PageHeader";
import { CreateRoomButton } from "@/features/rooms/CreateRoomButton";
import { ListSurface } from "@/components/ListSurface";
import { SearchField } from "@/components/SearchField";
import { useBuildings } from "@/features/buildings/hooks";
import { useRooms } from "@/features/rooms/hooks";
import { RoomsSection } from "@/features/rooms/RoomsSection";
import { ACTIVE_STATUS_OPTIONS, statusFromParam } from "@/lib/active-status";
import { useListParams } from "@/lib/useListParams";

interface RoomFilters extends Record<string, string | undefined> {
  buildingId?: string;
  search?: string;
  status?: string;
}

const FILTER_KEYS = ["buildingId", "search", "status"] as const;
/**
 * Typing must not leave a history entry per keystroke, or back removes one
 * character at a time instead of leaving the search. Dropdowns still push:
 * choosing a building is a step worth undoing.
 */
const REPLACE_KEYS = ["search"] as const;

export function RoomsPage() {
  const { filters, page, setFilter, clearFilters, setPage, hasFilters } =
    useListParams<RoomFilters>(FILTER_KEYS, { replaceKeys: REPLACE_KEYS });

  // Absent from the address means everything — same rule as the buildings screen.
  const status = statusFromParam(filters.status);
  const buildingId = filters.buildingId
    ? Number(filters.buildingId)
    : undefined;

  const roomsQuery = useRooms({
    page,
    buildingId,
    search: filters.search,
    status,
  });
  // The building picker follows the same status, so a building offered as a
  // choice is one whose rooms this list would show.
  const buildingsQuery = useBuildings({ pageSize: 200, status });
  const buildings = buildingsQuery.data?.data ?? [];

  return (
    <Box>
      <PageHeader
        title="Phòng"
        action={
          <CreateRoomButton
            onCreated={() => {
              // Rooms are ordered by creation, so a new one lands last — often
              // on a page the owner is not looking at.
              const meta = roomsQuery.data?.meta;
              setPage(Math.ceil(((meta?.total ?? 0) + 1) / (meta?.pageSize ?? 20)));
            }}
          />
        }
      />

      <ListSurface>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "start",
            mb: 2,
          }}
        >
          <TextField
            select
            label="Toà nhà"
            size="small"
            value={filters.buildingId ?? ""}
            onChange={(event) =>
              setFilter(
                "buildingId",
                event.target.value === "" ? undefined : event.target.value,
              )
            }
            sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
          >
            <MenuItem value="">Tất cả toà nhà</MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={String(building.id)}>
                {building.displayName}
              </MenuItem>
            ))}
          </TextField>

          <SearchField
            label="Tìm mã phòng"
            size="small"
            value={filters.search ?? ""}
            onDebouncedChange={(value) =>
              setFilter("search", value || undefined)
            }
            helperText="Khớp mọi mã phòng có chứa nội dung bạn gõ"
            sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
          />

          <TextField
            select
            label="Trạng thái"
            size="small"
            value={status}
            onChange={(event) =>
              setFilter(
                "status",
                event.target.value === "all" ? undefined : event.target.value,
              )
            }
            sx={{ minWidth: 200 }}
          >
            {ACTIVE_STATUS_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {hasFilters && (
            <Button onClick={clearFilters} size="small">
              Xoá bộ lọc
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
      </ListSurface>
    </Box>
  );
}
