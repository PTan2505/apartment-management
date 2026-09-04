import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'
import type { PaymentOffer } from '@/features/portal/api'

/**
 * The VietQR image service.
 *
 * The code is fetched as an image rather than drawn in the browser because what
 * comes back is the format a Vietnamese tenant recognises: the bank's marks,
 * the account name and the amount printed beneath it, so they can check what
 * they are about to send before sending it. For a screen whose entire job is
 * convincing somebody it is safe to transfer money, that is not decoration.
 *
 * The cost is real and is why the checkout link below is always shown, not only
 * on failure: this is a payment screen that stops working when somebody else's
 * service does.
 */
const VIETQR_BASE = 'https://img.vietqr.io/image'

/**
 * `accountNumber` is the account THE GATEWAY ALLOCATED for this attempt — a
 * virtual one, single-use, and the thing it matches an incoming transfer by.
 *
 * It must never be the owner's real account. A code built against that is
 * perfectly scannable, transfers real money, and is invisible to the gateway —
 * so no confirmation is ever sent, and the bill stays unpaid with the money
 * already gone.
 */
function vietQrUrl(offer: PaymentOffer): string {
  const params = new URLSearchParams({
    amount: String(offer.amount),
    addInfo: offer.description,
    accountName: offer.accountName,
  })
  return `${VIETQR_BASE}/${offer.bin}-${offer.accountNumber}-compact2.png?${params}`
}

interface Props {
  offer: PaymentOffer
  isPaid: boolean
  /** True while the portal is still asking the API whether this has been paid. */
  isWatching: boolean
  /** True while a check is in flight, so it cannot be asked for twice. */
  isChecking: boolean
  onCheckAgain: () => void
}

export function PaymentPanel({ offer, isPaid, isWatching, isChecking, onCheckAgain }: Props) {
  /**
   * WHICH offer's image failed, rather than a boolean reset when the offer
   * changes.
   *
   * The reset was an effect, and it lost a race: the browser starts loading the
   * image during commit, and a request that fails immediately — blocked, or
   * refused by DNS — can error before the effect has run. The effect then set
   * the flag back to false and the warning never appeared, while the image sat
   * there broken.
   *
   * Deriving it from the offer's own id removes the reset, and with it the
   * race: a new offer simply does not match a recorded failure.
   */
  const [failedFor, setFailedFor] = useState<number | null>(null)
  const imageFailed = failedFor === offer.paymentId

  if (isPaid) {
    return (
      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography sx={{ fontWeight: 600 }}>Đã thanh toán</Typography>
        <Typography variant="body2">
          Hoá đơn này đã được ghi nhận. Bạn không cần chuyển thêm.
        </Typography>
      </Alert>
    )
  }

  return (
    <Stack spacing={2} sx={{ mt: 2, alignItems: 'center' }}>
      {imageFailed ? (
        <Alert severity="warning" sx={{ width: '100%' }}>
          Không tải được mã QR. Bạn vẫn có thể thanh toán bằng nút bên dưới.
        </Alert>
      ) : (
        <Box
          component="img"
          src={vietQrUrl(offer)}
          alt={`Mã QR thanh toán ${formatMoney(offer.amount)}`}
          onError={() => setFailedFor(offer.paymentId)}
          sx={{ width: '100%', maxWidth: 280, height: 'auto', borderRadius: 1 }}
        />
      )}

      {/*
        Shown so a tenant can check what they are about to send against what
        their banking app fills in. The account is the gateway's, not the
        owner's — a tenant comparing them would find them different, which is
        correct and worth not hiding.
      */}
      <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography variant="h6">{formatMoney(offer.amount)}</Typography>
        <Typography variant="body2" color="text.secondary">
          {offer.accountName} · {offer.accountNumber}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nội dung: {offer.description}
        </Typography>
      </Stack>

      {isWatching ? (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Đang chờ xác nhận thanh toán…
          </Typography>
        </Stack>
      ) : (
        <Button size="small" onClick={onCheckAgain} disabled={isChecking}>
          {isChecking ? 'Đang kiểm tra…' : 'Kiểm tra lại'}
        </Button>
      )}

      {/*
        Always present, not only when the image fails. Somebody who would rather
        pay in a browser should not have to wait for a failure first.
      */}
      <Button
        variant="outlined"
        fullWidth
        href={offer.checkoutUrl}
        target="_blank"
        rel="noreferrer"
      >
        Mở trang thanh toán
      </Button>
    </Stack>
  )
}
