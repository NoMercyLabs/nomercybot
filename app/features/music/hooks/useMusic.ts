import { useSignalR } from '@/hooks/useSignalR'
import { useChannelStore } from '@/stores/useChannelStore'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function useMusic() {
  const { on, off, status } = useSignalR()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (status !== 'connected') return

    on('NowPlayingChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['music', 'now-playing', channelId] })
    })
    on('QueueUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['music', 'queue', channelId] })
    })

    return () => {
      off('NowPlayingChanged')
      off('QueueUpdated')
    }
  }, [status, channelId, on, off, queryClient])
}
