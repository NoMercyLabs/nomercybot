import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/compound/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Plus } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import type { Pipeline } from '@/types/pipeline'

export function PipelinesScreen() {
  const { t } = useFeatureTranslation('pipelines')
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading, isError } = useQuery<Pipeline[]>({
    queryKey: ['pipelines', channelId],
    queryFn: () => apiClient.get(`/v1/channels/${channelId}/pipelines`).then((r) => r.data),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const columns = [
    { key: 'name', title: 'Name', render: (v: string) => <Text className="text-sm text-white">{v}</Text> },
    { key: 'trigger', title: 'Trigger', render: (v: string) => <Badge variant="info" label={v} /> },
    { key: 'isEnabled', title: 'Status', render: (v: boolean) => <Badge variant={v ? 'success' : 'muted'} label={v ? 'Active' : 'Inactive'} />, width: 90 },
  ]

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title={t('title')}
          rightContent={
            <Button
              size="sm"
              onPress={() => router.push('/(dashboard)/pipelines/new' as any)}
              leftIcon={<Plus size={14} color="white" />}
              label={t('addNew')}
            />
          }
        />
        <DataTable
          columns={columns}
          data={data ?? []}
          keyExtractor={(p) => String(p.id)}
          isLoading={showSkeleton}
          onRowPress={(p) => router.push(`/(dashboard)/pipelines/${p.id}` as any)}
          emptyMessage={t('empty.title')}
        />
      </View>
    </ErrorBoundary>
  )
}
