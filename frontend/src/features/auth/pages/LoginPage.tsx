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
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ApartmentIcon from '@mui/icons-material/Apartment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'

import { isApiError, type ApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
import { useAuth } from '@/features/auth/useAuth'
import { loginFormSchema, type LoginFormValues } from '@/features/auth/schema'
import type { SignInLocationState } from '@/features/auth/AuthProvider'
import { DEFAULT_PATH } from '@/app/navigation'

/**
 * A labelled field, with its label above rather than floating inside it.
 *
 * Local to this screen on purpose — see the note where it is used.
 *
 * The error message keeps a stable id so the input can point at it with
 * `aria-describedby`. MUI's `helperText` did that for us; taking the label out
 * of the field means taking on the wiring the label was carrying.
 */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <Box>
      <Typography
        component="label"
        htmlFor={htmlFor}
        variant="subtitle2"
        sx={{ display: 'block', mb: 0.75 }}
      >
        {label}
      </Typography>
      {children}
      {error && (
        <Typography
          id={`${htmlFor}-error`}
          variant="caption"
          color="error"
          sx={{ display: 'block', mt: 0.75 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  )
}

export function LoginPage() {
  const location = useLocation()
  const { status, signIn, isSigningIn } = useAuth()
  const [submitError, setSubmitError] = useState<ApiError | null>(null)
  // Component state, so a reload conceals the password again without anything
  // having to remember to reset it. Revealing is for checking what was just
  // typed, and that intent does not survive leaving the screen.
  const [revealed, setRevealed] = useState(false)

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
      <Card sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/*
            The mark and the product name stand where the "Đăng nhập" heading
            used to. The word is not lost from the screen — it is what the
            button says, and what the button says is what the screen is for.

            This is the page's h1: dropping the old heading would otherwise
            leave the document without a top-level one.
          */}
          <Stack sx={{ alignItems: 'center', mb: 3 }} spacing={1.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ApartmentIcon />
            </Box>
            <Typography variant="h5" component="h1">
              Quản lý trọ
            </Typography>
          </Stack>

          {/* Shown only when the session ended on its own. A deliberate
              sign-out carries no reason, so nothing appears. */}
          {state.reason === 'expired' && !submitError && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
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
              {errorMessage(submitError)}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/*
              Labels above the fields rather than floating inside them, which is
              how the design draws it — and only on this screen. Putting it in
              the theme would restyle the invoice filters, the meter inputs and
              every dialog, none of which were designed or looked at. A
              treatment applied to screens nobody examined is not a design
              system, it is a global find-and-replace.
            */}
            <Stack spacing={2.5}>
              <Field label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
                <TextField
                  id="phone"
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                  autoComplete="username"
                  autoFocus
                  fullWidth
                  error={Boolean(errors.phone)}
                  {...register('phone')}
                />
              </Field>

              <Field label="Mật khẩu" htmlFor="password" error={errors.password?.message}>
                <TextField
                  id="password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  // Flipped on the SAME input rather than swapping in a second
                  // one: two inputs lose the caret position and the undo
                  // history, and browsers autofill them inconsistently.
                  type={revealed ? 'text' : 'password'}
                  autoComplete="current-password"
                  fullWidth
                  error={Boolean(errors.password)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            // Named for the ACTION, not the state. Naming the
                            // state inverts the meaning: a reader told
                            // "password hidden" reasonably expects pressing it
                            // to hide the password.
                            aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            // Inside a form, a button with no type submits it.
                            type="button"
                            edge="end"
                            onClick={() => setRevealed((shown) => !shown)}
                          >
                            {revealed ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                  {...register('password')}
                />
              </Field>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                // Prevents a second submission of the same attempt.
                disabled={isSigningIn}
                startIcon={
                  isSigningIn ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                {isSigningIn ? 'Đang đăng nhập…' : 'Đăng nhập'}
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
