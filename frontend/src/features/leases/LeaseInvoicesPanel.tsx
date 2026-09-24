import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { useInvoices } from "@/features/invoices/hooks";
import { AllInvoicesDialog } from "@/features/leases/AllInvoicesDialog";
import { LeaseInvoiceRow } from "@/features/leases/LeaseInvoiceRow";
import type { Lease } from "@/features/leases/types";
import { isApiError } from "@/lib/api-error";
import { errorMessage } from "@/lib/error-messages";
import { formatMoney } from "@/lib/format";

/**
 * How many invoices this panel asks for at once.
 *
 * Chosen well above any realistic tenancy — a twelve-month agreement produces a
 * move-in invoice, twelve monthly ones and a final, and a long-running renewal
 * chain still lands far short of this. It matters because the outstanding
 * balance below is summed over WHAT WAS FETCHED: a balance computed from half
 * the invoices is a wrong number wearing a confident label.
 *
 * The honest guard is not the number, though — it is the check beneath it. When
 * the list reports more than arrived, the panel says so and sends the reader to
 * the full history rather than presenting a partial total as the answer.
 *
 * The real fix is an API that reports the balance. It is named in this change's
 * proposal, under what the backend does not yet hold.
 */
const PAGE_SIZE = 100;

/**
 * What this tenancy has been billed.
 *
 * It reads the invoice list narrowed to one lease, which is the same question
 * an owner answers today by leaving for the invoice screen and filtering it
 * back down to the tenancy they were already looking at.
 *
 * It owns its own loading, empty and failure states on purpose. A billing
 * failure must not take the terms down with it — somebody who opened this
 * screen to read a clause can still read it while this panel is retrying.
 */
export function LeaseInvoicesPanel({ lease }: { lease: Lease }) {
  /*
    What is still owed, asked for as such rather than filtered out of
    everything. A tenancy is opened to see what is left to collect; a bill
    settled four months ago is history, and history belongs behind "Xem tất cả".

    `paymentStatus: "pending"` with voided bills left out is the same rule
    `isOwed` states for a bill already in hand — a withdrawn bill is not money
    owed, it was withdrawn.
  */
  const query = useInvoices({
    leaseId: lease.id,
    pageSize: PAGE_SIZE,
    paymentStatus: "pending",
  });
  /*
    And how many bills exist altogether. One row fetched and thrown away: only
    `meta.total` is wanted, so the panel can account for the bills it is NOT
    showing rather than letting them be silently absent.
  */
  const countQuery = useInvoices({
    leaseId: lease.id,
    pageSize: 1,
    includeVoided: true,
  });
  /*
    And how many were actually collected — which is NOT "all of them minus what
    is owed". A withdrawn bill is neither: it was taken back. Without this the
    card told a tenancy whose only invoice had been withdrawn that it had been
    paid in full, which is money that never arrived being reported as received.
  */
  const paidQuery = useInvoices({
    leaseId: lease.id,
    pageSize: 1,
    paymentStatus: "paid",
  });
  const [allOpen, setAllOpen] = useState(false);

  function body() {
    if (query.isPending) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (query.error) {
      return (
        <Alert
          severity={
            isApiError(query.error) && query.error.isTransport
              ? "warning"
              : "error"
          }
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void query.refetch()}
            >
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được hoá đơn của hợp đồng này</AlertTitle>
          {errorMessage(query.error)}
        </Alert>
      );
    }

    const owedInvoices = query.data.data;
    const owedTotal = query.data.meta.total;
    const allTotal = countQuery.data?.meta.total ?? 0;
    const paidTotal = paidQuery.data?.meta.total ?? 0;

    if (allTotal === 0) {
      // Said out loud. An empty area reads as a panel that failed to load, and
      // "not billed yet" is a real state of a tenancy that has just started.
      return (
        <Typography variant="body2" color="text.secondary">
          Chưa xuất hoá đơn nào cho hợp đồng này.
        </Typography>
      );
    }

    // Newest period first: a dispute is almost always about a recent one. Bills
    // carrying no period — a move-in, a final — are ordered by when they were
    // issued, which is the only date they have.
    const ordered = [...owedInvoices].sort((a, b) => {
      const ay = a.year ?? 0;
      const by = b.year ?? 0;
      if (ay !== by) return by - ay;
      const am = a.month ?? 0;
      const bm = b.month ?? 0;
      if (am !== bm) return bm - am;
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    });

    const owed = ordered.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const partial = owedTotal > owedInvoices.length;

    return (
      <Stack spacing={1.5}>
        {/*
          `gap`, not Stack's `spacing`. Spacing is a margin on the child, and a
          margin survives the wrap — on a narrow screen the balance dropped to
          its own line and stayed indented by it.
        */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {owedTotal > 0
              ? `${owedTotal} hoá đơn đang nợ trên tổng ${allTotal}`
              : paidTotal > 0
                ? `${allTotal} hoá đơn, đã thu đủ`
                : `${allTotal} hoá đơn, đều đã thu hồi`}
          </Typography>
          {/*
            Stated as a figure. A total the reader has to add up from the rows
            is a total the screen declined to give.
          */}
          <Typography variant="body2" color="text.secondary">
            Dư nợ:{" "}
            <Box
              component="span"
              sx={{
                color: owed > 0 ? "error.main" : "text.primary",
                fontWeight: 600,
              }}
            >
              {formatMoney(owed)}
            </Box>
          </Typography>
        </Box>

        <Divider />

        {/*
          Nothing owed is an answer, not an empty list. Without this the card
          reads exactly like a tenancy that was never billed — the opposite
          state, and the one it would be alarming to confuse this with.
        */}
        {ordered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {paidTotal > 0
              ? "Đã thu đủ mọi hoá đơn của hợp đồng này. Bấm “Xem tất cả” để xem lại các hoá đơn đã thu."
              : "Không còn hoá đơn nào đang nợ — hoá đơn của hợp đồng này đều đã bị thu hồi."}
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {ordered.map((invoice) => (
              <LeaseInvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </Stack>
        )}

        {/*
          Never present a partial list as the whole of it.

          This used to end there, with nowhere to send the reader: the invoice
          screen filters by building, room, period and payment status and never
          by tenancy, and a room outlives its tenancies — a link to it would
          have shown a previous tenant's bills under this agreement's heading.
          The dialog this now points at asks the API for one tenancy's bills,
          which is the question that was missing rather than a link to a
          different one.
        */}
        {partial && (
          <Alert severity="info">
            Đang hiện {owedInvoices.length} trong {owedTotal} hoá đơn đang nợ. Dư
            nợ ở trên chỉ tính trên phần đang hiện — bấm “Xem tất cả” để xem đủ.
          </Alert>
        )}
      </Stack>
    );
  }

  const total = countQuery.data?.meta.total ?? 0;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h6">Danh sách hoá đơn theo kỳ</Typography>
            {/*
              Offered whenever there is anything to open. Not only when the list
              is truncated: an owner looking for one bill among twenty wants a
              pageable list of them, and a button that appears at the hundredth
              invoice is a button nobody has ever seen.
            */}
            {total > 0 && (
              <Button size="small" onClick={() => setAllOpen(true)}>
                Xem tất cả ({total})
              </Button>
            )}
          </Box>
          {body()}
        </Stack>
      </CardContent>

      <AllInvoicesDialog
        open={allOpen}
        lease={lease}
        onClose={() => setAllOpen(false)}
      />
    </Card>
  );
}
