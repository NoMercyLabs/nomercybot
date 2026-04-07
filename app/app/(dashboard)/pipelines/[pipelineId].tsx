import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { useApiQuery } from '@/hooks/useApi'
import { useChannelStore } from '@/stores/useChannelStore'
import { PipelineBuilder } from '@/features/pipelines/components/PipelineBuilder/PipelineBuilder'
import { createPipeline, updatePipeline } from '@/features/pipelines/api'
import type { Pipeline } from '@/types/pipeline'

export default function PipelineEditorScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const channelId = useChannelStore((s) => s.currentChannel?.id ?? '')
  const { pipelineId } = useLocalSearchParams<{ pipelineId: string }>()
  const isNew = pipelineId === 'new'
  const numericId = isNew ? null : parseInt(pipelineId, 10)

  const queryKey = `pipelines/${pipelineId}`

  const { data: pipeline } = useApiQuery<Pipeline>(
    queryKey,
    `/pipelines/${pipelineId}`,
    { enabled: !isNew && numericId !== null && !isNaN(numericId) },
  )

  async function handleSave(updated: Pipeline) {
    if (isNew) {
      await createPipeline(channelId, updated)
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'pipelines'] })
      router.push('/(dashboard)/pipelines' as any)
    } else if (numericId !== null) {
      await updatePipeline(channelId, numericId, updated)
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'pipelines'] })
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, queryKey] })
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <PageHeader
        title={isNew ? 'New Pipeline' : (pipeline?.name ?? 'Pipeline')}
        backHref="/(dashboard)/pipelines"
      />
      <View className="flex-1">
        <PipelineBuilder pipeline={isNew ? undefined : pipeline} onSave={handleSave} />
      </View>
    </View>
  )
}
