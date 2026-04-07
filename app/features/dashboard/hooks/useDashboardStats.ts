import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import type { DashboardStats } from '../types'

export function useDashboardStats() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  return useQuery<DashboardStats>({
    queryKey: ['channel', channelId, 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardStats }>(`/v1/dashboard/${channelId}/stats`)
      return res.data.data
    },
    enabled: !!channelId,
    refetchInterval: 15_000,
  })
}
