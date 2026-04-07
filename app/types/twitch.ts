export interface TwitchUser {
  id: string
  login: string
  display_name: string
  profile_image_url: string
  email?: string
}

export interface TwitchStream {
  id: string
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  title: string
  viewer_count: number
  started_at: string
  thumbnail_url: string
  tags: string[]
}

export interface TwitchCategory {
  id: string
  name: string
  box_art_url: string
}

export interface TwitchEmote {
  id: string
  name: string
  format: string[]
  scale: string[]
  theme_mode: string[]
}

export interface TwitchBadge {
  set_id: string
  versions: Array<{
    id: string
    image_url_1x: string
    image_url_2x: string
    image_url_4x: string
    title: string
  }>
}
