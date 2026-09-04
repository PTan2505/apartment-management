import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import EditIcon from '@mui/icons-material/Edit'

import { MOBILE_BREAKPOINT } from '@/app/theme'
import type { Customer } from '@/features/customers/types'

interface CustomerListProps {
  customers: Customer[]
  onEdit: (customer: Customer) => void
}

/**
 * An absent phone number reads as absent.
 *
 * Rendering null as an empty cell makes a customer who has no phone look like a
 * customer whose phone failed to load. A dash says the field is empty on
 * purpose.
 */
function Phone({ value }: { value: string | null }) {
  if (!value) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    )
  }
  return <Typography variant="body2">{value}</Typography>
}

/**
 * Both presentations are always mounted and toggled with `display`, matching
 * the shell's drawers and the rooms list: a `useMediaQuery` branch returns
 * false on first render and would flash the wrong layout.
 *
 * There is no row-actions menu here, unlike rooms. A customer has no lifecycle
 * — the API offers no delete, retire, or restore — so a row carries editing
 * alone, and a menu holding one item is worse than the button it wraps.
 */
export function CustomerList({ customers, onEdit }: CustomerListProps) {
  return (
    <>
      {/* Desktop */}
      <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Điện thoại</TableCell>
              <TableCell align="right">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {customer.fullName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Phone value={customer.phone} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    startIcon={<EditIcon fontSize="small" />}
                    onClick={() => onEdit(customer)}
                  >
                    Sửa
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Phone */}
      <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
        {customers.map((customer) => (
          <Card key={customer.id} variant="outlined">
            <CardContent sx={{ pb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                {/* minWidth: 0 lets a long name wrap instead of widening the
                    card past the viewport. */}
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    {customer.fullName}
                  </Typography>
                  <Phone value={customer.phone} />
                </Box>
                <Button
                  size="small"
                  startIcon={<EditIcon fontSize="small" />}
                  onClick={() => onEdit(customer)}
                >
                  Sửa
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </>
  )
}
