import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthProvider'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}
