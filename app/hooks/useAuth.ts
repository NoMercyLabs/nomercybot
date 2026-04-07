import { createContext, useContext, useEffect, type ReactNode, createElement } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { User } from '@/types/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  isHydrated: boolean
  user: User | null
  accessToken: string | null
  login: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const isHydrated = useAuthStore((s) => s._hasHydrated)
  const setHasHydrated = useAuthStore((s) => s.setHasHydrated)
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [])

  // Safety net: if onRehydrateStorage never fires (storage error, edge case),
  // force _hasHydrated=true after 300ms so the app is never permanently blank.
  useEffect(() => {
    if (isHydrated) return
    const timer = setTimeout(() => setHasHydrated(true), 300)
    return () => clearTimeout(timer)
  }, [isHydrated, setHasHydrated])

  return createElement(
    AuthContext.Provider,
    { value: { isAuthenticated, isLoading, isHydrated, user, accessToken, login, logout } },
    children,
  )
}
