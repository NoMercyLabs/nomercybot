import { View, Text, ScrollView } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { PipelineBuilder } from '@/features/pipelines/components/PipelineBuilder'
import type { PipelineGraph } from '@/types/pipeline'

export function PipelineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useFeatureTranslation('pipelines')
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const qc = useQueryClient()
  const isNew = id === 'new'

  const { data, isLoading } = useQuery({
    queryKey: ['pipelines', channelId, id],
    queryFn: () => apiClient.get(`/v1/channels/${channelId}/pipelines/${id}`).then((r) => r.data),
    enabled: !!channelId && !isNew,
  })

  const saveMutation = useMutation({
    mutationFn: (graph: PipelineGraph) =>
      isNew
        ? apiClient.post(`/v1/channels/${channelId}/pipelines`, { graph })
        : apiClient.put(`/v1/channels/${channelId}/pipelines/${id}`, { graph }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', channelId] })
      router.back()
    },
  })

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <View className="px-4 pt-4">
          <PageHeader
            title={isNew ? 'New Pipeline' : (data?.name ?? 'Pipeline')}
            showBack
          />
        </View>
        <PipelineBuilder
          pipeline={data}
          onSave={(pipeline) => saveMutation.mutate(pipeline.graph)}
        />
      </View>
    </ErrorBoundary>
  )
}
