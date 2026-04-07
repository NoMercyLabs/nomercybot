import type { ChatFragment, ChatBadge, ChatMessageType } from '@/types/signalr'

export type { ChatFragment, ChatBadge, ChatMessageType }

export interface ChatMessage {
  id: string
  channelId: string
  userId: string
  username: string
  displayName: string
  userType: 'viewer' | 'subscriber' | 'vip' | 'moderator' | 'broadcaster'
  /** Twitch user color hex (e.g. "#FF0000") */
  color: string
  /** Plain-text fallback (all fragment texts joined) */
  message: string
  badges: ChatBadge[]
  fragments: ChatFragment[]
  messageType: ChatMessageType
  isCommand: boolean
  isCheer: boolean
  bitsAmount?: number
  replyToMessageId?: string
  timestamp: string
}

export interface ChatSettings {
  slowMode: boolean
  slowModeDelay: number
  subscriberOnly: boolean
  emotesOnly: boolean
  followersOnly: boolean
  followersOnlyDuration: number
}
