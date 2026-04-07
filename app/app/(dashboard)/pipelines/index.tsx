import { ScrollView, View, Text, Pressable, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePaginatedQuery } from '@/hooks/useApi'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import type { PipelineListItem } from '@/types/pipeline'

export default function PipelinesScreen() {
  const router = useRouter()
  const { data: response, isLoading, isRefetching, refetch } = usePaginatedQuery<PipelineListItem>('pipelines', '/pipelines', 1, 25)
  const pipelines = response?.data

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Pipelines"
          rightContent={
            <Button
              size="sm"
              onPress={() => router.push('/(dashboard)/pipelines/new' as any)}
              leftIcon={<Plus size={14} color="white" />}
              label="New"
            />
          }
        />
        <View className="px-5 py-4 gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : !pipelines || pipelines.length === 0 ? (
            <View className="flex-1 items-center justify-center" style={{ paddingTop: 64, paddingBottom: 64 }}>
              {/* Illustration */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: 'rgba(124,58,237,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(124,58,237,0.18)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={24} color="#7C3AED" />
                </View>
              </View>
              <Text
                className="font-semibold"
                style={{ fontSize: 18, color: '#f4f5fa', marginBottom: 8, textAlign: 'center' }}
              >
                No pipelines yet
              </Text>
              <Text
                className="text-center"
                style={{ fontSize: 14, color: '#8889a0', marginBottom: 24, maxWidth: 300, lineHeight: 22 }}
              >
                Pipelines let you automate bot actions based on chat events, rewards, and triggers.
                Build your first one to get started.
              </Text>
              <Button
                size="md"
                onPress={() => router.push('/(dashboard)/pipelines/new' as any)}
                leftIcon={<Plus size={14} color="white" />}
                label="Create your first pipeline"
              />
            </View>
          ) : pipelines.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/(dashboard)/pipelines/${String(p.id)}` as any)}
                >
                  <View
                    className="rounded-xl p-4 gap-2"
                    style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-medium text-white">{p.name}</Text>
                      <Badge label={p.isEnabled ? 'Active' : 'Disabled'} variant={p.isEnabled ? 'success' : 'secondary'} />
                    </View>
                    {p.description && (
                      <Text className="text-sm" style={{ color: '#8889a0' }}>{p.description}</Text>
                    )}
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>
                      {p.triggerCount} trigger{p.triggerCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </Pressable>
              ))}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
