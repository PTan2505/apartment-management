import EditIcon from "@mui/icons-material/Edit";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { AddOccupantDialog } from "@/features/leases/AddOccupantDialog";
import { formatDate } from "@/features/leases/dates";
import { DepartOccupantDialog } from "@/features/leases/DepartOccupantDialog";
import { EditOccupantCountDialog } from "@/features/leases/EditOccupantCountDialog";
import { useOccupants } from "@/features/leases/hooks";
import { TransferPrimaryDialog } from "@/features/leases/TransferPrimaryDialog";
import type { Lease, Occupant } from "@/features/leases/types";
import { errorMessage } from "@/lib/error-messages";

interface OccupantsCardProps {
  lease: Lease;
}

/**
 * Two facts that look like one, and must not be laid out as one.
 *
 * `occupantCount` is how many people the room is BILLED for — it drives the
 * utility charges and is maintained by hand. The occupant records are the
 * people whose details the owner happens to hold. The API refuses to reconcile
 * them, deliberately: an owner may know five people live in a room while
 * holding a name and a phone number for two of them, and both figures are
 * correct.
 *
 * The failure this layout exists to avoid is a list of two names under a
 * heading reading "5 occupants". That reads as three records lost, and invites
 * an owner to "fix" a number that was already right. So the two are presented
 * as what they are — a billing input, and a register of people — with their own
 * headings and no arithmetic relating them.
 */
export function OccupantsCard({ lease }: OccupantsCardProps) {
  const occupantsQuery = useOccupants(lease.id);
  const [addOpen, setAddOpen] = useState(false);
  const [departing, setDeparting] = useState<Occupant | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [countOpen, setCountOpen] = useState(false);

  const occupants = occupantsQuery.data?.data ?? [];
  const current = occupants.filter((occupant) => occupant.status === "current");
  const departed = occupants.filter(
    (occupant) => occupant.status === "departed",
  );
  const isRunning = lease.status === "active";

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            {/* The billing input, on its own, named for what it does. */}
            <Box>
              <Typography variant="overline" color="text.secondary">
                Số người ở theo hợp đồng
              </Typography>
              {/*
                The edit sits on the figure's own line, where the owner notices
                the number is wrong. An icon rather than a text button: the text
                buttons below act on PEOPLE, and this acts on the count, which is
                a different thing on purpose.

                Only while the tenancy runs — the API refuses the update on one
                that ended or was cancelled, and a control that cannot work is
                worse than none.
              */}
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center" }}
              >
                <Typography variant="h6">
                  {lease.occupantCount} người
                </Typography>
                {isRunning && (
                  <Tooltip title="Sửa số người tính tiền">
                    <IconButton
                      size="small"
                      aria-label="Sửa số người tính tiền"
                      onClick={() => setCountOpen(true)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              {/* A portal, so where it sits in the tree does not affect layout. */}
              <EditOccupantCountDialog
                open={countOpen}
                lease={lease}
                onClose={() => setCountOpen(false)}
              />
              <Typography variant="caption" color="text.secondary">
                Dùng để tính tiền nước. Được ghi trong hợp đồng, tách khỏi danh
                sách bên dưới, và hai con số này có thể khác nhau.
              </Typography>
            </Box>

            <Divider />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Danh sách người ở
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {current.length} người đang ở
                  {departed.length > 0
                    ? `, ${departed.length} người đã rời đi`
                    : ""}
                </Typography>
                {/*
                  Said once, here, rather than as a disabled button beside the
                  one person — the explanation belongs to the tenancy, not to
                  them.
                */}
                {isRunning && current.length === 1 && (
                  <Typography variant="caption" color="text.secondary">
                    Chỉ còn một người ở. Muốn kết thúc thì dùng “Kết thúc hợp đồng” ở cuối trang.
                  </Typography>
                )}
              </Box>
              {isRunning && (
                <Stack direction="row" spacing={1}>
                  {current.length > 1 && (
                    <Button size="small" onClick={() => setTransferOpen(true)}>
                      Chuyển người đứng tên
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddOpen(true)}
                  >
                    Thêm người
                  </Button>
                </Stack>
              )}
            </Box>

            {occupantsQuery.isPending && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {occupantsQuery.error && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => void occupantsQuery.refetch()}
                  >
                    Thử lại
                  </Button>
                }
              >
                {errorMessage(occupantsQuery.error)}
              </Alert>
            )}

            {!occupantsQuery.isPending && occupants.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa ghi nhận ai.
              </Typography>
            )}

            <Stack divider={<Divider flexItem />} spacing={1}>
              {occupants.map((occupant) => (
                <Box
                  key={occupant.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                    // Somebody who left stays listed rather than disappearing:
                    // where a person lived and when is what this record is for.
                    opacity: occupant.status === "departed" ? 0.65 : 1,
                  }}
                >
                  <Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {occupant.fullName ?? `Khách #${occupant.customerId}`}
                      </Typography>
                      {occupant.isPrimary && occupant.status === "current" && (
                        <Chip
                          size="small"
                          color="primary"
                          label="Người đứng tên"
                        />
                      )}
                      {occupant.status === "departed" && (
                        <Chip size="small" variant="outlined" label="Đã rời" />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {occupant.phone ? `${occupant.phone} · ` : ""}
                      Vào ở {formatDate(occupant.joinedAt)}
                      {occupant.leftAt
                        ? ` · Rời đi ngày ${formatDate(occupant.leftAt)}`
                        : ""}
                    </Typography>
                  </Box>
                  {/*
                    Withheld from the ONLY current occupant. Departing them
                    would leave a tenancy that is billed, holds a deposit and
                    occupies a room, with nobody recorded as living in it — the
                    API refuses it, and an action that is always refused is
                    worse than no action. What that owner wants is the
                    tenancy's move-out, which is offered above.
                  */}
                  {isRunning && occupant.status === "current" && current.length > 1 && (
                    <Button
                      size="small"
                      color="inherit"
                      onClick={() => setDeparting(occupant)}
                    >
                      Ghi nhận rời đi
                    </Button>
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <AddOccupantDialog
        open={addOpen}
        leaseId={lease.id}
        onClose={() => setAddOpen(false)}
      />
      <DepartOccupantDialog
        occupant={departing}
        leaseId={lease.id}
        currentOccupants={current}
        onClose={() => setDeparting(null)}
      />
      <TransferPrimaryDialog
        open={transferOpen}
        leaseId={lease.id}
        currentOccupants={current}
        onClose={() => setTransferOpen(false)}
      />
    </>
  );
}
