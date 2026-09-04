import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/layouts/AppShell'
import { DEFAULT_PATH } from '@/app/navigation'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { BuildingsPage } from '@/features/buildings/BuildingsPage'
import { BuildingDetailPage } from '@/features/buildings/BuildingDetailPage'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { CustomersPage } from '@/features/customers/CustomersPage'
import { LeasesPage } from '@/features/leases/LeasesPage'
import { LeaseDetailPage } from '@/features/leases/LeaseDetailPage'
import { InvoicesPage } from '@/features/invoices/InvoicesPage'
import { InvoiceDetailPage } from '@/features/invoices/InvoiceDetailPage'
import { BillingRunPage } from '@/features/invoices/BillingRunPage'
import { ExpensesPage } from '@/features/expenses/ExpensesPage'
import { VacancyRunPage } from '@/features/expenses/VacancyRunPage'
import { RevenueReportPage } from '@/features/reports/RevenueReportPage'
import { PortalApp } from '@/portal/PortalApp'

/**
 * Three layers, and the order matters:
 *
 *   AuthProvider      knows whether there is a session. A layout route rather
 *   └── /login        than a wrapper around RouterProvider, because a data
 *   └── ProtectedRoute  router takes no children and the provider needs
 *        └── AppShell    useNavigate.
 *             └── …
 *
 * /login sits outside AppShell: a sign-in screen with a navigation sidebar to
 * pages you cannot reach is nonsense. ProtectedRoute sits above AppShell so the
 * shell never paints for a visitor who is about to be redirected.
 */
export const router = createBrowserRouter([
  /*
    The tenant portal — one screen, reached by a link with the token in the
    fragment.

    Outside AuthProvider entirely, not merely outside the sign-in guard.
    AuthProvider asks the API who is signed in the moment it mounts; a tenant is
    nobody, so that request 401s and the client then attempts a renewal that
    also 401s — two pointless round trips on a phone before a bill appears.

    It keeps its own API module for the same reason: the owner's client renews
    a session when a request is refused, and a tenant has none to renew.
  */
  { path: '/portal', element: <PortalApp /> },

  {
    element: <AuthProvider />,
    children: [
      { path: '/login', element: <LoginPage /> },

      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to={DEFAULT_PATH} replace /> },

              { path: 'buildings', element: <BuildingsPage /> },
              { path: 'buildings/:id', element: <BuildingDetailPage /> },
              { path: 'rooms', element: <RoomsPage /> },
              { path: 'customers', element: <CustomersPage /> },
              { path: 'leases', element: <LeasesPage /> },
              { path: 'leases/:id', element: <LeaseDetailPage /> },
              { path: 'invoices', element: <InvoicesPage /> },
              // Before `invoices/:id`, so the literal path is not read as an id.
              { path: 'invoices/billing-run', element: <BillingRunPage /> },
              { path: 'invoices/:id', element: <InvoiceDetailPage /> },
              { path: 'expenses', element: <ExpensesPage /> },
              { path: 'expenses/empty-rooms', element: <VacancyRunPage /> },
              { path: 'revenue', element: <RevenueReportPage /> },

              // Every destination in the navigation now has a screen. The
              // placeholder mechanism that stood in for the unbuilt ones is
              // gone rather than left behind producing an empty list — a branch
              // that can no longer fire is a branch nobody will maintain, and
              // the next reader would have to work out that it never runs.

              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
