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
function StatusChips({ invoice }: { invoice: Invoice }) {
  // The chips stay on one line. `white-space` on the table cell stops the
  // LABELS breaking, but the chips are flex items and would still wrap between
  // themselves, which is the same broken look one level up.
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'nowrap', gap: 0.5 }}>
      <Chip size="small" variant="outlined" label={invoiceTypeLabel(invoice.type)} />
      {invoice.voidedAt !== null ? (
        <Chip size="small" color="default" variant="filled" label="Đã rút" />
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
 * A monthly invoice has a month; a move-in or ad-hoc one has none, and shows
 * the day it was issued instead. Rendering a dash there would suggest a missing
 * value rather than a bill that genuinely covers no month.
 */
function periodLabel(invoice: Invoice): string {
  if (invoice.year !== null && invoice.month !== null) {
    return monthLabel(invoice.year, invoice.month)
  }
  return `Xuất ${formatDate(invoice.issueDate)}`
}

export function InvoiceList({ invoices, onOpen }: InvoiceListProps) {
  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Kỳ</TableCell>
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
                    {periodLabel(invoice)}
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
                      gap: 1,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{periodLabel(invoice)}</Typography>
                    <StatusChips invoice={invoice} />
                  </Box>
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
