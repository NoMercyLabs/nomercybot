import { apiClient } from '@/lib/api/client'
import type { Timer, TimerListItem, TimerCreate, TimerUpdate } from './types'

const base = (channelId: string) => `/v1/channels/${channelId}/timers`

export const timersApi = {
  list: (channelId: string) =>
    apiClient
      .get<{ data: TimerListItem[] }>(base(channelId))
      .then((r) => r.data.data),

  get: (channelId: string, id: number) =>
    apiClient
      .get<{ data: Timer }>(`${base(channelId)}/${id}`)
      .then((r) => r.data.data),

  create: (channelId: string, data: TimerCreate) =>
    apiClient
      .post<{ data: Timer }>(base(channelId), data)
      .then((r) => r.data.data),

  update: (channelId: string, id: number, data: TimerUpdate) =>
    apiClient
      .put<{ data: Timer }>(`${base(channelId)}/${id}`, data)
      .then((r) => r.data.data),

  delete: (channelId: string, id: number) =>
    apiClient.delete(`${base(channelId)}/${id}`),

  toggle: (channelId: string, id: number) =>
    apiClient
      .post<{ data: Timer }>(`${base(channelId)}/${id}/toggle`)
      .then((r) => r.data.data),
}
