import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useNavigate } from "react-router";

import { EmptyState } from "@/components/EmptyState";
import { ListSurface } from "@/components/ListSurface";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { useBuildings } from "@/features/buildings/hooks";
import { ContractTemplateBar } from "@/features/contract-template/ContractTemplateBar";
import { useCustomers } from "@/features/customers/hooks";
import { useLeaseCount, useLeases } from "@/features/leases/hooks";
import { LeaseFormDialog } from "@/features/leases/LeaseFormDialog";
import { LeaseList } from "@/features/leases/LeaseList";
import { LEASE_STATUSES, leaseStatusLabel } from "@/features/leases/status";
import type { LeaseStatus } from "@/features/leases/types";
import { useRooms } from "@/features/rooms/hooks";
import { isApiError } from "@/lib/api-error";
import { errorMessage } from "@/lib/error-messages";
import { useListParams } from "@/lib/useListParams";

interface LeaseFilters extends Record<string, string | undefined> {
  buildingId?: string;
  roomId?: string;
  customerId?: string;
  status?: string;
  from?: string;
  to?: string;
}

const FILTER_KEYS = [
  "buildingId",
  "roomId",
  "customerId",
  "status",
  "from",
  "to",
] as const;

/**
 * A number the owner came to the page for, and the list that answers it.
 *
 * The count IS the filtered listing — same request, one row asked for — so the
 * figure and the list it opens can never disagree. Clicking applies that
 * filter; clicking the applied one clears it, so the card is also the way back.
 *
 * Zero is shown, never hidden: "no overdue tenancies" is the answer an owner
 * checking for them wants, and an empty space is not an answer.
 */
function LeaseCount({
  label,
  hint,
  count,
  pending,
  color,
  selected,
  onClick,
}: {
  label: string;
  hint: string;
  count: number;
  pending: boolean;
  color: "error" | "success";
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        flex: 1,
        minWidth: 0,
        borderColor: selected ? `${color}.main` : undefined,
      }}
    >
      <CardActionArea onClick={onClick} sx={{ px: 2, py: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selected ? "Đang lọc — bấm để bỏ lọc" : hint}
            </Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, lineHeight: 1.2, fontSize: "2rem" }}
            color={count > 0 ? `${color}.main` : "text.disabled"}
          >
            {pending ? "…" : count}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function LeasesPage() {
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);

  const {
    filters,
    page,
    setFilter,
    setFilters,
    clearFilters,
    setPage,
    hasFilters,
  } = useListParams<LeaseFilters>(FILTER_KEYS);

  const buildingId = filters.buildingId
    ? Number(filters.buildingId)
    : undefined;

  const leasesQuery = useLeases({
    page,
    buildingId,
    roomId: filters.roomId ? Number(filters.roomId) : undefined,
    customerId: filters.customerId ? Number(filters.customerId) : undefined,
    // Absent means every state, so only a chosen one becomes a filter.
    status: (filters.status as LeaseStatus | undefined) || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  });

  // Every room, including let ones: the filter is for finding a room's history,
  // which is mostly the tenancies that have ended.
  //
  // Narrowed to the chosen building, which is the point of having one. A flat
  // list of every room across every building is unusable past a handful, and a
  // room code alone is ambiguous anyway — the same code exists in several
  // buildings.
  const roomsQuery = useRooms({ pageSize: 200, buildingId });
  const buildingsQuery = useBuildings({ pageSize: 200 });
  const customersQuery = useCustomers({ pageSize: 200 });

  const overdueCount = useLeaseCount("overdue");
  const activeCount = useLeaseCount("active");

  const leases = leasesQuery.data?.data;
  const meta = leasesQuery.data?.meta;

  function body() {
    if (leasesQuery.isPending) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (leasesQuery.error) {
      return (
        <Alert
          severity={
            isApiError(leasesQuery.error) && leasesQuery.error.isTransport
              ? "warning"
              : "error"
          }
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void leasesQuery.refetch()}
            >
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách hợp đồng</AlertTitle>
          {errorMessage(leasesQuery.error)}
        </Alert>
      );
    }

    if (!leases || leases.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có hợp đồng nào khớp bộ lọc"
          description="Thử phòng hoặc người khác, hoặc xoá bộ lọc."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Chưa có hợp đồng nào"
          description="Ký hợp đồng đầu tiên để bắt đầu."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
            >
              Hợp đồng mới
            </Button>
          }
        />
      );
    }

    return (
      <>
        <LeaseList
          leases={leases}
          onOpen={(lease) => void navigate(`/leases/${lease.id}`)}
        />
        {meta && <Pagination meta={meta} onPageChange={setPage} />}
      </>
    );
  }

  return (
    <Box>
      <PageHeader
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Hợp đồng mới
          </Button>
        }
      />

      {/*
        The two questions an owner opens this page with: what needs handling,
        and how much is running. At the top because a number nobody scrolls to
        is not a number — the tenancies they count sit anywhere in the list.
      */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <LeaseCount
          label="Hợp đồng quá hạn"
          hint="Hết hạn mà chưa ghi nhận trả phòng"
          count={overdueCount.data ?? 0}
          pending={overdueCount.isPending}
          color="error"
          selected={filters.status === "overdue"}
          onClick={() =>
            setFilter(
              "status",
              filters.status === "overdue" ? undefined : "overdue",
            )
          }
        />
        <LeaseCount
          label="Hợp đồng đang thuê"
          hint="Còn hơn hai tuần nữa mới hết hạn"
          count={activeCount.data ?? 0}
          pending={activeCount.isPending}
          color="success"
          selected={filters.status === "active"}
          onClick={() =>
            setFilter(
              "status",
              filters.status === "active" ? undefined : "active",
            )
          }
        />
      </Box>

      {/* The blank contract to print, above the list it is signed from. */}
      <ContractTemplateBar />

      <ListSurface>
        <Box>
          <Box
            sx={{
              display: "flex",
              // Wrapped, or a phone simply loses the filters past the second
              // one: the row is clipped rather than scrolled, so "Trạng thái"
              // was on the screen and unreachable at the same time.
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
                // Both in one update: a room belongs to one building, so changing
                // the building leaves any chosen room pointing somewhere it is not.
                // Two `setFilter` calls would not compose — the second computes
                // from the params the first captured and discards its change.
                setFilters({
                  buildingId:
                    event.target.value === "" ? undefined : event.target.value,
                  roomId: undefined,
                })
              }
              sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
            >
              <MenuItem value="">Tất cả toà nhà</MenuItem>
              {(buildingsQuery.data?.data ?? []).map((building) => (
                <MenuItem key={building.id} value={String(building.id)}>
                  {building.displayName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Phòng"
              size="small"
              value={filters.roomId ?? ""}
              onChange={(event) =>
                setFilter(
                  "roomId",
                  event.target.value === "" ? undefined : event.target.value,
                )
              }
              sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
            >
              <MenuItem value="">Tất cả phòng</MenuItem>
              {(roomsQuery.data?.data ?? []).map((room) => (
                <MenuItem key={room.id} value={String(room.id)}>
                  {/* The building is established by the filter above once chosen,
                    so repeating it on every row is noise. */}
                  {buildingId
                    ? room.roomCode
                    : `${room.roomCode} · ${room.building.displayName}`}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Người"
              size="small"
              value={filters.customerId ?? ""}
              onChange={(event) =>
                setFilter(
                  "customerId",
                  event.target.value === "" ? undefined : event.target.value,
                )
              }
              // Finds every tenancy this person occupied, not only the ones they
              // signed — which is what makes it a question about their history.
              helperText="Bất kỳ ai từng ở, không riêng người đứng tên"
              sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}
            >
              <MenuItem value="">Bất kỳ ai</MenuItem>
              {(customersQuery.data?.data ?? []).map((customer) => (
                <MenuItem key={customer.id} value={String(customer.id)}>
                  {customer.fullName}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Trạng thái"
              size="small"
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilter(
                  "status",
                  event.target.value === "" ? undefined : event.target.value,
                )
              }
              sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 } }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              {/* In the order the list itself uses, so the filter reads as a
                  slice of the page rather than a separate vocabulary. */}
              {LEASE_STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {leaseStatusLabel(status)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "start",
              mb: 2,
            }}
          >
            {/*
            Two bounds, each constraining its own end of a tenancy. Said on the
            fields themselves: "Từ ngày" alone could as easily mean "still
            running from", and the two readings differ by every long tenancy in
            the list.
          */}
            <TextField
              label="Bắt đầu từ ngày"
              type="date"
              size="small"
              value={filters.from ?? ""}
              onChange={(event) =>
                setFilter(
                  "from",
                  event.target.value === "" ? undefined : event.target.value,
                )
              }
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Hợp đồng bắt đầu từ ngày này trở đi"
              sx={{ flexGrow: 1, minWidth: { xs: "100%", sm: 300 } }}
            />

            <TextField
              label="Kết thúc trước ngày"
              type="date"
              size="small"
              value={filters.to ?? ""}
              onChange={(event) =>
                setFilter(
                  "to",
                  event.target.value === "" ? undefined : event.target.value,
                )
              }
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Hợp đồng kết thúc trước ngày này"
              sx={{ flexGrow: 1, minWidth: { xs: "100%", sm: 300 } }}
            />

            {hasFilters && (
              <Button onClick={clearFilters} size="small">
                Xoá bộ lọc
              </Button>
            )}
          </Box>
        </Box>

        {body()}
      </ListSurface>

      <LeaseFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        // Straight to the tenancy: what follows signing one is always something
        // on it — adding the other occupants, checking the deposit.
        onCreated={(lease) => void navigate(`/leases/${lease.id}`)}
      />
    </Box>
  );
}
