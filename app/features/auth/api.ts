import { apiClient } from '@/lib/api/client'
import type { User } from '@/types/auth'

export async function exchangeToken(token: string) {
  const res = await apiClient.post<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
    '/v1/auth/exchange',
    { token },
  )
  return res.data
}

export async function refreshAuth(refreshToken: string) {
  const res = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
    '/v1/auth/refresh',
    { refreshToken },
  )
  return res.data
}

export async function revokeAuth() {
  await apiClient.post('/v1/auth/logout')
}
