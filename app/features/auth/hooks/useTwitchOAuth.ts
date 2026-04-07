import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'

export function useTwitchOAuth() {
  const [error, setError] = useState<string | null>(null)
  const storeLogin = useAuthStore((s) => s.login)
  const isLoading = useAuthStore((s) => s.isLoading)

  async function login() {
    setError(null)
    try {
      await storeLogin()
    } catch (e) {
      setError((e as Error).message ?? 'Login failed. Please try again.')
    }
  }

  return { login, isLoading, error }
}
