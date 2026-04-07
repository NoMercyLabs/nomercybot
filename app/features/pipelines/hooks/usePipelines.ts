import { useApiQuery, useApiMutation } from '@/hooks/useApi'
import type { Pipeline } from '@/types/pipeline'

export function usePipelines() {
  const query = useApiQuery<Pipeline[]>('pipelines', '/pipelines')

  const createMutation = useApiMutation<Pipeline, Partial<Pipeline>>('/pipelines', 'post', {
    invalidateKeys: ['pipelines'],
    successMessage: 'Pipeline created',
  })

  const updateMutation = useApiMutation<Pipeline, Partial<Pipeline> & { id: string }>('/pipelines', 'put', {
    invalidateKeys: ['pipelines'],
    successMessage: 'Pipeline saved',
  })

  const deleteMutation = useApiMutation<void, string>('/pipelines', 'delete', {
    invalidateKeys: ['pipelines'],
    successMessage: 'Pipeline deleted',
  })

  return {
    pipelines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPipeline: createMutation.mutateAsync,
    updatePipeline: updateMutation.mutateAsync,
    deletePipeline: deleteMutation.mutateAsync,
  }
}
