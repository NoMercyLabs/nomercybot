import { apiClient } from '@/lib/api/client'
import type { Command, CommandCreate, CommandListItem, CommandUpdate } from './types'

type PaginatedData<T> = { data: T[] }
type Envelope<T> = { data: T }

export async function fetchCommands(channelId: string): Promise<CommandListItem[]> {
  const res = await apiClient.get<PaginatedData<CommandListItem>>(
    `/v1/channels/${channelId}/commands`,
  )
  return res.data.data
}

export async function fetchCommand(channelId: string, name: string): Promise<Command> {
  const res = await apiClient.get<Envelope<Command>>(
    `/v1/channels/${channelId}/commands/${name}`,
  )
  return res.data.data
}

/** Alias for fetchCommand — matches the task spec naming */
export const getCommand = fetchCommand

export async function createCommand(channelId: string, data: CommandCreate): Promise<Command> {
  const res = await apiClient.post<Envelope<Command>>(
    `/v1/channels/${channelId}/commands`,
    data,
  )
  return res.data.data
}

export async function updateCommand(
  channelId: string,
  name: string,
  data: CommandUpdate,
): Promise<Command> {
  const res = await apiClient.put<Envelope<Command>>(
    `/v1/channels/${channelId}/commands/${name}`,
    data,
  )
  return res.data.data
}

export async function deleteCommand(channelId: string, name: string): Promise<void> {
  await apiClient.delete(`/v1/channels/${channelId}/commands/${name}`)
}
