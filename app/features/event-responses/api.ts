import { apiClient } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/types'
import type { EventResponseListItem, EventResponseConfig, UpdateEventResponseRequest } from './types'

export async function fetchEventResponses(channelId: string): Promise<EventResponseListItem[]> {
  const res = await apiClient.get<ApiResponse<EventResponseListItem[]>>(
    `/v1/channels/${channelId}/event-responses`,
  )
  return res.data.data
}

export async function fetchEventResponse(channelId: string, eventType: string): Promise<EventResponseConfig> {
  const res = await apiClient.get<ApiResponse<EventResponseConfig>>(
    `/v1/channels/${channelId}/event-responses/${encodeURIComponent(eventType)}`,
  )
  return res.data.data
}

export async function upsertEventResponse(
  channelId: string,
  eventType: string,
  data: UpdateEventResponseRequest,
): Promise<EventResponseConfig> {
  const res = await apiClient.put<ApiResponse<EventResponseConfig>>(
    `/v1/channels/${channelId}/event-responses/${encodeURIComponent(eventType)}`,
    data,
  )
  return res.data.data
}

export async function deleteEventResponse(channelId: string, eventType: string): Promise<void> {
  await apiClient.delete(`/v1/channels/${channelId}/event-responses/${encodeURIComponent(eventType)}`)
}
