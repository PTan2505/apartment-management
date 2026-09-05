import { Link as RouterLink } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { alpha } from '@mui/material/styles'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { useInvoices } from '@/features/invoices/hooks'
import { invoiceTypeLabel, monthLabel } from '@/features/invoices/labels'
import type { Invoice } from '@/features/invoices/types'
import type { Lease } from '@/features/leases/types'

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
const PAGE_SIZE = 100

/** What settles an invoice, as an owner would name it. */
function PaymentChip({ invoice }: { invoice: Invoice }) {
  if (invoice.voidedAt !== null) {
    return <Chip size="small" variant="outlined" label="Đã huỷ" />
  }
  if (invoice.paymentStatus === 'paid') {
    return <Chip size="small" color="success" variant="outlined" label="Đã thu đủ" />
  }
  return <Chip size="small" color="warning" variant="outlined" label="Chưa thu" />
}

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
  const query = useInvoices({ leaseId: lease.id, pageSize: PAGE_SIZE, includeVoided: true })

  function body() {
    if (query.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (query.error) {
      return (
        <Alert
          severity={isApiError(query.error) && query.error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={() => void query.refetch()}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được hoá đơn của hợp đồng này</AlertTitle>
          {errorMessage(query.error)}
        </Alert>
      )
    }

    const invoices = query.data.data
    const total = query.data.meta.total

    if (invoices.length === 0) {
      // Said out loud. An empty area reads as a panel that failed to load, and
      // "not billed yet" is a real state of a tenancy that has just started.
      return (
        <Typography variant="body2" color="text.secondary">
          Chưa xuất hoá đơn nào cho hợp đồng này.
        </Typography>
      )
    }

    // Newest period first: a dispute is almost always about a recent one. Bills
    // carrying no period — a move-in, a final — are ordered by when they were
    // issued, which is the only date they have.
    const ordered = [...invoices].sort((a, b) => {
      const ay = a.year ?? 0
      const by = b.year ?? 0
      if (ay !== by) return by - ay
      const am = a.month ?? 0
      const bm = b.month ?? 0
      if (am !== bm) return bm - am
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    })

    // A voided bill is history, never money owed — so it is listed, and it is
    // not counted.
    const owed = ordered
      .filter((invoice) => invoice.voidedAt === null && invoice.paymentStatus !== 'paid')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    const partial = total > invoices.length

    return (
      <Stack spacing={1.5}>
        {/*
          `gap`, not Stack's `spacing`. Spacing is a margin on the child, and a
          margin survives the wrap — on a narrow screen the balance dropped to
          its own line and stayed indented by it.
        */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            columnGap: 2,
            rowGap: 0.5,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Tổng cộng {total} hoá đơn phát sinh
          </Typography>
          {/*
            Stated as a figure. A total the reader has to add up from the rows
            is a total the screen declined to give.
          */}
          <Typography variant="body2" color="text.secondary">
            Dư nợ:{' '}
            <Box
              component="span"
              sx={{ color: owed > 0 ? 'error.main' : 'text.primary', fontWeight: 600 }}
            >
              {formatMoney(owed)}
            </Box>
          </Typography>
        </Box>

        <Divider />

        <Stack divider={<Divider flexItem />}>
          {ordered.map((invoice) => (
            <Box
              key={invoice.id}
              component={RouterLink}
              to={`/invoices/${invoice.id}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1.25,
                textDecoration: 'none',
                color: 'inherit',
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {invoice.year !== null && invoice.month !== null
                      ? `Kỳ ${monthLabel(invoice.year, invoice.month).replace('Tháng ', '')}`
                      : invoiceTypeLabel(invoice.type)}
                  </Typography>
                  <PaymentChip invoice={invoice} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {invoiceTypeLabel(invoice.type)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                {formatMoney(invoice.totalAmount)}
              </Typography>
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </Box>
          ))}
        </Stack>

        {/*
          Never present a partial list as the whole of it.

          There is deliberately NO link out of here. The invoice screen filters
          by building, room, period and payment status — not by tenancy — so a
          link to it would answer a different question while wearing this one's
          label. A room outlives its tenancies, and showing a previous tenant's
          bills as this agreement's history is worse than showing fewer.

          Saying the count plainly is what this panel can honestly do. Sending
          the reader somewhere that filters by tenancy needs either that filter
          or a balance from the API — both named in the proposal.
        */}
        {partial && (
          <Alert severity="info">
            Đang hiện {invoices.length} trong {total} hoá đơn. Dư nợ ở trên chỉ tính
            trên phần đang hiện, chưa phải toàn bộ hợp đồng.
          </Alert>
        )}
      </Stack>
    )
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Danh sách hoá đơn theo kỳ</Typography>
          {body()}
        </Stack>
      </CardContent>
    </Card>
  )
}
