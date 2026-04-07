import { apiClient } from '@/lib/api/client'
import type { ChannelSettings, FeatureStatus, UpdateChannelPayload } from './types'

export const settingsApi = {
  getChannel: (channelId: string) =>
    apiClient
      .get<{ data: ChannelSettings }>(`/v1/channels/${channelId}`)
      .then((r) => r.data.data),

  updateChannel: (channelId: string, data: UpdateChannelPayload) =>
    apiClient
      .put<{ data: ChannelSettings }>(`/v1/channels/${channelId}`, data)
      .then((r) => r.data.data),

  getFeatures: (channelId: string) =>
    apiClient
      .get<{ data: FeatureStatus[] }>(`/v1/channels/${channelId}/features`)
      .then((r) => r.data.data),

  toggleFeature: (channelId: string, featureKey: string) =>
    apiClient
      .post<{ data: FeatureStatus }>(
        `/v1/channels/${channelId}/features/${featureKey}/toggle`,
      )
      .then((r) => r.data.data),

  getNotificationPrefs: (channelId: string) =>
    apiClient
      .get<{ data: Record<string, boolean> }>(`/v1/channels/${channelId}/notifications`)
      .then((r) => r.data.data),

  updateNotificationPrefs: (channelId: string, prefs: Record<string, boolean>) =>
    apiClient
      .put<{ data: Record<string, boolean> }>(`/v1/channels/${channelId}/notifications`, prefs)
      .then((r) => r.data.data),

  joinBot: (channelId: string) =>
    apiClient.post(`/v1/channels/${channelId}/join`),

  leaveBot: (channelId: string) =>
    apiClient.post(`/v1/channels/${channelId}/leave`),
}
