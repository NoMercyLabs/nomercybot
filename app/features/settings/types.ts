/** Matches ChannelDto from the backend. */
export interface ChannelSettings {
  id: string
  name: string
  displayName: string
  profileImageUrl: string | null
  isLive: boolean
  isOnboarded: boolean
  language: string | null
  botJoinedAt: string | null
  subscriptionTier: string
  botPrefix?: string
  autoJoin?: boolean
  whisperResponses?: boolean
  overlayToken?: string
  overlayShowAlerts?: boolean
  overlayAlertDuration?: number
}

/** Matches FeatureStatusDto from the backend. */
export interface FeatureStatus {
  featureKey: string
  isEnabled: boolean
  enabledAt: string | null
  requiredScopes: string[]
}

/** Payload for PUT /channels/{id} — only settable fields. */
export interface UpdateChannelPayload {
  locale?: string
  autoJoin?: boolean
  botPrefix?: string
  whisperResponses?: boolean
  overlayShowAlerts?: boolean
  overlayAlertDuration?: number
}

export const FEATURE_KEYS = {
  MODERATION: 'moderation',
  MUSIC: 'music',
  PIPELINES: 'pipelines',
  TTS: 'tts',
} as const
