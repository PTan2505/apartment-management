import { Link as RouterLink } from 'react-router'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { alpha } from '@mui/material/styles'

import { formatMoney } from '@/lib/format'
import { formatDate } from '@/features/leases/dates'
import { invoiceTypeLabel, monthLabel } from '@/features/invoices/labels'
import type { Invoice } from '@/features/invoices/types'

/** What settles an invoice, as an owner would name it. */
export function PaymentChip({ invoice }: { invoice: Invoice }) {
  if (invoice.voidedAt !== null) {
    // Money that landed after withdrawal is the one thing here the owner must
    // act on, so it is named in place of the plain withdrawn state.
    return invoice.receivedAfterWithdrawal !== null ? (
      <Chip size="small" color="error" variant="filled" label="Có tiền cần trả lại" />
    ) : (
      <Chip size="small" variant="outlined" label="Đã thu hồi" />
    )
  }
  if (invoice.paymentStatus === 'paid') {
    return <Chip size="small" color="success" variant="outlined" label="Đã thu đủ" />
  }
  return <Chip size="small" color="warning" variant="outlined" label="Chưa thu" />
}

/**
 * One of a tenancy's bills, as a line that opens it.
 *
 * Shared by the panel beside the terms and the dialog listing every bill —
 * which sit ten lines apart in the same feature and would otherwise be two
 * copies of the same row, drifting from the first edit to either.
 */
export function LeaseInvoiceRow({ invoice }: { invoice: Invoice }) {
  const hasPeriod = invoice.year !== null && invoice.month !== null

  return (
    <Box
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
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {hasPeriod
              ? `Kỳ ${monthLabel(invoice.year!, invoice.month!).replace('Tháng ', '')}`
              : invoiceTypeLabel(invoice.type)}
          </Typography>
          <PaymentChip invoice={invoice} />
        </Stack>
        {/*
          The kind beneath the period — except where the period IS the kind,
          which is every bill that covers no month: a move-in, a final, an
          ad-hoc charge. Those printed their own name twice, one line apart,
          and said nothing about WHEN. The issue date is the only date they
          have, and in a list ordered by it, it is the thing to show.
        */}
        <Typography variant="caption" color="text.secondary">
          {hasPeriod
            ? invoiceTypeLabel(invoice.type)
            : `Xuất ngày ${formatDate(invoice.issueDate)}`}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
        {formatMoney(invoice.totalAmount)}
      </Typography>
      <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
    </Box>
  )
}
