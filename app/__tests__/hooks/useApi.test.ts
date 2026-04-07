import React from 'react'
import { renderHook, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useApiQuery, usePaginatedQuery, useApiMutation } from '@/hooks/useApi'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import type { Channel } from '@/types/channel'

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  setAuthToken: jest.fn(),
}))

jest.mock('@/lib/storage', () => ({
  appStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

const { apiClient } = require('@/lib/api/client')

const mockChannel: Channel = {
  id: 'ch-1',
  broadcasterId: 'b-1',
  twitchId: 'twitch-1',
  displayName: 'StreamerOne',
  login: 'streamerone',
  isLive: false,
  profileImageUrl: '',
  viewerCount: 0,
  overlayToken: 'tok',
  botEnabled: true,
  createdAt: '2024-01-01T00:00:00Z',
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

beforeEach(() => {
  useChannelStore.setState({ currentChannel: mockChannel, channels: [mockChannel] })
  useNotificationStore.setState({ toasts: [] })
  jest.clearAllMocks()
})

describe('useApiQuery', () => {
  it('does not fetch when no channel is selected', () => {
    useChannelStore.setState({ currentChannel: null })
    const { result } = renderHook(
      () => useApiQuery('test', '/commands'),
      { wrapper: createWrapper() },
    )
    expect(result.current.fetchStatus).toBe('idle')
    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('fetches from the channel-scoped URL when channel is selected', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [{ id: 1, name: 'cmd' }] } })
    const { result } = renderHook(
      () => useApiQuery('commands', '/commands'),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.get).toHaveBeenCalledWith('/v1/channels/ch-1/commands')
  })

  it('returns data from the API response', async () => {
    const commands = [{ id: 1, name: '!hello' }]
    apiClient.get.mockResolvedValueOnce({ data: { data: commands } })
    const { result } = renderHook(
      () => useApiQuery<typeof commands>('commands', '/commands'),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(commands)
  })

  it('sets error state on API failure', async () => {
    apiClient.get.mockRejectedValueOnce({ message: 'Not found', status: 404 })
    const { result } = renderHook(
      () => useApiQuery('commands', '/commands'),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('usePaginatedQuery', () => {
  it('passes page and pageSize as query params', async () => {
    apiClient.get.mockResolvedValueOnce({
      data: { data: [], page: 1, pageSize: 25, total: 0 },
    })
    const { result } = renderHook(
      () => usePaginatedQuery('commands', '/commands', 2, 10),
      { wrapper: createWrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/channels/ch-1/commands',
      expect.objectContaining({ params: { page: 2, pageSize: 10 } }),
    )
  })
})

describe('useApiMutation', () => {
  it('sends POST request to channel-scoped URL', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'new-cmd' } } })
    const { result } = renderHook(
      () => useApiMutation('/commands', 'post'),
      { wrapper: createWrapper() },
    )
    await act(async () => {
      await result.current.mutateAsync({ name: '!hello', response: 'Hello!' })
    })
    expect(apiClient.post).toHaveBeenCalledWith(
      '/v1/channels/ch-1/commands',
      { name: '!hello', response: 'Hello!' },
    )
  })

  it('shows success toast when successMessage is provided', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { data: {} } })
    const { result } = renderHook(
      () => useApiMutation('/commands', 'post', { successMessage: 'Command created!' }),
      { wrapper: createWrapper() },
    )
    await act(async () => {
      await result.current.mutateAsync({})
    })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts.some((t) => t.message === 'Command created!' && t.type === 'success')).toBe(true)
  })

  it('shows error toast on mutation failure', async () => {
    apiClient.post.mockRejectedValueOnce({ message: 'Validation failed', status: 422 })
    const { result } = renderHook(
      () => useApiMutation('/commands', 'post'),
      { wrapper: createWrapper() },
    )
    await act(async () => {
      try { await result.current.mutateAsync({}) } catch {}
    })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts.some((t) => t.type === 'error')).toBe(true)
  })
})
