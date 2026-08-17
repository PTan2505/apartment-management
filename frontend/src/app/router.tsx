import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/layouts/AppShell'
import { DEFAULT_PATH, DESTINATIONS } from '@/app/navigation'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

/**
 * Every destination nests under the shell, so navigation and the not-found page
 * are always rendered within it. Domain changes replace each placeholder
 * element with that domain's real routes.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={DEFAULT_PATH} replace /> },

      ...DESTINATIONS.map((destination) => ({
        path: destination.path.replace(/^\//, ''),
        element: (
          <PlaceholderPage
            title={destination.label}
            providedBy={destination.providedBy}
          />
        ),
      })),

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
