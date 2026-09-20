import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import * as leasesApi from "@/features/leases/api";
import { CONTRACT_ACCEPT, type ContractPage } from "@/features/leases/api";
import { formatDate } from "@/features/leases/dates";
import { useContractPages } from "@/features/leases/hooks";
import type { Lease } from "@/features/leases/types";
import { isApiError } from "@/lib/api-error";
import { errorMessage } from "@/lib/error-messages";

/** 20 MB per page, stated before a photograph is chosen rather than after. */
const MAX_MB = 20;

/**
 * The signed contract, as the pages it is.
 *
 * ── Why the pages are shown rather than reported ────────────────────────────
 *
 * This card used to say "Đã có bản scan trên hệ thống" beside a button. That
 * asks the owner to take the contract on trust and click to find out what it
 * says — and what settles an argument with a tenant is the page itself, not the
 * assurance that one exists. So the pages are the card, exactly as the ID card
 * shows the card.
 *
 * ── Why several ────────────────────────────────────────────────────────────
 *
 * A contract is several pages of paper. One file per tenancy meant an owner
 * photographing a four-page agreement had to assemble a document elsewhere
 * first, or keep one page and lose the rest.
 *
 * Uploads run ONE AT A TIME. A phone on a weak connection sending four 8 MB
 * photographs at once fails all four; in sequence, progress is reportable and a
 * failure costs one page rather than the set.
 *
 * Every link is signed and expires in minutes, which is why they come from a
 * query that refreshes rather than being held in state.
 */
export function ContractCard({ lease }: { lease: Lease }) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const pagesQuery = useContractPages(lease.id, lease.contractStorageAvailable);
  const [busy, setBusy] = useState<"uploading" | "removing" | null>(null);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** The page the owner asked to remove, held until they say they meant it. */
  const [removing, setRemoving] = useState<ContractPage | null>(null);

  const pages = pagesQuery.data ?? [];

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["leases"] });
  }

  async function upload(files: File[]) {
    setError(null);
    setBusy("uploading");
    setProgress({ done: 0, total: files.length });
    try {
      const failed = await leasesApi.attachContractPages(
        lease.id,
        files,
        (done, total) => setProgress({ done, total }),
      );
      await pagesQuery.refetch();
      refresh();
      // The pages that worked are attached; this names what did not, rather
      // than reporting the whole batch as a failure or as a success.
      if (failed > 0) {
        setError(
          failed === files.length
            ? `Không tải lên được ${failed} ảnh. Mỗi ảnh tối đa ${MAX_MB} MB.`
            : `${files.length - failed} ảnh đã lên, ${failed} ảnh không lên được. Thử lại ảnh còn thiếu.`,
        );
      }
    } catch (cause) {
      setError(
        isApiError(cause)
          ? errorMessage(cause)
          : cause instanceof Error
            ? cause.message
            : "Không tải lên được ảnh.",
      );
    } finally {
      setBusy(null);
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(page: ContractPage) {
    setError(null);
    setBusy("removing");
    try {
      await leasesApi.removeContractPage(lease.id, page.id);
      await pagesQuery.refetch();
      refresh();
      setRemoving(null);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">Bản hợp đồng đã ký</Typography>
            {lease.contractStorageAvailable && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                disabled={busy !== null}
                onClick={() => input.current?.click()}
              >
                {busy === "uploading"
                  ? `Đang tải lên ${progress?.done ?? 0}/${progress?.total ?? 0}…`
                  : pages.length > 0
                    ? "Thêm ảnh"
                    : "Tải ảnh lên"}
              </Button>
            )}
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/*
            Said out loud rather than shown as a failed action. Storage being
            unconfigured is a state of this deployment, not a fault of the
            owner's, and an action that cannot work is worse than no action.
          */}
          {!lease.contractStorageAvailable ? (
            <Alert severity="info">
              <AlertTitle>Máy chủ chưa cấu hình nơi lưu trữ</AlertTitle>
              Chưa thể lưu ảnh hợp đồng ở đây. Mọi chức năng khác vẫn hoạt động
              bình thường.
            </Alert>
          ) : pagesQuery.isPending ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={22} />
            </Box>
          ) : pages.length > 0 ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                  gap: 1.5,
                }}
              >
                {pages.map((page, index) => (
                  <MotTrang
                    key={page.id}
                    page={page}
                    index={index}
                    disabled={busy !== null}
                    onRemove={() => setRemoving(page)}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {pages.length} trang · bấm vào ảnh để xem cỡ đầy đủ. Đường dẫn
                xem chỉ có hiệu lực vài phút, nên không thể chia sẻ lâu dài.
              </Typography>
            </>
          ) : (
            /*
              The empty case, as a place photographs go rather than a sentence
              about them. The limits are stated BEFORE a file is chosen:
              learning them by having one rejected after it uploaded is learning
              them at the most expensive moment.
            */
            <Box
              sx={{
                border: 1,
                borderStyle: "dashed",
                borderColor: "divider",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
              }}
            >
              <PhotoCameraIcon color="disabled" />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Chưa có ảnh hợp đồng nào
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chụp từng trang hợp đồng đã ký. Chọn được nhiều ảnh một lần.
                JPG, PNG hoặc HEIC, mỗi ảnh tối đa {MAX_MB} MB.
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={removing !== null}
        title="Xoá trang hợp đồng này?"
        description="Ảnh sẽ bị xoá khỏi kho lưu trữ và không lấy lại được."
        confirmLabel="Xoá trang"
        busyLabel="Đang xoá…"
        destructive
        busy={busy === "removing"}
        error={error}
        onConfirm={() => {
          if (removing) void remove(removing);
        }}
        onClose={() => setRemoving(null)}
      />

      <input
        ref={input}
        type="file"
        accept={CONTRACT_ACCEPT}
        multiple
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          if (files.length > 0) void upload(files);
        }}
      />
    </Card>
  );
}

/** One page: the photograph itself, numbered, with the way to remove it. */
function MotTrang({
  page,
  index,
  disabled,
  onRemove,
}: {
  page: ContractPage;
  index: number;
  disabled: boolean;
  onRemove: () => void;
}) {
  return (
    <Box sx={{ position: "relative" }}>
      <Box
        component="a"
        href={page.url}
        target="_blank"
        rel="noopener"
        title="Mở ảnh kích thước đầy đủ"
        sx={{ display: "block" }}
      >
        <Box
          component="img"
          src={page.url}
          alt={`Trang ${index + 1} của hợp đồng`}
          sx={{
            display: "block",
            width: "100%",
            aspectRatio: "3 / 4",
            objectFit: "cover",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        />
      </Box>
      <IconButton
        size="small"
        aria-label={`Xoá trang ${index + 1}`}
        disabled={disabled}
        onClick={onRemove}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          bgcolor: "background.paper",
          "&:hover": { bgcolor: "background.paper" },
        }}
      >
        <DeleteIcon fontSize="small" color="error" />
      </IconButton>
      <Typography variant="caption" color="text.secondary">
        Trang {index + 1} · {formatDate(page.uploadedAt)}
      </Typography>
    </Box>
  );
}
