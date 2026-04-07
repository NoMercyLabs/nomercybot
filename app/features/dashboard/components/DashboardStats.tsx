import { View, Text } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useChannelStore } from '@/stores/useChannelStore'
import { Users, UserPlus, MessageSquare, Terminal } from 'lucide-react-native'

interface Stat {
  label: string
  value: string | number
  icon: any
  color: string
}

export function DashboardStats() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats', channelId],
    queryFn: () => apiClient.get(`/v1/dashboard/${channelId}/stats`).then((r) => r.data),
    enabled: !!channelId,
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <View className="flex-row flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 flex-1 min-w-36" />
        ))}
      </View>
    )
  }

  const stats: Stat[] = [
    { label: 'Viewers', value: data?.viewers ?? 0, icon: Users, color: '#a855f7' },
    { label: 'Followers', value: data?.followers ?? 0, icon: UserPlus, color: '#3b82f6' },
    { label: 'Chat Messages', value: data?.chatMessages ?? 0, icon: MessageSquare, color: '#10b981' },
    { label: 'Commands Used', value: data?.commandsUsed ?? 0, icon: Terminal, color: '#f59e0b' },
  ]

  return (
    <View className="flex-row flex-wrap gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex-1 min-w-36 gap-2">
          <stat.icon size={20} color={stat.color} />
          <Text className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</Text>
          <Text className="text-xs" style={{ color: '#8889a0' }}>{stat.label}</Text>
        </Card>
      ))}
    </View>
  )
}
