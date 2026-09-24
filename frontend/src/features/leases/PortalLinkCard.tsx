import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LinkOffIcon from '@mui/icons-material/LinkOff'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  usePortalLink,
  useReissuePortalLink,
  useRevokePortalLink,
} from '@/features/leases/hooks'
import { formatDate } from '@/features/leases/dates'
import { errorMessage } from '@/lib/error-messages'
import type { Lease } from '@/features/leases/types'

/**
 * Where the portal is served from, when it is not this application.
 *
 * Empty is the ordinary case: `/portal` is a route in this very bundle, so the
 * link is built from the address the owner is already looking at. It is a
 * define rather than a runtime lookup for the same reason `__API_URL__` is —
 * the value belongs to the deployment, not to the session.
 */
declare const __PORTAL_URL__: string

/**
 * The link itself, assembled here rather than by the API.
 *
 * The token goes in the FRAGMENT: a browser never transmits one, so the link
 * reaches no access log, no proxy and no referrer header on its way to the
 * portal. That is the whole reason the portal reads it from `#t=` — see
 * `features/portal/token.ts`, which is the other half of this.
 */
function buildLink(token: string): string {
  const base = __PORTAL_URL__ === '' ? `${window.location.origin}/portal` : __PORTAL_URL__
  return `${base.replace(/\/$/, '')}#t=${token}`
}

/**
 * The link a tenant pays through, and the three things an owner does with it.
 *
 * It exists from the moment the tenancy is signed, so this card is about
 * SENDING it, not about creating one — copy it, replace it if it has gone
 * astray, withdraw it if the tenancy should no longer be payable online.
 *
 * What it grants is said on the card. The link is a bearer credential: it is
 * not a sign-in, nobody is identified by it, and whoever holds it can see and
 * pay this tenancy's bills. An owner deciding whom to forward it to needs that
 * in front of them, not in a manual.
 */
export function PortalLinkCard({ lease }: { lease: Lease }) {
  const linkQuery = usePortalLink(lease.id)
  const reissue = useReissuePortalLink(lease.id)
  const revoke = useRevokePortalLink(lease.id)

  const [reissueOpen, setReissueOpen] = useState(false)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const link = linkQuery.data

  async function copy(value: string) {
    setCopyFailed(false)
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard access is refused outside a secure context, and on a phone
      // browser that has not granted it. Saying so beats a button that looks
      // like it worked — the link is on screen and can be selected by hand.
      setCopyFailed(true)
    }
  }

  function body() {
    if (linkQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )
    }

    if (linkQuery.error) {
      return <Alert severity="error">{errorMessage(linkQuery.error)}</Alert>
    }

    if (!link || !link.hasLink) {
      return (
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            Hợp đồng này hiện không có link thanh toán. Khách không tự xem và trả hoá đơn
            được cho tới khi bạn cấp một link mới.
          </Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<AutorenewIcon />}
              onClick={() => reissue.mutate()}
              disabled={reissue.isPending}
            >
              {reissue.isPending ? 'Đang cấp…' : 'Cấp link mới'}
            </Button>
          </Box>
          {reissue.error && <Alert severity="error">{errorMessage(reissue.error)}</Alert>}
        </Stack>
      )
    }

    return (
      <Stack spacing={1.5}>
        {/*
          A link that exists and cannot be shown. It still works for whoever
          holds it — a presented token is found by its hash — so this is not
          "no link", and saying so would send an owner to withdraw something
          their tenant is using.
        */}
        {link.token === null ? (
          <Alert severity="warning">
            <AlertTitle>Không hiện lại được link này</AlertTitle>
            Link vẫn còn hiệu lực với người đang giữ nó, nhưng máy chủ không đọc lại được
            nội dung link (khoá bí mật của hệ thống đã đổi kể từ lúc cấp). Cấp link mới để
            có một link gửi được — link cũ sẽ ngừng hoạt động.
          </Alert>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'start' }}>
            <TextField
              label="Link thanh toán"
              value={buildLink(link.token)}
              size="small"
              fullWidth
              slotProps={{
                htmlInput: { readOnly: true, 'aria-label': 'Link thanh toán của hợp đồng' },
              }}
              onFocus={(event) => event.target.select()}
            />
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={() => void copy(buildLink(link.token ?? ''))}
              sx={{ flexShrink: 0 }}
            >
              {copied ? 'Đã sao chép' : 'Sao chép'}
            </Button>
          </Stack>
        )}

        {copyFailed && (
          <Alert severity="warning">
            Trình duyệt không cho sao chép tự động. Bạn bấm vào ô link rồi copy tay nhé.
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Ai mở link này cũng xem được hoá đơn của hợp đồng và trả tiền online — không cần
          đăng nhập. Chỉ gửi cho khách của phòng này.
        </Typography>

        <Typography variant="caption" color="text.secondary">
          Cấp ngày {formatDate(link.issuedAt)} ·{' '}
          {link.lastUsedAt ? `khách mở lần cuối ${formatDate(link.lastUsedAt)}` : 'khách chưa mở lần nào'}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button
            size="small"
            startIcon={<AutorenewIcon />}
            onClick={() => setReissueOpen(true)}
          >
            Cấp link mới
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={() => setRevokeOpen(true)}
          >
            Thu hồi link
          </Button>
        </Stack>

        {revoke.error && <Alert severity="error">{errorMessage(revoke.error)}</Alert>}
      </Stack>
    )
  }

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h3" sx={{ mb: 1.5 }}>
            Link thanh toán cho khách
          </Typography>
          {body()}
        </CardContent>
      </Card>

      {/*
        Both confirm first: each one kills a link the tenant may already have
        saved, and neither can be undone by issuing another — the old link is
        gone either way.
      */}
      <ConfirmDialog
        open={reissueOpen}
        title="Cấp link thanh toán mới?"
        description="Link hiện tại sẽ ngừng hoạt động ngay. Khách đang giữ link cũ sẽ không mở được nữa, bạn phải gửi lại link mới cho họ."
        confirmLabel="Cấp link mới"
        busyLabel="Đang cấp…"
        destructive
        busy={reissue.isPending}
        error={reissue.error ? errorMessage(reissue.error) : null}
        onConfirm={() =>
          reissue.mutate(undefined, {
            onSuccess: () => setReissueOpen(false),
          })
        }
        onClose={() => setReissueOpen(false)}
      />

      <ConfirmDialog
        open={revokeOpen}
        title="Thu hồi link thanh toán?"
        description="Hợp đồng sẽ không còn link nào. Khách không xem và trả hoá đơn online được cho tới khi bạn cấp link mới."
        confirmLabel="Thu hồi link"
        busyLabel="Đang thu hồi…"
        destructive
        busy={revoke.isPending}
        error={revoke.error ? errorMessage(revoke.error) : null}
        onConfirm={() =>
          revoke.mutate(undefined, {
            onSuccess: () => setRevokeOpen(false),
          })
        }
        onClose={() => setRevokeOpen(false)}
      />
    </>
  )
}
