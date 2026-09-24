import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { Pagination } from '@/components/Pagination'
import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { useInvoices } from '@/features/invoices/hooks'
import { LeaseInvoiceRow } from '@/features/leases/LeaseInvoiceRow'
import type { Lease } from '@/features/leases/types'

/**
 * Small enough that the dialog never becomes the scrolling list the panel was
 * broken up to avoid, large enough that a year of monthly bills is two pages.
 */
const PAGE_SIZE = 12

/**
 * Every bill of one tenancy, a page at a time.
 *
 * The panel beside the terms shows the recent ones; this is where the rest
 * live. It exists because there was nowhere else to send a reader: the invoice
 * screen filters by building, room, period and payment status and never by
 * tenancy, and a room outlives its tenancies — so a link there would show a
 * previous tenant's bills under this agreement's heading.
 *
 * Ordered and paged by the API rather than in the browser. The panel can sort
 * its own list because it holds all of it; this holds one page, and sorting a
 * page produces an order that is right within each page and wrong across them.
 *
 * No balance here, deliberately. A page of bills cannot be summed into what the
 * tenancy owes, and the panel already states that figure from a fetch that
 * guards it.
 */
export function AllInvoicesDialog({
  open,
  lease,
  onClose,
}: {
  open: boolean
  lease: Lease
  onClose: () => void
}) {
  const [page, setPage] = useState(1)

  // Reopening starts at the first page: the reader came back to this dialog
  // with a new question, not to resume paging through the old one.
  useEffect(() => {
    if (open) setPage(1)
  }, [open])

  const query = useInvoices({
    leaseId: lease.id,
    page,
    pageSize: PAGE_SIZE,
    includeVoided: true,
    sort: 'newest',
  })

  function body() {
    if (query.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
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
          <AlertTitle>Không tải được hoá đơn</AlertTitle>
          {errorMessage(query.error)}
        </Alert>
      )
    }

    const { data: invoices, meta } = query.data

    if (invoices.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          Chưa xuất hoá đơn nào cho hợp đồng này.
        </Typography>
      )
    }

    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Tổng cộng {meta.total} hoá đơn · mới nhất trước
        </Typography>
        <Divider />
        <Stack divider={<Divider flexItem />}>
          {invoices.map((invoice) => (
            <LeaseInvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </Stack>
        <Pagination meta={meta} onPageChange={setPage} />
      </>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Tất cả hoá đơn
        <Typography variant="body2" color="text.secondary">
          {lease.room ? `${lease.room.roomCode} · ${lease.room.building?.displayName ?? ''}` : ''}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>{body()}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}
