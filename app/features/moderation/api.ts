import { apiClient } from '@/lib/api/client'
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types'
import type { AutomodConfig, ModerationBan, ModLogEntry } from './types'

export const moderationApi = {
  getAutomodConfig: (channelId: string) =>
    apiClient
      .get<ApiResponse<AutomodConfig>>(`/v1/channels/${channelId}/moderation/automod`)
      .then((r) => r.data.data),

  saveAutomodConfig: (channelId: string, data: AutomodConfig) =>
    apiClient
      .post<ApiResponse<AutomodConfig>>(`/v1/channels/${channelId}/moderation/automod`, data)
      .then((r) => r.data.data),

  getModerationBans: (channelId: string) =>
    apiClient
      .get<ApiResponse<ModerationBan[]>>(`/v1/channels/${channelId}/moderation/bans`)
      .then((r) => r.data.data),

  unbanUser: (channelId: string, userId: string) =>
    apiClient.delete(`/v1/channels/${channelId}/moderation/bans/${userId}`),

  getModerationLog: (channelId: string, params?: { page?: number; take?: number }) =>
    apiClient
      .get<PaginatedResponse<ModLogEntry>>(`/v1/channels/${channelId}/moderation/log`, { params })
      .then((r) => r.data),

  getShieldMode: (channelId: string) =>
    apiClient
      .get<ApiResponse<{ enabled: boolean }>>(`/v1/channels/${channelId}/moderation/shield`)
      .then((r) => r.data.data),

  setShieldMode: (channelId: string, enabled: boolean) =>
    apiClient
      .patch<ApiResponse<{ enabled: boolean }>>(`/v1/channels/${channelId}/moderation/shield`, { enabled })
      .then((r) => r.data.data),
}
