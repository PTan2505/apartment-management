import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState } from '@/components/EmptyState'
import { ListSurface } from '@/components/ListSurface'
import { PageHeader } from '@/components/PageHeader'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { errorMessage } from '@/lib/error-messages'
import { roleLabel } from '@/features/auth/labels'
import { AssignBuildingsDialog } from '@/features/staff/AssignBuildingsDialog'
import { PasswordOnceDialog } from '@/features/staff/PasswordOnceDialog'
import { StaffFormDialog } from '@/features/staff/StaffFormDialog'
import { useResetStaffPassword, useSetStaffActive, useStaff } from '@/features/staff/hooks'
import type { Staff, StaffWithPassword } from '@/features/staff/types'

/** What a staff member covers, or that they cover nothing. */
function Buildings({ staff }: { staff: Staff }) {
  if (staff.buildings.length === 0) {
    return (
      <Typography variant="body2" color="warning.main">
        Chưa giao toà nào — đăng nhập vào sẽ không thấy gì
      </Typography>
    )
  }
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
      {staff.buildings.map((building) => (
        <Chip key={building.id} size="small" variant="outlined" label={building.displayName} />
      ))}
    </Stack>
  )
}

function StatusChip({ staff }: { staff: Staff }) {
  if (!staff.isActive) {
    return <Chip size="small" color="error" variant="outlined" label="Đã ngưng" />
  }
  // Worth saying: until they change it, that account cannot do anything, and
  // the owner is the only person who can tell them the password again.
  if (staff.mustChangePassword) {
    return <Chip size="small" color="warning" variant="outlined" label="Chưa đổi mật khẩu" />
  }
  return <Chip size="small" color="success" variant="outlined" label="Đang làm" />
}

/**
 * The owner's staff: who works here, what they may see, and how to give them
 * a way in.
 *
 * Owner only — the API refuses every other role, and the navigation does not
 * offer it. A manager running a building is not thereby running who else works
 * there.
 */
export function StaffPage() {
  const staffQuery = useStaff()
  const resetPassword = useResetStaffPassword()
  const setActive = useSetStaffActive()

  const [formOpen, setFormOpen] = useState(false)
  const [shown, setShown] = useState<StaffWithPassword | null>(null)
  const [assigning, setAssigning] = useState<Staff | null>(null)
  const [resetting, setResetting] = useState<Staff | null>(null)
  const [deactivating, setDeactivating] = useState<Staff | null>(null)
  const [error, setError] = useState<string | null>(null)

  const staff = staffQuery.data ?? []

  function actions(person: Staff) {
    return (
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" onClick={() => setAssigning(person)}>
          Giao toà
        </Button>
        <Button size="small" onClick={() => setResetting(person)}>
          Cấp mật khẩu mới
        </Button>
        {person.isActive ? (
          <Button size="small" color="error" onClick={() => setDeactivating(person)}>
            Ngưng
          </Button>
        ) : (
          <Button
            size="small"
            onClick={() => setActive.mutate({ id: person.id, isActive: true })}
          >
            Mở lại
          </Button>
        )}
      </Stack>
    )
  }

  function body() {
    if (staffQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }
    if (staffQuery.error) {
      return <Alert severity="error">{errorMessage(staffQuery.error)}</Alert>
    }
    if (staff.length === 0) {
      return (
        <EmptyState
          title="Chưa có nhân viên nào"
          description="Tạo tài khoản cho quản lí hoặc thợ bảo trì để họ tự xem phần việc của mình."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
              Thêm nhân viên
            </Button>
          }
        />
      )
    }

    return (
      <>
        {/* Desktop */}
        <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Họ tên</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Toà nhà phụ trách</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((person) => (
                <TableRow key={person.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{person.fullName}</TableCell>
                  <TableCell>{person.phone ?? '—'}</TableCell>
                  <TableCell>{roleLabel(person.role)}</TableCell>
                  <TableCell>
                    <Buildings staff={person} />
                  </TableCell>
                  <TableCell>
                    <StatusChip staff={person} />
                  </TableCell>
                  <TableCell align="right">{actions(person)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phone */}
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
          {staff.map((person) => (
            <Card key={person.id} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{person.fullName}</Typography>
                    <StatusChip staff={person} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {roleLabel(person.role)} · {person.phone ?? '—'}
                  </Typography>
                  <Buildings staff={person} />
                  {actions(person)}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </>
    )
  }

  return (
    <Box>
      <PageHeader
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
            Thêm nhân viên
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ListSurface>{body()}</ListSurface>

      <StaffFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(result) => {
          setFormOpen(false)
          // Straight into the one screen that will ever show this password.
          setShown(result)
        }}
      />

      <PasswordOnceDialog
        open={shown !== null}
        fullName={shown?.staff.fullName ?? ''}
        phone={shown?.staff.phone ?? null}
        password={shown?.password ?? null}
        onClose={() => setShown(null)}
      />

      <AssignBuildingsDialog staff={assigning} onClose={() => setAssigning(null)} />

      <ConfirmDialog
        open={resetting !== null}
        title="Cấp mật khẩu mới?"
        description={`Mật khẩu hiện tại của ${resetting?.fullName ?? ''} sẽ ngừng hoạt động ngay, và mọi phiên đang mở của họ bị đăng xuất. Mật khẩu mới chỉ hiện một lần.`}
        confirmLabel="Cấp mật khẩu mới"
        busyLabel="Đang cấp…"
        destructive
        busy={resetPassword.isPending}
        onConfirm={() => {
          if (!resetting) return
          resetPassword.mutate(resetting.id, {
            onSuccess: (result) => {
              setResetting(null)
              setShown(result)
            },
            onError: (cause) => {
              setResetting(null)
              setError(errorMessage(cause))
            },
          })
        }}
        onClose={() => setResetting(null)}
      />

      <ConfirmDialog
        open={deactivating !== null}
        title="Ngưng tài khoản này?"
        description={`${deactivating?.fullName ?? ''} sẽ không đăng nhập được nữa, và phiên đang mở của họ ngừng hoạt động ngay. Hồ sơ vẫn giữ — những việc họ đã làm vẫn ghi tên họ.`}
        confirmLabel="Ngưng tài khoản"
        busyLabel="Đang ngưng…"
        destructive
        busy={setActive.isPending}
        onConfirm={() => {
          if (!deactivating) return
          setActive.mutate(
            { id: deactivating.id, isActive: false },
            {
              onSuccess: () => setDeactivating(null),
              onError: (cause) => {
                setDeactivating(null)
                setError(errorMessage(cause))
              },
            },
          )
        }}
        onClose={() => setDeactivating(null)}
      >
        <Alert severity="info">
          <AlertTitle>Không xoá</AlertTitle>
          Xoá tài khoản sẽ xoá cả dấu vết ai đã hẹn lịch sửa, ai đã ký hợp đồng. Ngưng thì
          giữ được những thứ đó.
        </Alert>
      </ConfirmDialog>
    </Box>
  )
}
