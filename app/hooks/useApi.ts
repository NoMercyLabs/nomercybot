import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import type { ApiResponse, PaginatedResponse, ApiError } from '@/lib/api/types'

export function useChannelQueryKey(base: string, ...rest: unknown[]) {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  return ['channel', channelId, base, ...rest] as const
}

export function useApiQuery<T>(
  key: string,
  path: string,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>,
) {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryKey = useChannelQueryKey(key)

  return useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<T>>(
        `/v1/channels/${channelId}${path}`,
      )
      return res.data.data
    },
    enabled: !!channelId,
    ...options,
  })
}

export function usePaginatedQuery<T>(
  key: string,
  path: string,
  page: number,
  pageSize = 25,
) {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryKey = useChannelQueryKey(key, page, pageSize)

  return useQuery<PaginatedResponse<T>, ApiError>({
    queryKey,
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<T>>(
        `/v1/channels/${channelId}${path}`,
        { params: { page, pageSize } },
      )
      return res.data
    },
    enabled: !!channelId,
    placeholderData: (prev) => prev,
  })
}

export function useApiMutation<TData, TVariables>(
  path: string,
  method: 'post' | 'put' | 'patch' | 'delete',
  options?: {
    invalidateKeys?: string[]
    successMessage?: string
    onSuccess?: (data: TData) => void
    onError?: (error: ApiError) => void
  },
) {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((s) => s.addToast)

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      const url = `/v1/channels/${channelId}${path}`
      if (method === 'delete') {
        await apiClient.delete(url)
        return undefined as TData
      }
      const res = await (apiClient[method] as (url: string, data?: unknown) => Promise<{ data: ApiResponse<TData> }>)(url, variables)
      return res.data.data
    },
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        for (const key of options.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: ['channel', channelId, key] })
        }
      }
      if (options?.successMessage) {
        addToast('success', options.successMessage)
      }
      options?.onSuccess?.(data)
    },
    onError: (error: ApiError) => {
      if (options?.onError) {
        options.onError(error)
      } else {
        addToast('error', error.message ?? 'An unexpected error occurred')
      }
    },
  })
}
