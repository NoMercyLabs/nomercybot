import { useState, useEffect, useCallback } from 'react'
import { useSignalR } from '@/hooks/useSignalR'
import { useChannelStore } from '@/stores/useChannelStore'
import type { ActivityEvent } from '../types'

// ChannelEvent.type values the backend sends → ActivityEvent.type we display
const CHANNEL_EVENT_TYPE_MAP: Record<string, ActivityEvent['type'] | undefined> = {
  follow: 'follow',
  subscription: 'subscribe',
  resub: 'subscribe',
  gift_sub: 'subscribe',
  cheer: 'cheer',
  raid: 'raid',
}

function extractDisplayName(type: string, data: Record<string, unknown>): string {
  if (type === 'raid') return String(data.fromDisplayName ?? data.displayName ?? 'Unknown')
  return String(data.displayName ?? 'Unknown')
}

export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const { on, off, status } = useSignalR()
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const pushEvent = useCallback((event: ActivityEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    if (status !== 'connected' || !channelId) return

    // ── ChannelEvent: follow / sub / resub / gift_sub / cheer / raid ──────────
    // ChannelEventPayload.broadcasterId is defined in the type map as broadcasterId.
    on('ChannelEvent', (payload) => {
      if (payload.broadcasterId !== channelId) return

      const type = payload.type
      const mapped = CHANNEL_EVENT_TYPE_MAP[type]
      if (!mapped) return

      const data = (payload.data ?? {}) as Record<string, unknown>
      pushEvent({
        id: `${payload.timestamp}-${type}-${payload.userId ?? 'anon'}`,
        type: mapped,
        userId: payload.userId ?? '',
        displayName: extractDisplayName(type, data),
        data,
        timestamp: payload.timestamp,
      })
    })

    // ── CommandExecuted ────────────────────────────────────────────────────────
    on('CommandExecuted', (payload) => {
      if (payload.broadcasterId !== channelId) return
      if (!payload.succeeded) return // only show successful commands

      pushEvent({
        id: `${payload.timestamp}-cmd-${payload.commandName}`,
        type: 'command',
        userId: payload.triggeredByUserId,
        displayName: payload.triggeredByUserId,
        data: { commandName: payload.commandName },
        timestamp: payload.timestamp,
      })
    })

    // ── RewardRedeemed ────────────────────────────────────────────────────────
    on('RewardRedeemed', (payload) => {
      if (payload.broadcasterId !== channelId) return

      pushEvent({
        id: `${payload.timestamp}-reward-${payload.redemptionId}`,
        type: 'redemption',
        userId: payload.userId,
        displayName: payload.userDisplayName,
        data: {
          rewardTitle: payload.rewardTitle,
          cost: payload.cost,
          userInput: payload.userInput,
        },
        timestamp: payload.timestamp,
      })
    })

    return () => {
      off('ChannelEvent')
      off('CommandExecuted')
      off('RewardRedeemed')
    }
  }, [status, channelId, on, off, pushEvent])

  return { events }
}
