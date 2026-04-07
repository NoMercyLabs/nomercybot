export type TrustLevel = 'viewer' | 'regular' | 'vip' | 'moderator' | 'broadcaster'

export interface CommunityUser {
  id: string
  username: string
  displayName: string
  profileImageUrl?: string
  messageCount: number
  watchHours: number
  commandsUsed: number
  trustLevel: TrustLevel
  isBanned: boolean
  firstSeen: string
  lastSeen: string
}

export interface BanRecord {
  id: string
  bannedBy: string
  reason?: string
  bannedAt: string
  unbannedAt?: string
}

export interface Activity {
  type: 'message' | 'command'
  content: string
  timestamp: string
}

export interface UserDetail extends CommunityUser {
  recentActivity: Activity[]
  banHistory: BanRecord[]
}

export interface BannedUser {
  id: string
  username: string
  displayName: string
  profileImageUrl?: string
  reason: string
  bannedBy: string
  bannedAt: string
}

export interface GetUsersParams {
  search?: string
  page?: number
  take?: number
  role?: 'follower' | 'subscriber' | 'vip' | 'moderator'
  sort?: string
  cursor?: string
}

export interface GetBansParams {
  page?: number
  take?: number
}
