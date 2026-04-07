import { apiClient } from '@/lib/api/client'
import type { Widget, WidgetCreate, WidgetUpdate } from './types'

export const widgetsApi = {
  list: (channelId: string) =>
    apiClient
      .get<{ data: Widget[]; nextPage: number | null; hasMore: boolean }>(
        `/v1/channels/${channelId}/widgets`,
      )
      .then((r) => r.data.data),

  get: (channelId: string, id: string) =>
    apiClient
      .get<{ data: Widget }>(`/v1/channels/${channelId}/widgets/${id}`)
      .then((r) => r.data.data),

  create: (channelId: string, data: WidgetCreate) =>
    apiClient
      .post<{ data: Widget }>(`/v1/channels/${channelId}/widgets`, data)
      .then((r) => r.data.data),

  update: (channelId: string, id: string, data: WidgetUpdate) =>
    apiClient
      .put<{ data: Widget }>(`/v1/channels/${channelId}/widgets/${id}`, data)
      .then((r) => r.data.data),

  delete: (channelId: string, id: string) =>
    apiClient.delete(`/v1/channels/${channelId}/widgets/${id}`),
}
