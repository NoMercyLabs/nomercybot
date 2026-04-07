import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSignalR } from './useSignalR'
import { useChannelStore } from '@/stores/useChannelStore'

export function useRealtimeChannel() {
  const { connect, invoke, on, off, status } = useSignalR()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const updateFromRealtime = useChannelStore((s) => s.updateFromRealtime)
  const queryClient = useQueryClient()
  const currentGroupRef = useRef<string | null>(null)

  useEffect(() => {
    connect()
  }, [connect])

  // Join/leave channel group
  useEffect(() => {
    if (status !== 'connected' || !channelId) return

    const join = async () => {
      try {
        if (currentGroupRef.current) {
          await invoke('LeaveChannel', currentGroupRef.current).catch(() => {})
        }
        await invoke('JoinChannel', channelId)
        currentGroupRef.current = channelId
      } catch {
        // Connection may have dropped between status check and invoke — will retry on reconnect
      }
    }

    join()

    return () => {
      if (currentGroupRef.current) {
        invoke('LeaveChannel', currentGroupRef.current).catch(() => {})
        currentGroupRef.current = null
      }
    }
  }, [status, channelId, invoke])

  // Register event handlers
  useEffect(() => {
    if (status !== 'connected') return

    on('ChannelUpdated', (data) => { updateFromRealtime(data) })
    on('ChannelWentLive', () => { updateFromRealtime({ isLive: true }) })
    on('ChannelWentOffline', () => { updateFromRealtime({ isLive: false, viewerCount: 0 }) })

    on('CommandUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'commands'] })
    })
    on('CommandDeleted', () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'commands'] })
    })
    on('NowPlayingChanged', (data) => {
      queryClient.setQueryData(['channel', channelId, 'now-playing'], data.track)
    })
    on('QueueUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'queue'] })
    })
    on('BotStatus', (data) => {
      queryClient.setQueryData(['channel', channelId, 'bot-status'], data)
    })
    on('StreamStatusChanged', (data) => {
      updateFromRealtime({
        isLive: data.isLive,
        viewerCount: data.viewerCount ?? 0,
        title: data.title,
        gameName: data.gameName,
      })
    })

    return () => {
      off('ChannelUpdated')
      off('ChannelWentLive')
      off('ChannelWentOffline')
      off('CommandUpdated')
      off('CommandDeleted')
      off('NowPlayingChanged')
      off('QueueUpdated')
      off('BotStatus')
      off('StreamStatusChanged')
    }
  }, [status, channelId, on, off, queryClient, updateFromRealtime])

  return { status }
}
