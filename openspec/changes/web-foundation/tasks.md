## 1. Branch & TypeScript conversion

- [x] 1.1 Create feature branch `feature/web-foundation` off `dev`
- [x] 1.2 Add `typescript`, `@types/react`, and `@types/react-dom` as dev dependencies
- [x] 1.3 Add `tsconfig.json` with `strict: true`, matching the backend's strictness
- [x] 1.4 Add `tsconfig.node.json` for the Vite config itself
- [x] 1.5 Rename `main.jsx` to `main.tsx` and `App.jsx` to `App.tsx`, and rename `vite.config.js` to `vite.config.ts`
- [x] 1.6 Add a `typecheck` script running `tsc --noEmit`
- [x] 1.7 Confirm `tsc --noEmit` passes and `npm run dev` still serves the untouched scaffold

## 2. Alias & dev proxy

- [x] 2.1 Add the `@/` path mapping to `tsconfig.json`, resolving to `frontend/src/`
- [x] 2.2 Add the matching `resolve.alias` to the Vite config, since the mapping and the alias are independent
- [x] 2.3 Add a `VITE_API_TARGET` environment variable with a default, so the backend port is not hardcoded, and mirror it in a `frontend/.env.example`
- [x] 2.4 Add the `/api` dev proxy rewriting the prefix away before forwarding to the backend
- [x] 2.5 Add `cookiePathRewrite` mapping `/auth` to `/api/auth`, with a comment recording why removing it breaks sessions
- [x] 2.6 Verify `/api/health` through the dev server returns the backend's health response

## 3. Providers and theme

- [ ] 3.1 Add `@mui/material`, its Emotion peer dependencies, and `@mui/icons-material`
- [ ] 3.2 Add `@/app/theme.ts` defining the MUI theme
- [ ] 3.3 Add `@tanstack/react-query` and `@/app/query-client.ts` with the retry and `staleTime` defaults from design
- [ ] 3.4 Configure retry so client errors (4xx) are never retried and transport failures and 5xx are
- [ ] 3.5 Add `react-router` and `@/app/router.tsx` holding the route table
- [ ] 3.6 Compose the providers in `main.tsx` with `CssBaseline` applied

## 4. API client

- [ ] 4.1 Add `axios` and `@/lib/api-client.ts` exporting a single configured instance with the `/api` base path
- [ ] 4.2 Add `@/lib/api-error.ts` defining the normalized error type carrying status, code, message, and optional field details
- [ ] 4.3 Distinguish a transport failure from a server rejection on the error type, rather than representing it as status `0`
- [ ] 4.4 Add a response interceptor normalizing structured backend errors into that type, preserving `details`
- [ ] 4.5 Extend the interceptor to normalize responses with no body and responses whose body does not match the backend error shape
- [ ] 4.6 Add `@/lib/money.ts` converting a transported monetary string to a number, passing `null` and `undefined` through unchanged
- [ ] 4.7 Document in `money.ts` that it is applied to named monetary fields only, never to identifiers, room codes, or phone numbers

## 5. Responsive application shell

- [ ] 5.1 Add `@/layouts/AppShell.tsx` with an app bar, a navigation region, and an `<Outlet />` content area
- [ ] 5.2 Define the eight navigation destinations once, shared by both drawer variants
- [ ] 5.3 Render the permanent drawer, visible only at `md` and above
- [ ] 5.4 Render the temporary drawer, visible only below `md`, opened by a menu button in the app bar
- [ ] 5.5 Mount both variants and toggle with `sx` `display` rather than branching on a media-query hook, to avoid a first-paint flash
- [ ] 5.6 Close the temporary drawer when a destination is selected
- [ ] 5.7 Show the menu button only below `md`
- [ ] 5.8 Indicate the active destination in both drawer variants
- [ ] 5.9 Constrain the content area so the shell itself never scrolls horizontally

## 6. Routes

- [ ] 6.1 Add placeholder pages for the eight domains, each naming the `web-<domain>` change that will replace it
- [ ] 6.2 Wire the eight destinations into the route table beneath the shell layout
- [ ] 6.3 Add a not-found route rendering inside the shell with navigation still usable
- [ ] 6.4 Redirect the root path to a default destination

## 7. Verification — shell and responsive behavior

- [ ] 7.1 Verify the navigation is permanently visible at desktop width with no menu button offered
- [ ] 7.2 Verify at phone width the navigation is hidden, content is full width, and a menu button is offered
- [ ] 7.3 Verify the menu button opens the drawer over the content and the backdrop dismisses it
- [ ] 7.4 Verify selecting a destination on a narrow viewport navigates and closes the drawer
- [ ] 7.5 Verify resizing from narrow to wide with the drawer open settles into the permanent form
- [ ] 7.6 Verify the active destination is distinguished in both forms
- [ ] 7.7 Verify no horizontal scrolling of the shell at 320px width

## 8. Verification — routing and API client

- [ ] 8.1 Verify navigating updates the browser address, and that entering an address directly opens that destination
- [ ] 8.2 Verify browser back returns to the previously visited destination
- [ ] 8.3 Verify an unknown address renders the not-found page inside the shell
- [ ] 8.4 Verify a request to an authenticated endpoint without a token produces a normalized error carrying status 401 and the backend's code and message
- [ ] 8.5 Verify a request with the backend stopped produces a normalized error identifying itself as a transport failure, not a misleading status
- [ ] 8.6 Verify a 4xx response is not retried, and that a transport failure is
- [ ] 8.7 Verify the money helper converts a monetary string to a number, leaves `null` and `undefined` unchanged, and is not applied to a phone number with a leading zero

## 9. Wrap-up

- [ ] 9.1 Run `tsc --noEmit` in `frontend/` and confirm it passes
- [ ] 9.2 Confirm every cross-directory import uses the `@/` alias and no import uses `../`
- [ ] 9.3 Confirm Tailwind, MUI X DataGrid, and MUI X Date Pickers are absent from `package.json`
- [ ] 9.4 Confirm `backend/` is unchanged by this branch
- [ ] 9.5 Commit work in atomic commits per completed task group, on `feature/web-foundation`
