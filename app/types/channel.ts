export interface Channel {
  id: string
  /** Twitch login name */
  login: string
  displayName: string
  profileImageUrl?: string | null
  isLive: boolean
  role?: string
  viewerCount?: number | null
  overlayToken?: string | null
  // Optional fields from detailed endpoint
  botEnabled?: boolean
  title?: string
  gameName?: string
  startedAt?: string
  createdAt?: string
  /** Twitch numeric user ID (alias for id in some contexts) */
  twitchId?: string
  /** Broadcaster ID used by Twitch API */
  broadcasterId?: string
  /** Whether this channel has been onboarded to NomercyBot */
  isOnboarded?: boolean
}

export interface ChannelConfig {
  prefix: string
  locale: string
  ttsEnabled: boolean
  moderationEnabled: boolean
  loyaltyEnabled: boolean
}
