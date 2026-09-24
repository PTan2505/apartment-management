import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

import { useInvoices } from '@/features/invoices/hooks'
import { isOwed } from '@/features/invoices/owed'
import { formatMoney } from '@/lib/format'

/**
 * Every bill of the tenancy, so the total is the tenancy's and not the page's.
 *
 * A tenancy with more bills than this has been running for eight years; the
 * invoice panel beside it uses the same ceiling for the same reason.
 */
const PAGE_SIZE = 100

/**
 * What is still owed, said at the moment a tenancy is about to stop.
 *
 * The three endings — move-out, renewal, cancellation — are one-way doors, and
 * each used to say nothing about money. The figure was already on the screen,
 * in the invoice panel, but not in front of the owner at the moment of the
 * decision; afterwards the tenant is gone and the deposit is the only lever
 * left.
 *
 * It does not block. A tenant who has moved out has moved out, and a screen
 * that refused to record it would leave the room held by a tenancy nobody is
 * in. The owner is told, and decides.
 *
 * Silent when nothing is owed, and silent while loading: a warning that appears
 * every time is a warning nobody reads, and one that flickers in after the
 * dialog has been read is one nobody sees.
 */
export function UnpaidInvoicesWarning({ leaseId, action }: { leaseId: number; action: string }) {
  const query = useInvoices({ leaseId, pageSize: PAGE_SIZE, includeVoided: true })

  const owed = (query.data?.data ?? []).filter(isOwed)
  if (owed.length === 0) return null

  const total = owed.reduce((sum, invoice) => sum + invoice.totalAmount, 0)

  return (
    <Alert severity="warning">
      <AlertTitle>
        {owed.length === 1
          ? 'Còn 1 hoá đơn chưa thanh toán'
          : `Còn ${owed.length} hoá đơn chưa thanh toán`}
      </AlertTitle>
      Tổng {formatMoney(total)} chưa thu. {action}
    </Alert>
  )
}
