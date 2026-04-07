import { ScrollView, View, Text, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Shield } from 'lucide-react-native'

interface ModLogEntry {
  id: string
  action: string
  moderatorName: string
  targetName: string
  reason: string | null
  duration: number | null
  createdAt: string
}

const ACTION_VARIANTS: Record<string, 'danger' | 'warning' | 'success' | 'info'> = {
  ban: 'danger',
  timeout: 'warning',
  unban: 'success',
  delete: 'info',
  untimeout: 'success',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}

export default function ModerationLogScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading, isError, isRefetching, refetch } = useQuery<{ items: ModLogEntry[] }>({
    queryKey: ['moderation', 'log', channelId],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/channels/${channelId}/moderation/log`, {
        params: { page: 1, take: 50 },
      })
      return res.data
    },
    enabled: !!channelId,
  })

  const entries = data?.items ?? []

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader title="Moderation Log" subtitle="Recent moderation actions" />

        <View className="px-5 pt-4 gap-2">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : isError ? (
            <ErrorState title="Unable to load moderation log" onRetry={refetch} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Shield size={40} color="#3a3b4f" />}
              title="No moderation actions"
              message="Actions taken by moderators will appear here."
            />
          ) : (
            entries.map((entry) => (
              <View
                key={entry.id}
                className="rounded-xl px-4 py-3 flex-row items-start justify-between gap-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <View className="flex-1 gap-1">
                  <View className="flex-row items-center gap-2 flex-wrap">
                    <Badge
                      variant={ACTION_VARIANTS[entry.action] ?? 'info'}
                      label={entry.action}
                    />
                    <Text className="text-sm font-medium text-white">{entry.targetName}</Text>
                  </View>
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>
                    by {entry.moderatorName}
                    {entry.duration != null && ` · ${formatDuration(entry.duration)}`}
                  </Text>
                  {entry.reason && (
                    <Text className="text-xs" style={{ color: '#3a3b4f' }}>
                      {entry.reason}
                    </Text>
                  )}
                </View>
                <Text className="text-xs shrink-0" style={{ color: '#3a3b4f' }}>
                  {formatDate(entry.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
