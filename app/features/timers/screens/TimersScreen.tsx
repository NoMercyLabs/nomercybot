import { View, ScrollView, RefreshControl } from 'react-native'
import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import { TimerCard } from '../components/TimerCard'
import { useTimers } from '../hooks/useTimers'
import { useToast } from '@/hooks/useToast'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'

export function TimersScreen() {
  const { timers, isLoading, isError, isRefetching, refetch, toggleTimer } = useTimers()
  const toast = useToast()
  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut
  const activeCount = timers.filter((t) => t.isEnabled).length

  async function handleToggle(id: number) {
    try {
      await toggleTimer(id)
    } catch {
      toast.error('Failed to update timer')
    }
  }

  return (
    <ErrorBoundary>
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <PageHeader
        title="Timers"
        subtitle={`${activeCount} active`}
        rightContent={
          <Button
            size="sm"
            onPress={() => router.push('/(dashboard)/timers/new' as any)}
            leftIcon={<Plus size={14} color="white" />}
            label="Add Timer"
          />
        }
      />
      <FeatureDisabledBanner featureKey="timers" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {showSkeleton ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </View>
        ) : timers.length === 0 ? (
          <EmptyState
            title="No timers yet"
            message="Create a timer to automatically post messages at set intervals."
            actionLabel="Create Timer"
            onAction={() => router.push('/(dashboard)/timers/new' as any)}
          />
        ) : (
          timers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onPress={() => router.push(`/(dashboard)/timers/${timer.id}` as any)}
              onToggle={() => handleToggle(timer.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
    </ErrorBoundary>
  )
}
