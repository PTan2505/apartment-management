import ApartmentIcon from '@mui/icons-material/Apartment'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PaymentsIcon from '@mui/icons-material/Payments'
import BarChartIcon from '@mui/icons-material/BarChart'
import BuildIcon from '@mui/icons-material/Build'
import BadgeIcon from '@mui/icons-material/Badge'
import type { SvgIconComponent } from '@mui/icons-material'

import type { Role } from '@/features/auth/types'

export interface Destination {
  label: string
  path: string
  icon: SvgIconComponent
  /**
   * Which roles may go here.
   *
   * Carried on the destination rather than checked at each link: a link to a
   * screen that will refuse you is a bug report waiting to be written, and one
   * list read in one place is how the drawer and the phone menu stay in step.
   */
  roles: readonly Role[]
}

/** Everybody who works here. A tenant has no account and no navigation. */
const STAFF = ['owner', 'manager'] as const

/**
 * The destinations, defined once and rendered by both drawer variants. Keeping
 * a single list is what stops the desktop and mobile navigation drifting apart.
 *
 * Paths match the backend's module names, so `/invoices` here and
 * `backend/src/modules/invoices/` are obviously counterparts.
 */
export const DESTINATIONS: readonly Destination[] = [
  {
    label: 'Toà nhà',
    roles: STAFF,
    path: '/buildings',
    icon: ApartmentIcon,
  },
  {
    label: 'Phòng',
    roles: STAFF,
    path: '/rooms',
    icon: MeetingRoomIcon,
  },
  {
    label: 'Khách',
    roles: STAFF,
    path: '/customers',
    icon: PeopleIcon,
  },
  {
    label: 'Hợp đồng',
    roles: STAFF,
    path: '/leases',
    icon: DescriptionIcon,
  },
  {
    label: 'Hoá đơn',
    roles: STAFF,
    path: '/invoices',
    icon: ReceiptIcon,
  },
  {
    label: 'Chi phí',
    roles: STAFF,
    path: '/expenses',
    icon: PaymentsIcon,
  },
  {
    label: 'Doanh thu',
    // What the business EARNS: the owner's figure, not an operating screen.
    roles: ['owner'],
    path: '/revenue',
    icon: BarChartIcon,
  },
  {
    label: 'Báo hỏng',
    // The one destination a maintenance account has, and the only one it is
    // admitted to by the API.
    roles: ['owner', 'manager', 'maintenance'],
    path: '/damage-reports',
    icon: BuildIcon,
  },
  {
    label: 'Nhân viên',
    roles: ['owner'],
    path: '/staff',
    icon: BadgeIcon,
  },
]

/** The destinations this role may reach, in the order they are listed. */
export function destinationsFor(role: Role): readonly Destination[] {
  return DESTINATIONS.filter((destination) => destination.roles.includes(role))
}

/**
 * Where a role starts.
 *
 * Not one path for everybody: sending a maintenance account to the buildings
 * screen — which the API refuses it — would make the first thing the
 * application does be an error.
 */
export function startingPathFor(role: Role): string {
  if (role === 'maintenance') return '/damage-reports'
  if (role === 'manager') return '/leases'
  return DEFAULT_PATH
}

/** Where `/` sends you. */
export const DEFAULT_PATH = '/buildings'
