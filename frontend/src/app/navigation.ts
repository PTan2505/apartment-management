import ApartmentIcon from '@mui/icons-material/Apartment'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentsIcon from '@mui/icons-material/Payments'
import BarChartIcon from '@mui/icons-material/BarChart'
import type { SvgIconComponent } from '@mui/icons-material'

export interface Destination {
  label: string
  path: string
  icon: SvgIconComponent
}

/**
 * The destinations, defined once and rendered by both drawer variants. Keeping
 * a single list is what stops the desktop and mobile navigation drifting apart.
 *
 * Paths match the backend's module names, so `/invoices` here and
 * `backend/src/modules/invoices/` are obviously counterparts.
 */
export const DESTINATIONS: readonly Destination[] = [
  {
    label: 'Buildings',
    path: '/buildings',
    icon: ApartmentIcon,
  },
  {
    label: 'Rooms',
    path: '/rooms',
    icon: MeetingRoomIcon,
  },
  {
    label: 'Customers',
    path: '/customers',
    icon: PeopleIcon,
  },
  {
    label: 'Leases',
    path: '/leases',
    icon: DescriptionIcon,
  },
  {
    label: 'Invoices',
    path: '/invoices',
    icon: ReceiptIcon,
  },
  {
    label: 'Expenses',
    path: '/expenses',
    icon: PaymentsIcon,
  },
  {
    label: 'Revenue',
    path: '/revenue',
    icon: BarChartIcon,
  },
]

/** Where `/` sends you. */
export const DEFAULT_PATH = '/buildings'
