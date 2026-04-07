import { apiClient } from '@/lib/api/client'
import type { Pipeline, PipelineListItem } from '@/types/pipeline'
import type { PaginatedResponse } from '@/lib/api/types'
import type { PipelineTestResult } from '@/types/pipeline'

export async function fetchPipelines(channelId: string) {
  const res = await apiClient.get<PaginatedResponse<PipelineListItem>>(
    `/v1/channels/${channelId}/pipelines`,
  )
  return res.data
}

export async function fetchPipeline(channelId: string, id: number) {
  const res = await apiClient.get<Pipeline>(`/v1/channels/${channelId}/pipelines/${id}`)
  return res.data
}

export async function createPipeline(channelId: string, data: Partial<Pipeline>) {
  const res = await apiClient.post<Pipeline>(`/v1/channels/${channelId}/pipelines`, data)
  return res.data
}

export async function updatePipeline(channelId: string, id: number, data: Partial<Pipeline>) {
  const res = await apiClient.put<Pipeline>(`/v1/channels/${channelId}/pipelines/${id}`, data)
  return res.data
}

export async function deletePipeline(channelId: string, id: number) {
  await apiClient.delete(`/v1/channels/${channelId}/pipelines/${id}`)
}

export async function testPipeline(channelId: string, id: number) {
  const res = await apiClient.post<PipelineTestResult>(
    `/v1/channels/${channelId}/pipelines/${id}/test`,
  )
  return res.data
}
