import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation } from 'react-router'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { isApiError, type ApiError } from '@/lib/api-error'
import { useAuth } from '@/features/auth/useAuth'
import { loginFormSchema, type LoginFormValues } from '@/features/auth/schema'
import type { SignInLocationState } from '@/features/auth/AuthProvider'
import { DEFAULT_PATH } from '@/app/navigation'

export function LoginPage() {
  const location = useLocation()
  const { status, signIn, isSigningIn } = useAuth()
  const [submitError, setSubmitError] = useState<ApiError | null>(null)

  const state = (location.state ?? {}) as SignInLocationState

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { phone: '', password: '' },
  })

  // A signed-in user has no business here. `replace` keeps the sign-in screen
  // out of history, so Back does not land on it.
  if (status === 'authenticated') {
    return <Navigate to={state.from ?? DEFAULT_PATH} replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setSubmitError(null)
    try {
      await signIn(values)
    } catch (error) {
      setSubmitError(isApiError(error) ? error : null)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Mobile-first: padding at every width, the card simply stops growing.
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" component="h1" gutterBottom>
            Sign in
          </Typography>

          {/* Shown only when the session ended on its own. A deliberate
              sign-out carries no reason, so nothing appears. */}
          {state.reason === 'expired' && !submitError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Your session ended. Please sign in again.
            </Alert>
          )}

          {/* A connection problem is not a credential problem. Presenting the
              two identically sends the user hunting for a typo that does not
              exist, so they differ in severity and framing. The message text is
              the API's own in the credential case — it deliberately does not
              reveal whether the phone number exists. */}
          {submitError && (
            <Alert
              severity={submitError.isTransport ? 'warning' : 'error'}
              sx={{ mb: 2 }}
            >
              {submitError.isTransport
                ? `Could not sign in: ${submitError.message}`
                : submitError.message}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Phone number"
                autoComplete="username"
                autoFocus
                fullWidth
                error={Boolean(errors.phone)}
                helperText={errors.phone?.message}
                {...register('phone')}
              />
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                fullWidth
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register('password')}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                // Prevents a second submission of the same attempt.
                disabled={isSigningIn}
                startIcon={
                  isSigningIn ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                {isSigningIn ? 'Signing in…' : 'Sign in'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
