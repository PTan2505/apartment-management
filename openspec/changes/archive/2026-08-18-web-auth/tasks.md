## 1. Token store

- [x] 1.1 Create feature branch `feature/web-auth` off `dev`
- [x] 1.2 Add `@/features/auth/token-store.ts` holding the token in a module variable mirrored to `localStorage`
- [x] 1.3 Expose a synchronous getter for the interceptor; no subscription mechanism, since nothing renders from the token store
- [x] 1.4 Document in the file that the token is deliberately in `localStorage`, what that exposes, and what it buys
- [x] 1.5 Read any existing stored token at module load so the first request carries it

## 2. Auth API functions

- [x] 2.1 Add `@/features/auth/types.ts` with the account shape returned by `GET /auth/me`
- [x] 2.2 Add `@/features/auth/api.ts` with `login`, `refresh`, `logout`, and `fetchMe`
- [x] 2.3 Add a zod schema for the login form mirroring the backend's `min(1)` on both fields and imposing nothing further

## 3. Interceptors

- [x] 3.1 Add a request interceptor attaching the stored token as a Bearer header, omitting it when there is none
- [x] 3.2 Extend the response interceptor so a 401 triggers renewal and one retry of the original request
- [x] 3.3 Mark a retried request so it cannot be retried again
- [x] 3.4 Exclude `/auth/refresh` from triggering renewal, so a failing renewal cannot renew itself
- [x] 3.5 Clear the stored token when renewal fails, so the session ends rather than looping
- [x] 3.6 Keep the existing error normalization intact — a renewed-and-retried failure must still surface as an `ApiError`

## 4. Auth state

- [x] 4.1 Add `@/features/auth/AuthProvider.tsx` querying `fetchMe` with `queryKey: ['auth','me']` and `retry: false`
- [x] 4.2 Derive the four states — pending, signed in, signed out, offline — distinguishing the last two by `ApiError.kind`
- [x] 4.3 Expose the user, the state, and `signIn` / `signOut` actions through a hook
- [x] 4.4 On successful login, store the token, then fetch the account and write it into the auth query cache (login returns only a token, so the account must still be fetched; writing it in avoids flickering back through the pending state)
- [x] 4.5 Implement `signOut`: call the API, clear the token, `queryClient.clear()`, navigate to the sign-in screen
- [x] 4.6 Make `signOut` complete locally even when the API call fails, so a user is never stuck in a session
- [x] 4.7 Mount the provider as the root layout route inside the router, not around `RouterProvider` — a data router takes no children, and the provider needs `useNavigate`

## 5. Sign-in screen

- [x] 5.1 Add `@/features/auth/pages/LoginPage.tsx` with phone and password fields using `react-hook-form` and the zod resolver
- [x] 5.2 Add `react-hook-form` and `@hookform/resolvers` as dependencies
- [x] 5.3 Show the API's rejection message verbatim, without rewording it
- [x] 5.4 Distinguish a transport failure from rejected credentials in what is displayed
- [x] 5.5 Indicate a submission in flight and prevent a duplicate submission of the same attempt
- [x] 5.6 Show the session-ended explanation when the user arrived because their session expired, and not when they signed out deliberately
- [x] 5.7 Ensure the screen is usable at phone width

## 6. Route protection

- [x] 6.1 Add `@/features/auth/ProtectedRoute.tsx` rendering a splash while the state is pending
- [x] 6.2 Redirect to the sign-in screen when signed out, carrying the attempted destination in router state
- [x] 6.3 Show a connection message rather than the sign-in screen when the state is offline
- [x] 6.4 Restructure `app/router.tsx`: `/login` outside the shell, `ProtectedRoute` above `AppShell`
- [x] 6.5 Redirect a signed-in user away from `/login`
- [x] 6.6 Navigate to the remembered destination after signing in, falling back to the default when there is none

## 7. Account menu

- [x] 7.1 Add an account control to the app bar showing the signed-in user's full name
- [x] 7.2 Open a menu exposing the phone number and a sign-out action
- [x] 7.3 Ensure it is reachable and usable at phone width alongside the existing menu button

## 9. Verification — signing in

- [x] 9.1 Verify correct credentials establish a session and enter the application
- [x] 9.2 Verify a wrong password shows the API's message and leaves the user signed out
- [x] 9.3 Verify an unknown phone number shows the identical message, so the account cannot be probed
- [x] 9.4 Verify an empty phone or password is reported without a request being made
- [x] 9.5 Verify the seeded owner's phone number is accepted, confirming no stricter client rule was introduced
- [x] 9.6 Verify a sign-in attempt with the backend stopped reports a connection problem, not bad credentials
- [x] 9.7 Verify the in-flight state prevents a duplicate submission

## 10. Verification — session lifecycle

- [x] 10.1 Verify a reload keeps the user signed in without re-entering credentials
- [x] 10.2 Verify no sign-in screen appears during restoration for an already signed-in user
- [x] 10.3 Verify a corrupted or expired stored token is recovered from by renewal rather than signing the user out
- [x] 10.4 Verify that with no stored token and no valid cookie the user is sent to the sign-in screen
- [x] 10.5 Verify a 401 on a domain request triggers renewal and the retried request succeeds
- [x] 10.6 Verify that when renewal fails the session ends and the sign-in screen explains why
- [x] 10.7 Verify a request already retried is not retried again
- [x] 10.8 Verify a failing `/auth/refresh` does not trigger further renewal attempts, by confirming a bounded number of requests
- [x] 10.9 Verify several simultaneous 401s all recover and leave a usable session
- [x] 10.10 Verify restoration with the backend stopped reports a connection problem rather than signing the user out

## 11. Verification — protection, sign-out, and tabs

- [x] 11.1 Verify opening a destination's address while signed out redirects to the sign-in screen with no shell shown
- [x] 11.2 Verify signing in then returns the user to that destination
- [x] 11.3 Verify signing in from the sign-in screen directly lands on the default destination
- [x] 11.4 Verify a signed-in user opening `/login` is sent into the application
- [x] 11.5 Verify the account menu shows the seeded owner's name and phone from `GET /auth/me`
- [x] 11.6 Verify signing out clears the token, returns to the sign-in screen, and shows no session-ended explanation
- [x] 11.7 Verify the refresh token is revoked by sign-out, so the previous cookie can no longer establish a session
- [x] 11.8 Verify no data cached during the previous session is visible after signing in again
- [x] 11.9 Verify sign-out completes locally when the API is unreachable
- [x] 11.10 Verify a second tab reloaded after a sign-out finds no session and shows the sign-in screen
- [x] 11.11 Verify the responsive shell behaviour from `web-foundation` still holds once the shell is behind the gate

## 12. Wrap-up

- [x] 12.1 Run the frontend typecheck and confirm it passes
- [x] 12.2 Confirm every cross-directory import uses the `@/` alias and none use `../`
- [x] 12.3 Confirm no JWT decoding library was added and no token is decoded client-side
- [x] 12.4 Confirm `backend/` is unchanged by this branch
- [x] 12.5 Clean up verification data, leaving the seeded owner intact
- [ ] 12.6 Report the work for review, and commit only when asked
