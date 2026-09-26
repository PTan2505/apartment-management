import { useCallback, useState } from 'react'
import Badge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import NotificationsIcon from '@mui/icons-material/Notifications'

import { formatDate } from '@/features/leases/dates'
import { useLiveNotices, type NewReportEvent } from '@/features/notices/live'
import { useMarkNoticesRead, useNotices, useUnreadNoticeCount } from '@/features/notices/hooks'

/** What a report's state means to somebody reading a notice about it. */
const STATE_LABELS: Record<'new' | 'scheduled' | 'done', string> = {
  new: 'Chưa xử lí',
  scheduled: 'Đã hẹn lịch',
  done: 'Đã xong',
}

/**
 * What happened while this person was away.
 *
 * Two things at once, deliberately: a count that is CORRECT whether or not a
 * socket ever opened, and an announcement the moment one arrives. The number
 * comes from the API and refetches on its own; the live channel only makes it
 * immediate. A bell that depended on a connection would be silently wrong on
 * every network that blocks one.
 *
 * Arrival is also said out loud, once, naming the room — a number changing in
 * the corner of a screen nobody is looking at is not an announcement.
 */
export function NoticeBell({ enabled }: { enabled: boolean }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [arrived, setArrived] = useState<NewReportEvent | null>(null)

  const unread = useUnreadNoticeCount()
  const notices = useNotices(anchor !== null)
  const markRead = useMarkNoticesRead()

  const onNewReport = useCallback((event: NewReportEvent) => setArrived(event), [])
  useLiveNotices(enabled, onNewReport)

  function open(element: HTMLElement) {
    setAnchor(element)
    // Asked for again on every opening: what a notice says can change without
    // this account doing anything — another member of staff schedules the
    // repair, or closes it.
    void notices.refetch()
    // Reading them is what clears the count, and it is an act of its own: the
    // list refetches in the background, and clearing on a fetch would clear
    // while nobody was looking.
    if ((unread.data ?? 0) > 0) markRead.mutate()
  }

  const count = unread.data ?? 0

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={count > 0 ? `${count} thông báo chưa đọc` : 'Thông báo'}
        onClick={(event) => open(event.currentTarget)}
      >
        <Badge badgeContent={count} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 360, maxWidth: '100vw' } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">Thông báo</Typography>
          <Typography variant="caption" color="text.secondary">
            Báo hỏng mới từ các toà bạn phụ trách
          </Typography>
        </Box>
        <Divider />

        {(notices.data ?? []).length === 0 ? (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {notices.isPending ? 'Đang tải…' : 'Chưa có thông báo nào.'}
            </Typography>
          </Box>
        ) : (
          (notices.data ?? []).map((notice) => (
            <MenuItem key={notice.id} onClick={() => setAnchor(null)} sx={{ alignItems: 'start' }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Phòng {notice.report.roomCode}
                    </Typography>
                    {/*
                      A notice about a report already dealt with STAYS, and says
                      so. It records that something happened, and that goes on
                      being true after the work is done.
                    */}
                    <Chip
                      size="small"
                      variant="outlined"
                      color={notice.report.state === 'done' ? 'success' : 'warning'}
                      label={STATE_LABELS[notice.report.state]}
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                      {notice.report.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notice.report.building.displayName} · {formatDate(notice.report.reportedAt)}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>

      <Snackbar
        open={arrived !== null}
        autoHideDuration={8000}
        onClose={() => setArrived(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert severity="warning" onClose={() => setArrived(null)} sx={{ width: '100%' }}>
          Phòng {arrived?.roomCode} vừa báo hỏng
        </Alert>
      </Snackbar>
    </>
  )
}
