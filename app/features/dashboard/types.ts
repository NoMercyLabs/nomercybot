export interface TopCommand {
  name: string
  uses: number
}

export interface DashboardStats {
  viewerCount: number
  followerCount: number
  subscriberCount: number
  commandsUsed: number
  messagesCount: number
  isLive: boolean
  streamTitle?: string
  gameName?: string
  language?: string
  uptime?: number
  topCommands?: TopCommand[]
}

export interface ActivityEvent {
  id: string
  type: 'follow' | 'subscribe' | 'raid' | 'cheer' | 'command' | 'redemption'
  userId: string
  displayName: string
  data: Record<string, unknown>
  timestamp: string
}
