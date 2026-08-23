import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import {
  PortalLinkInvalid,
  PortalRequestFailed,
  fetchOverview,
  startPayment,
  type PaymentOffer,
  type PortalOverview,
} from '@/portal/api'
import { InvoiceCard, PayButton } from '@/portal/InvoiceCard'
import { PaymentPanel } from '@/portal/PaymentPanel'
import { resolveToken } from '@/portal/token'

/**
 * How often to ask whether a bill has been paid, and for how long.
 *
 * Asking is necessary rather than convenient: a tenant who scans the code in
 * their banking application never opens the gateway's page and is never
 * returned to this one. Nothing tells this screen the money moved except
 * asking. The API answers from its own database — the webhook is what writes
 * it — so this costs a query and never touches the gateway.
 *
 * It stops after a few minutes. A tab left open on a bus must not poll for an
 * hour; there is a button to start again.
 */
const POLL_INTERVAL_MS = 4000
const POLL_LIMIT_MS = 4 * 60 * 1000

/**
 * How long before admitting the wait might be long.
 *
 * The API is hosted where an idle service is suspended and takes around fifty
 * seconds to wake. Fifty seconds of a spinner is indistinguishable from a page
 * that has failed, and a tenant who assumes it is broken closes it. So the
 * screen says so — before the wait, not after it.
 */
const SLOW_AFTER_MS = 3000

export function PortalApp() {
  const [overview, setOverview] = useState<PortalOverview | null>(null)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slow, setSlow] = useState(false)
  // A first load that failed is not a first load still in progress. Without
  // this the spinner turns for ever beside an error nothing will clear.
  const [loadFailed, setLoadFailed] = useState(false)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [offers, setOffers] = useState<Record<number, PaymentOffer>>({})
  const [payingId, setPayingId] = useState<number | null>(null)
  const [watchingId, setWatchingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setOverview(await fetchOverview())
      setError(null)
      setLoadFailed(false)
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) setLinkInvalid(true)
      else {
        setError(cause instanceof Error ? cause.message : 'Đã có lỗi xảy ra')
        setLoadFailed(true)
      }
    }
  }, [])

  useEffect(() => {
    // No token at all is the same answer as a bad one: the API refuses to
    // distinguish them, and repeating the distinction here would undo that.
    if (!resolveToken()) {
      setLinkInvalid(true)
      return
    }
    const slowTimer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    void load().finally(() => window.clearTimeout(slowTimer))
    return () => window.clearTimeout(slowTimer)
  }, [load])

  const stopWatching = useRef<() => void>(() => {})

  const watch = useCallback(
    (invoiceId: number) => {
      setWatchingId(invoiceId)
      const startedAt = Date.now()

      const timer = window.setInterval(() => {
        if (Date.now() - startedAt > POLL_LIMIT_MS) {
          stopWatching.current()
          return
        }
        void load()
      }, POLL_INTERVAL_MS)

      stopWatching.current = () => {
        window.clearInterval(timer)
        setWatchingId(null)
      }
    },
    [load],
  )

  // Stop the moment the bill reports itself paid — the whole reason for asking
  // has been answered.
  useEffect(() => {
    if (watchingId === null) return
    const invoice = overview?.invoices.find((candidate) => candidate.id === watchingId)
    if (invoice?.isPaid) stopWatching.current()
  }, [overview, watchingId])

  // And on unmount, so nothing keeps running against a screen nobody is on.
  useEffect(() => () => stopWatching.current(), [])

  /**
   * Starting a payment — and re-checking one — go through the same call, which
   * is the point.
   *
   * Asking to pay is what makes the API ask the GATEWAY what became of an
   * attempt it still holds as waiting. Polling only re-reads the API's own
   * database, and in the case that matters that database is the thing that is
   * wrong: a confirmation lost in transit, the gateway holding the money and
   * this system not knowing.
   *
   * Before this, the button offered here re-polled, so the recovery the API
   * implements was unreachable from the one screen that needed it — a tenant
   * would watch "waiting for confirmation" for ever. Found by paying a real
   * bill whose webhook went to a different deployment.
   *
   * A bill the gateway reports as already paid comes back as a conflict. That
   * is success, not failure: the API has just settled it, and reloading shows
   * it paid.
   */
  async function pay(invoiceId: number) {
    setPayingId(invoiceId)
    try {
      const offer = await startPayment(invoiceId)
      setOffers((current) => ({ ...current, [invoiceId]: offer }))
      watch(invoiceId)
    } catch (cause) {
      if (cause instanceof PortalLinkInvalid) setLinkInvalid(true)
      else if (cause instanceof PortalRequestFailed && cause.status === 409) {
        stopWatching.current()
        await load()
      } else setError(cause instanceof Error ? cause.message : 'Không tạo được mã thanh toán')
    } finally {
      setPayingId(null)
    }
  }

  if (linkInvalid) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">
          <Typography sx={{ fontWeight: 600 }}>Liên kết không còn hiệu lực</Typography>
          <Typography variant="body2">
            Hãy liên hệ chủ nhà để nhận liên kết mới.
          </Typography>
        </Alert>
      </Container>
    )
  }

  if (!overview) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          {loadFailed ? (
            <>
              <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>
              <Button variant="outlined" onClick={() => void load()}>
                Thử lại
              </Button>
            </>
          ) : (
            <>
              <CircularProgress />
              {slow && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Đang tải, lần đầu trong ngày có thể mất khoảng một phút…
                </Typography>
              )}
            </>
          )}
        </Stack>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {overview.tenant.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Hoá đơn của bạn
          </Typography>
        </Box>

        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

        {overview.invoices.length === 0 ? (
          <Alert severity="info">Hiện chưa có hoá đơn nào.</Alert>
        ) : (
          <Stack>
            {overview.invoices.map((invoice) => {
              const offer = offers[invoice.id]
              return (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  expanded={expandedId === invoice.id}
                  onToggle={() =>
                    setExpandedId((current) => (current === invoice.id ? null : invoice.id))
                  }
                >
                  {/*
                    An offer that exists keeps its panel even once the bill is
                    paid, because that panel is where the tenant is told so.

                    Checking `isPaid` first — as this did — makes the panel
                    vanish the instant the money lands: the code disappears, the
                    area goes blank, and a small chip at the top changes colour.
                    To somebody who has just scanned and is watching the screen
                    that reads as a failure, not a success. It also left the
                    panel's own success branch unreachable.
                  */}
                  {offer ? (
                    <PaymentPanel
                      offer={offer}
                      isPaid={invoice.isPaid}
                      isWatching={watchingId === invoice.id}
                      isChecking={payingId === invoice.id}
                      onCheckAgain={() => void pay(invoice.id)}
                    />
                  ) : invoice.isPaid ? null : (
                    <PayButton onPay={() => void pay(invoice.id)} pending={payingId === invoice.id} />
                  )}
                </InvoiceCard>
              )
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
