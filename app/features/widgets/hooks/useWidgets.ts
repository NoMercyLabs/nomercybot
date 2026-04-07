import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChannelStore } from '@/stores/useChannelStore'
import { widgetsApi } from '../api'
import type { WidgetCreate, WidgetUpdate } from '../types'

export function useWidgets() {
  const qc = useQueryClient()
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data: widgets = [], isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['widgets', channelId],
    queryFn: () => widgetsApi.list(channelId!),
    enabled: !!channelId,
  })

  const createMutation = useMutation({
    mutationFn: (data: WidgetCreate) => widgetsApi.create(channelId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets', channelId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WidgetUpdate }) =>
      widgetsApi.update(channelId!, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets', channelId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => widgetsApi.delete(channelId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['widgets', channelId] }),
  })

  return {
    widgets,
    isLoading,
    isError,
    isRefetching,
    refetch,
    createWidget: createMutation.mutateAsync,
    updateWidget: (id: string, data: WidgetUpdate) => updateMutation.mutateAsync({ id, data }),
    deleteWidget: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  }
}

export function useWidget(id: string) {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  return useQuery({
    queryKey: ['widgets', channelId, id],
    queryFn: () => widgetsApi.get(channelId!, id),
    enabled: !!channelId && !!id && id !== 'new',
  })
}
