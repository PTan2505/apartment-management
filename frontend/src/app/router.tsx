import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/layouts/AppShell'
import { DEFAULT_PATH, DESTINATIONS } from '@/app/navigation'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { BuildingsPage } from '@/features/buildings/BuildingsPage'
import { BuildingDetailPage } from '@/features/buildings/BuildingDetailPage'
import { RoomsPage } from '@/features/rooms/RoomsPage'
import { CustomersPage } from '@/features/customers/CustomersPage'

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

              // The remaining destinations are still placeholders; each is
              // replaced by its own change.
              ...DESTINATIONS.filter(
                (destination) =>
                  !['/buildings', '/rooms', '/customers'].includes(destination.path),
              ).map(
                (destination) => ({
                  path: destination.path.replace(/^\//, ''),
                  element: (
                    <PlaceholderPage
                      title={destination.label}
                      providedBy={destination.providedBy}
                    />
                  ),
                }),
              ),

              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])
