export interface User {
  /** Twitch user ID (also the primary key in the backend). */
  id: string
  /** Twitch login name (lowercase). */
  username: string
  /** Twitch display name. */
  displayName: string
  profileImageUrl: string | null
  /** Twitch chat color hex (e.g. "#FF0000"). */
  color: string | null
  broadcasterType: string
  isAdmin: boolean
  createdAt: string
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export type Permission =
  | 'commands.view'
  | 'commands.edit'
  | 'commands.delete'
  | 'rewards.edit'
  | 'chat.send'
  | 'moderation.ban'
  | 'moderation.timeout'
  | 'settings.manage'
  | 'pipelines.edit'
  | 'widgets.edit'
  | 'music.control'
  | 'stream.update'
  | 'admin'
