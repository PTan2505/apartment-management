import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { formatDate } from '@/features/leases/dates'
import { invoiceTypeLabel, monthLabel } from '@/features/invoices/labels'
import type { Invoice } from '@/features/invoices/types'

interface InvoiceListProps {
  invoices: Invoice[]
  onOpen: (invoice: Invoice) => void
}

/**
 * What an invoice is settled or owed, and whether it still stands.
 *
 * A voided invoice is neither paid nor owed — it was withdrawn — so it gets its
 * own chip rather than being shown as an outstanding bill. Reading a withdrawn
 * bill as money owed is how an owner ends up chasing a tenant for nothing.
 */
function StatusChips({ invoice, wrap = false }: { invoice: Invoice; wrap?: boolean }) {
  // In the TABLE the chips stay on one line. `white-space` on the table cell
  // stops the LABELS breaking, but the chips are flex items and would still wrap
  // between themselves, which is the same broken look one level up.
  //
  // On a phone CARD they may wrap. A withdrawn bill with money to return carries
  // three chips, and held on one line they pushed the card to 420px inside a
  // 356px column — the card scrolled sideways and cut off its own period, lease
  // and amount. Measured at 390px, not assumed.
  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      sx={{ flexWrap: wrap ? 'wrap' : 'nowrap', justifyContent: wrap ? 'flex-end' : undefined, gap: 0.5 }}
    >
      {/*
        The kind used to be a chip here, beside the state. It has its own column
        now — and its own line on the card — because "what kind of bill" and
        "what has happened to it" are different questions, and a reader scanning
        for one had to read past the other.
      */}
      {invoice.voidedAt !== null ? (
        <>
          <Chip size="small" color="default" variant="filled" label="Đã thu hồi" />
          {/*
            A tenant paid for this after it was withdrawn. The bill reads as
            withdrawn and the money is kept out of the revenue report, so without
            this mark the transfer is invisible until the tenant asks for it back.
          */}
          {invoice.receivedAfterWithdrawal !== null && (
            <Chip size="small" color="error" variant="filled" label="Có tiền cần trả lại" />
          )}
        </>
      ) : (
        <Chip
          size="small"
          color={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}
          variant={invoice.paymentStatus === 'paid' ? 'filled' : 'outlined'}
          label={invoice.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
        />
      )}
    </Stack>
  )
}

/**
 * What period a bill is about.
 *
 * A monthly invoice has a month; a move-in, closing or one-off bill has none.
 * It used to fall back to the issue date here, which put two different facts in
 * one column — now that the date has a column of its own, the absence is said
 * instead. "Không theo tháng" is a fact about the bill; a dash would read as a
 * value nobody filled in.
 */
function periodLabel(invoice: Invoice): string {
  if (invoice.year !== null && invoice.month !== null) {
    return monthLabel(invoice.year, invoice.month)
  }
  return 'Không theo tháng'
}

export function InvoiceList({ invoices, onOpen }: InvoiceListProps) {
  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {/*
                What kind of bill, first: five kinds look identical as an
                amount, and a reader who cannot tell them apart has to open the
                row to find out what it is.
              */}
              <TableCell>Loại</TableCell>
              <TableCell>Kỳ</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Ngày tạo</TableCell>
              <TableCell>Hợp đồng</TableCell>
              <TableCell align="right">Số tiền</TableCell>
              {/*
                Wide enough for the longest Vietnamese status, and refusing to
                wrap. The supplied design has this column too narrow — "Đã thu
                đủ" breaks across three lines in it — and a pill that wraps is
                not a pill. The treatment is taken from the design; the width
                is not.
              */}
              <TableCell sx={{ whiteSpace: 'nowrap' }}>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => onOpen(invoice)}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {invoiceTypeLabel(invoice.type)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {periodLabel(invoice)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(invoice.issueDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    Hợp đồng #{invoice.leaseId}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatMoney(invoice.totalAmount)}</Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  <StatusChips invoice={invoice} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {invoices.map((invoice) => (
          <Card key={invoice.id} variant="outlined">
            <CardActionArea onClick={() => onOpen(invoice)}>
              <CardContent>
                <Stack spacing={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    {/* The kind identifies the row, so it leads the card. */}
                    <Typography sx={{ fontWeight: 600 }}>
                      {invoiceTypeLabel(invoice.type)}
                    </Typography>
                    <StatusChips invoice={invoice} wrap />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {periodLabel(invoice)} · Xuất {formatDate(invoice.issueDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hợp đồng #{invoice.leaseId}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatMoney(invoice.totalAmount)}
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </>
  )
}
