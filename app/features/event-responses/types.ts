export interface EventResponseListItem {
  id: number
  eventType: string
  isEnabled: boolean
  responseType: EventResponseType
  updatedAt: string
}

export type EventResponseType = 'chat_message' | 'overlay' | 'pipeline' | 'none'

export interface EventResponseConfig {
  id: number
  eventType: string
  isEnabled: boolean
  responseType: EventResponseType
  message: string | null
  pipelineJson: string | null
  metadata: Record<string, string>
  createdAt: string
  updatedAt: string
}

export interface UpdateEventResponseRequest {
  isEnabled?: boolean
  responseType?: EventResponseType
  message?: string
  pipelineJson?: string
  metadata?: Record<string, string>
}

// Well-known Twitch event types with friendly labels
export const KNOWN_EVENT_TYPES: { eventType: string; label: string; description: string }[] = [
  { eventType: 'channel.follow', label: 'New Follow', description: 'Someone follows the channel' },
  { eventType: 'channel.subscribe', label: 'New Subscription', description: 'Someone subscribes' },
  { eventType: 'channel.subscription.gift', label: 'Gift Subscription', description: 'Someone gifts a subscription' },
  { eventType: 'channel.subscription.message', label: 'Resub Message', description: 'Resubscription with message' },
  { eventType: 'channel.cheer', label: 'Bits Cheer', description: 'Someone cheers with bits' },
  { eventType: 'channel.raid', label: 'Raid', description: 'Another streamer raids the channel' },
  { eventType: 'channel.channel_points_custom_reward_redemption.add', label: 'Channel Point Redemption', description: 'Custom reward redeemed' },
  { eventType: 'stream.online', label: 'Stream Online', description: 'Stream goes live' },
  { eventType: 'stream.offline', label: 'Stream Offline', description: 'Stream ends' },
]
