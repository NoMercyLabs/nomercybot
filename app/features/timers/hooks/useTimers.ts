import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChannelStore } from '@/stores/useChannelStore'
import { timersApi } from '../api'
import type { TimerCreate, TimerUpdate } from '../types'

export function useTimers() {
  const qc = useQueryClient()
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data: timers = [], isLoading, isError, isRefetching, refetch } = useQuery({
    queryKey: ['timers', channelId],
    queryFn: () => timersApi.list(channelId!),
    enabled: !!channelId,
  })

  const createMutation = useMutation({
    mutationFn: (data: TimerCreate) => timersApi.create(channelId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timers', channelId] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: TimerUpdate }) =>
      timersApi.update(channelId!, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timers', channelId] }),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: number) => timersApi.toggle(channelId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timers', channelId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => timersApi.delete(channelId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['timers', channelId] }),
  })

  return {
    timers,
    isLoading,
    isError,
    isRefetching,
    refetch,
    createTimer: createMutation.mutateAsync,
    updateTimer: (id: number, data: TimerUpdate) => updateMutation.mutateAsync({ id, data }),
    toggleTimer: toggleMutation.mutateAsync,
    deleteTimer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}

export function useTimer(id: number | 'new') {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  return useQuery({
    queryKey: ['timers', channelId, id],
    queryFn: () => timersApi.get(channelId!, id as number),
    enabled: !!channelId && id !== 'new',
  })
}
