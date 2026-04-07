import { useChannelStore } from '@/stores/useChannelStore'
import { useShallow } from 'zustand/react/shallow'

export function useChannel() {
  const { currentChannel, channels, loading, fetchChannels, selectChannel } = useChannelStore(
    useShallow((s) => ({
      currentChannel: s.currentChannel,
      channels: s.channels,
      loading: s.loading,
      fetchChannels: s.fetchChannels,
      selectChannel: s.selectChannel,
    })),
  )

  return {
    currentChannel,
    channelId: currentChannel?.id ?? null,
    channels,
    isLoading: loading,
    isLive: currentChannel?.isLive ?? false,
    selectChannel,
    fetchChannels,
  }
}
