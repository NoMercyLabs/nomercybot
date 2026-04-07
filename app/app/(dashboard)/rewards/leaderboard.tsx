import { ScrollView, View, Text, RefreshControl } from 'react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { useApiQuery } from '@/hooks/useApi'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  points: number
}

export default function LeaderboardScreen() {
  const { data: entries, isLoading, isRefetching, refetch } = useApiQuery<LeaderboardEntry[]>('leaderboard', '/rewards/leaderboard')

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader title="Leaderboard" backHref="/(dashboard)/rewards" />
        <View className="px-5 py-4 gap-3">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
            : entries?.map((e) => (
                <View
                  key={e.userId}
                  className="flex-row items-center gap-4 rounded-xl px-4 py-3"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Text
                    className="text-2xl font-bold w-8"
                    style={{ color: e.rank <= 3 ? '#a78bfa' : '#3a3b4f' }}
                  >
                    #{e.rank}
                  </Text>
                  <Text className="flex-1 font-medium text-white">{e.displayName}</Text>
                  <Text className="font-semibold" style={{ color: '#a78bfa' }}>
                    {e.points.toLocaleString()}
                  </Text>
                </View>
              ))}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
