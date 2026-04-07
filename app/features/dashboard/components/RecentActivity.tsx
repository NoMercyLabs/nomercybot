import { View, Text, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useChannelStore } from '@/stores/useChannelStore'
import { formatDistanceToNow } from 'date-fns'

export function RecentActivity() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'activity', channelId],
    queryFn: () => apiClient.get(`/v1/dashboard/${channelId}/activity`).then((r) => r.data),
    enabled: !!channelId,
  })

  return (
    <Card>
      <CardHeader>
        <Text className="text-base font-semibold text-white">Recent Activity</Text>
      </CardHeader>
      {isLoading ? (
        <Skeleton className="h-12 w-full" count={5} />
      ) : (
        <ScrollView scrollEnabled={false}>
          {(data?.items ?? []).length === 0 ? (
            <Text className="text-sm py-4 text-center" style={{ color: '#8889a0' }}>No recent activity</Text>
          ) : (data?.items ?? []).map((item: any) => (
            <View key={item.id} className="flex-row items-center gap-3 py-2.5 border-b" style={{ borderColor: '#2a2b3a' }}>
              <View className="flex-1">
                <Text className="text-sm text-white">{item.message}</Text>
              </View>
              <Text className="text-xs" style={{ color: '#5a5b72' }}>
                {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </Card>
  )
}
