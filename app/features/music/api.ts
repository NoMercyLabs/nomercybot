import { apiClient } from '@/lib/api/client'
import type { NowPlaying, QueueItem, MusicConfig } from './types'

export async function getNowPlaying(channelId: string): Promise<NowPlaying | null> {
  const res = await apiClient.get<{ data: NowPlaying | null }>(
    `/v1/channels/${channelId}/music/now-playing`,
  )
  return res.data.data ?? null
}

export async function getQueue(channelId: string): Promise<QueueItem[]> {
  const res = await apiClient.get<{ data: { nowPlaying: NowPlaying | null; queue: QueueItem[] } }>(
    `/v1/channels/${channelId}/music/queue`,
  )
  return res.data.data.queue
}

export async function skipTrack(channelId: string): Promise<void> {
  await apiClient.post(`/v1/channels/${channelId}/music/skip`)
}

export async function pauseTrack(channelId: string): Promise<void> {
  await apiClient.post(`/v1/channels/${channelId}/music/pause`)
}

export async function resumeTrack(channelId: string): Promise<void> {
  await apiClient.post(`/v1/channels/${channelId}/music/resume`)
}

export async function addToQueue(channelId: string, query: string): Promise<void> {
  await apiClient.post(`/v1/channels/${channelId}/music/queue`, { query })
}

export async function removeFromQueue(channelId: string, position: number): Promise<void> {
  await apiClient.delete(`/v1/channels/${channelId}/music/queue/${position}`)
}

export async function getMusicConfig(channelId: string): Promise<MusicConfig> {
  const res = await apiClient.get<{ data: MusicConfig }>(
    `/v1/channels/${channelId}/music/config`,
  )
  return res.data.data
}

export async function updateMusicConfig(
  channelId: string,
  config: Partial<MusicConfig>,
): Promise<MusicConfig> {
  const res = await apiClient.put<{ data: MusicConfig }>(
    `/v1/channels/${channelId}/music/config`,
    config,
  )
  return res.data.data
}
