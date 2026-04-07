import { apiClient } from '@/lib/api/client'
import type { ChatSettings, ChatMessage } from './types'

export async function fetchChatMessages(
  channelId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const res = await apiClient.get<{ data: ChatMessage[] }>(
    `/v1/channels/${channelId}/chat/messages`,
    { params: { limit } },
  )
  return res.data.data ?? []
}

export async function fetchChatSettings(channelId: string): Promise<ChatSettings> {
  const res = await apiClient.get<{ data: ChatSettings }>(
    `/v1/channels/${channelId}/chat/settings`,
  )
  return res.data.data
}

export async function updateChatSettings(
  channelId: string,
  settings: Partial<ChatSettings>,
): Promise<ChatSettings> {
  const res = await apiClient.put<{ data: ChatSettings }>(
    `/v1/channels/${channelId}/chat/settings`,
    settings,
  )
  return res.data.data
}
