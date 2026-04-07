import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Hash } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface AdminChannel {
  id: string
  displayName: string
  login: string
  isLive: boolean
  isActive: boolean
  viewerCount: number
  plan: string
  createdAt: string
}

export default function AdminChannelsScreen() {
  const { data: channels, isLoading, isRefetching, refetch } = useQuery<AdminChannel[]>({
    queryKey: ['admin', 'channels'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AdminChannel[] }>('/v1/admin/channels')
      return res.data.data
    },
  })

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Channels"
          subtitle={!isLoading ? `${channels?.length ?? 0} total` : undefined}
        />

        <View className="px-5 pt-4 gap-3">
          {isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </View>
          ) : !channels?.length ? (
            <EmptyState
              icon={<Hash size={40} color="#3a3b4f" />}
              title="No channels"
              message="No channels have been registered yet."
            />
          ) : (
            channels.map((ch) => (
              <View
                key={ch.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-semibold text-white">{ch.displayName}</Text>
                      {ch.isLive && <Badge variant="danger" label="LIVE" />}
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>@{ch.login}</Text>
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>Plan: {ch.plan}</Text>
                      {ch.isLive && (
                        <Text className="text-xs" style={{ color: '#5a5b72' }}>
                          {ch.viewerCount.toLocaleString()} viewers
                        </Text>
                      )}
                    </View>
                  </View>
                  <Badge
                    variant={ch.isActive ? 'success' : 'muted'}
                    label={ch.isActive ? 'Active' : 'Inactive'}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
