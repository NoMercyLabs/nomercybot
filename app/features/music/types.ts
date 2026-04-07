export interface NowPlaying {
  trackName: string
  artist: string
  album?: string
  imageUrl?: string
  durationMs: number
  progressMs: number
  isPlaying: boolean
  volume: number
  requestedBy?: string
  provider: string
}

export interface QueueItem {
  position: number
  trackName: string
  artist: string
  imageUrl?: string
  durationMs: number
  requestedBy?: string
}

/** Matches MusicConfigDto from the backend */
export interface MusicConfig {
  isEnabled: boolean
  preferredProvider: string
  maxQueueSize: number
  maxRequestsPerUser: number
  allowYouTube: boolean
  allowSpotify: boolean
  minTrustLevel: string
}
