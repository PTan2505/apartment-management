import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import PhoneIcon from '@mui/icons-material/Phone'
import EventIcon from '@mui/icons-material/Event'
import DoneIcon from '@mui/icons-material/Done'

import { EmptyState } from '@/components/EmptyState'
import { ListSurface } from '@/components/ListSurface'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { errorMessage } from '@/lib/error-messages'
import { useAuth } from '@/features/auth/useAuth'
import { CloseDialog } from '@/features/damage-reports/CloseDialog'
import { ScheduleDialog } from '@/features/damage-reports/ScheduleDialog'
import {
  REPORT_STATES,
  formatDateTime,
  reportStateColor,
  reportStateLabel,
} from '@/features/damage-reports/labels'
import { useReports } from '@/features/damage-reports/hooks'
import * as reportsApi from '@/features/damage-reports/api'
import type { DamageReport, ReportState } from '@/features/damage-reports/types'
import { useListParams } from '@/lib/useListParams'

interface ReportFilters extends Record<string, string | undefined> {
  state?: string
  buildingId?: string
}

const FILTER_KEYS = ['state', 'buildingId'] as const

/** Opens a photograph in a new tab, on a link signed at the moment it is asked for. */
async function openPhoto(reportId: number, photoId: number) {
  const { url } = await reportsApi.photoDownload(reportId, photoId)
  window.open(url, '_blank', 'noopener')
}

function ReportCard({
  report,
  onSchedule,
  onClose,
}: {
  report: DamageReport
  onSchedule: () => void
  onClose: () => void
}) {
  const done = report.state === 'done'

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Phòng {report.room.roomCode} · {report.building.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Khách báo lúc {formatDateTime(report.reportedAt)}
              </Typography>
            </Box>
            <Chip
              size="small"
              color={reportStateColor(report.state)}
              variant={done ? 'outlined' : 'filled'}
              label={reportStateLabel(report.state)}
            />
          </Box>

          <Typography variant="body2">{report.description}</Typography>

          {report.photos.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {report.photos.map((photo, index) => (
                <Button
                  key={photo.id}
                  size="small"
                  variant="outlined"
                  onClick={() => void openPhoto(report.id, photo.id)}
                >
                  Ảnh {index + 1}
                </Button>
              ))}
            </Stack>
          )}

          <Divider />

          {/*
            The tenant's name and number, because the first thing anybody does
            with a report is ring them. A `tel:` link so a phone dials it.
          */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="body2">
              {report.tenant.fullName ?? 'Không có người đứng tên'}
            </Typography>
            {report.tenant.phone && (
              <Button size="small" href={`tel:${report.tenant.phone}`}>
                {report.tenant.phone}
              </Button>
            )}
          </Stack>

          {report.scheduledFor && (
            <Alert severity={done ? 'success' : 'info'} icon={<EventIcon fontSize="inherit" />}>
              Đã hẹn {formatDateTime(report.scheduledFor)}
              {report.scheduleNote ? ` · ${report.scheduleNote}` : ''}
            </Alert>
          )}

          {done ? (
            <Alert severity="success" icon={<DoneIcon fontSize="inherit" />}>
              <AlertTitle sx={{ mb: 0 }}>Xong ngày {formatDateTime(report.closedAt)}</AlertTitle>
              {report.closingNote}
            </Alert>
          ) : (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Button variant="contained" startIcon={<EventIcon />} onClick={onSchedule}>
                {report.state === 'scheduled' ? 'Đổi lịch hẹn' : 'Ghi nhận lịch hẹn'}
              </Button>
              <Button variant="outlined" startIcon={<DoneIcon />} onClick={onClose}>
                Đã xử lí xong
              </Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}

/**
 * What needs fixing, oldest still-open first.
 *
 * The opposite order to every other list here, and deliberately: elsewhere the
 * newest row is the interesting one, while a report that has been waiting three
 * weeks is exactly the one that must not be buried.
 *
 * The screen a maintenance account arrives at, and the only one it can reach.
 */
export function DamageReportsPage() {
  const { user } = useAuth()
  const { filters, page, setFilter, clearFilters, setPage, hasFilters } =
    useListParams<ReportFilters>(FILTER_KEYS)

  const [scheduling, setScheduling] = useState<DamageReport | null>(null)
  const [closing, setClosing] = useState<DamageReport | null>(null)

  const query = useReports({
    page,
    pageSize: 20,
    state: (filters.state as ReportState | undefined) || undefined,
    buildingId: filters.buildingId ? Number(filters.buildingId) : undefined,
  })

  const buildings = user?.buildings ?? []

  function body() {
    if (query.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }
    if (query.error) {
      return <Alert severity="error">{errorMessage(query.error)}</Alert>
    }

    const reports = query.data.data
    if (reports.length === 0) {
      return hasFilters ? (
        <EmptyState
          title="Không có báo hỏng nào khớp bộ lọc"
          description="Thử trạng thái khác, hoặc xoá bộ lọc."
          action={
            <Button variant="outlined" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="Không có gì đang chờ xử lí"
          description="Khi khách gửi báo hỏng từ link thanh toán, nó sẽ hiện ở đây — cái chờ lâu nhất lên đầu."
        />
      )
    }

    return (
      <>
        <Stack spacing={1.5}>
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onSchedule={() => setScheduling(report)}
              onClose={() => setClosing(report)}
            />
          ))}
        </Stack>
        <Pagination meta={query.data.meta} onPageChange={setPage} />
      </>
    )
  }

  return (
    <Box>
      <PageHeader />

      <ListSurface>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <TextField
            select
            label="Trạng thái"
            size="small"
            value={filters.state ?? ''}
            onChange={(event) =>
              setFilter('state', event.target.value === '' ? undefined : event.target.value)
            }
            sx={{ minWidth: 180, flexGrow: { xs: 1, sm: 0 } }}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {REPORT_STATES.map((state) => (
              <MenuItem key={state} value={state}>
                {reportStateLabel(state)}
              </MenuItem>
            ))}
          </TextField>

          {/*
            Only for somebody covering more than one building. For everybody
            else it is a filter with a single value, which answers nothing.
          */}
          {buildings.length > 1 && (
            <TextField
              select
              label="Toà nhà"
              size="small"
              value={filters.buildingId ?? ''}
              onChange={(event) =>
                setFilter('buildingId', event.target.value === '' ? undefined : event.target.value)
              }
              sx={{ minWidth: 200, flexGrow: { xs: 1, sm: 0 } }}
            >
              <MenuItem value="">Tất cả toà bạn phụ trách</MenuItem>
              {buildings.map((building) => (
                <MenuItem key={building.id} value={String(building.id)}>
                  {building.displayName}
                </MenuItem>
              ))}
            </TextField>
          )}

          {hasFilters && (
            <Button onClick={clearFilters} size="small">
              Xoá bộ lọc
            </Button>
          )}
        </Box>

        {body()}
      </ListSurface>

      <ScheduleDialog report={scheduling} onClose={() => setScheduling(null)} />
      <CloseDialog report={closing} onClose={() => setClosing(null)} />
    </Box>
  )
}
