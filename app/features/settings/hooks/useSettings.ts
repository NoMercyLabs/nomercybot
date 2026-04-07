import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChannelStore } from '@/stores/useChannelStore'
import { settingsApi } from '../api'
import type { UpdateChannelPayload, FeatureStatus } from '../types'

export function useSettings() {
  const qc = useQueryClient()
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const channelQuery = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => settingsApi.getChannel(channelId!),
    enabled: !!channelId,
  })

  const featuresQuery = useQuery({
    queryKey: ['features', channelId],
    queryFn: () => settingsApi.getFeatures(channelId!),
    enabled: !!channelId,
  })

  const updateChannelMutation = useMutation({
    mutationFn: (data: UpdateChannelPayload) =>
      settingsApi.updateChannel(channelId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['channel', channelId] }),
  })

  const toggleFeatureMutation = useMutation({
    mutationFn: (featureKey: string) =>
      settingsApi.toggleFeature(channelId!, featureKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features', channelId] }),
  })

  function getFeature(key: string): FeatureStatus | undefined {
    return featuresQuery.data?.find((f) => f.featureKey === key)
  }

  function isFeatureEnabled(key: string): boolean {
    return getFeature(key)?.isEnabled ?? false
  }

  return {
    channel: channelQuery.data,
    features: featuresQuery.data ?? [],
    isLoading: channelQuery.isLoading || featuresQuery.isLoading,
    isError: channelQuery.isError || featuresQuery.isError,
    isRefetching: channelQuery.isRefetching || featuresQuery.isRefetching,
    refetch: () => {
      channelQuery.refetch()
      featuresQuery.refetch()
    },
    updateChannel: updateChannelMutation.mutateAsync,
    toggleFeature: toggleFeatureMutation.mutateAsync,
    isUpdating: updateChannelMutation.isPending || toggleFeatureMutation.isPending,
    getFeature,
    isFeatureEnabled,
  }
}
