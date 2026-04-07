export interface AutomodConfig {
  linkFilter: {
    enabled: boolean
    whitelist: string[]
  }
  capsFilter: {
    enabled: boolean
    threshold: number
  }
  bannedPhrases: {
    enabled: boolean
    phrases: string[]
  }
  emoteSpam: {
    enabled: boolean
    maxEmotes: number
  }
}

export interface ModerationBan {
  userId: string
  username: string
  reason?: string
  bannedBy: string
  bannedAt: string
}

export type ModLogAction = 'ban' | 'unban' | 'timeout' | 'delete'

export interface ModLogEntry {
  id: string
  action: ModLogAction
  moderator: string
  target: string
  reason?: string
  timestamp: string
  duration?: number
}
