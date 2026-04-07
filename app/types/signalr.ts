import type { Channel } from './channel'

// ── Shared sub-types ──────────────────────────────────────────────────────────

export interface ChatFragment {
  type: 'text' | 'emote' | 'mention' | 'cheermote'
  text: string
  emote?: {
    id: string
    format: 'static' | 'animated'
    setId: string
    scale?: '1.0' | '2.0' | '3.0'
  }
  mention?: {
    userId: string
    username: string
    displayName: string
  }
  cheermote?: {
    prefix: string
    bits: number
    tier: number
    color?: string
  }
}

export interface ChatBadge {
  setId: string
  id: string
  info?: string
}

export type ChatMessageType =
  | 'text'
  | 'channel_points_highlighted'
  | 'channel_points_sub_only'
  | 'user_intro'
  | 'gigantified_emote'
  | 'animated_message'

export interface ChatMessagePayload {
  id?: string
  channelId: string
  userId: string
  username: string
  displayName: string
  userType: 'viewer' | 'subscriber' | 'vip' | 'moderator' | 'broadcaster'
  /** Hex color from Twitch (e.g. "#FF0000") */
  color: string
  /** @deprecated Use color */
  colorHex?: string
  /** Plain-text fallback for the full message */
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

export interface ChannelEventPayload {
  id: string
  type: string
  broadcasterId: string
  userId?: string
  username?: string
  displayName?: string
  data: Record<string, unknown>
  timestamp: string
}

export interface MusicTrack {
  id: string
  title: string
  artist: string
  album: string
  albumArtUrl?: string
  durationMs: number
  requestedBy?: string
}

export interface MusicStatePayload {
  broadcasterId: string
  isPlaying: boolean
  volumePercent: number
  currentTrack: MusicTrack | null
  progressMs: number
  durationMs: number
  queue: MusicTrack[]
}

export interface ModActionPayload {
  broadcasterId: string
  moderatorId: string
  moderatorUsername: string
  action: 'ban' | 'unban' | 'timeout' | 'untimeout' | 'delete_message' | 'clear_chat'
  targetUserId?: string
  targetUsername?: string
  reason?: string
  durationSeconds?: number
  messageId?: string
  messageText?: string
  timestamp: string
}

export interface StreamStatusPayload {
  broadcasterId: string
  isLive: boolean
  title?: string
  gameId?: string
  gameName?: string
  tags?: string[]
  viewerCount?: number
  startedAt?: string
}

export interface AlertPayload {
  broadcasterId: string
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
  details?: Record<string, string>
  timestamp: string
}

export interface BotStatusPayload {
  status: 'running' | 'stopped' | 'error'
  message?: string
}

// ── DashboardHub (/hubs/dashboard) ───────────────────────────────────────────
// Real-time events sent by the backend DashboardHub to authenticated dashboard clients.

export interface DashboardHubEventMap {
  // Chat
  ChatMessage: ChatMessagePayload
  MessageDeleted: { channelId: string; messageId: string; deletedBy?: string }
  UserBanned: { channelId: string; userId: string; username: string; reason?: string }
  UserTimedOut: { channelId: string; userId: string; username: string; durationSeconds: number; reason?: string }

  // Channel state
  ChannelEvent: ChannelEventPayload
  ChannelUpdated: Partial<Channel>
  ChannelWentLive: { channelId: string; startedAt: string }
  ChannelWentOffline: { channelId: string }

  // Stream
  StreamStatusChanged: StreamStatusPayload

  // Music
  MusicStateChanged: MusicStatePayload
  NowPlayingChanged: { channelId: string; track: MusicTrack | null }
  QueueUpdated: { channelId: string; queueLength: number }

  // Moderation
  ModAction: ModActionPayload

  // Commands
  CommandExecuted: {
    broadcasterId: string
    commandName: string
    triggeredByUserId: string
    succeeded: boolean
    timestamp: string
  }
  CommandUpdated: { id: string; name: string }
  CommandDeleted: { id: string }

  // Rewards
  RewardRedeemed: {
    broadcasterId: string
    redemptionId: string
    rewardId: string
    rewardTitle: string
    cost: number
    userId: string
    userDisplayName: string
    userInput?: string
    timestamp: string
  }

  // Pipelines
  PipelineExecuted: {
    pipelineId: string
    channelId: string
    status: 'success' | 'error'
    duration: number
    errorMessage?: string
  }

  // Permissions
  PermissionChanged: {
    broadcasterId: string
    action: 'created' | 'updated' | 'deleted'
    subjectType: 'user' | 'role'
    subjectId: string
    resourceType: string
    resourceId?: string
    permission: string
  }

  // System
  AlertTriggered: AlertPayload
  BotStatus: BotStatusPayload
  NewEvent: { id: string; channelId: string; type: string; data: Record<string, unknown>; timestamp: string }
}

/** Methods the client can invoke on DashboardHub */
export interface DashboardHubMethods {
  JoinChannel: (broadcasterId: string) => Promise<void>
  LeaveChannel: (broadcasterId: string) => Promise<void>
  SendChatMessage: (broadcasterId: string, message: string, replyToMessageId?: string) => Promise<void>
  TriggerAction: (broadcasterId: string, actionName: string, parameters?: Record<string, string>) => Promise<void>
}

// ── OverlayHub (/hubs/overlay) ────────────────────────────────────────────────
// Events sent to browser-source overlay clients (OBS browser sources, stream overlays).
// No auth required for public overlays — uses channelToken query param instead.

export interface OverlayHubEventMap {
  /** Alert animation: follow, sub, raid, donation, bits */
  OverlayAlert: {
    type: 'follow' | 'subscription' | 'raid' | 'donation' | 'bits' | 'custom'
    username: string
    displayName: string
    message?: string
    amount?: number
    /** Alert preset / widget ID to use */
    widgetId?: string
    durationMs: number
    timestamp: string
  }

  /** Now-playing track changed for music overlay widget */
  OverlayNowPlaying: {
    track: MusicTrack | null
    isPlaying: boolean
    progressMs: number
    durationMs: number
  }

  /** Goal/counter widget updated */
  OverlayGoalUpdated: {
    widgetId: string
    label: string
    current: number
    target: number
    unit?: string
  }

  /** Leaderboard widget updated */
  OverlayLeaderboardUpdated: {
    widgetId: string
    entries: Array<{ rank: number; username: string; displayName: string; score: number }>
  }

  /** Chat widget — filtered/styled message for overlay */
  OverlayChatMessage: ChatMessagePayload

  /** Stream title/category changed */
  OverlayStreamUpdated: {
    title: string
    gameName: string
    isLive: boolean
    viewerCount: number
  }

  /** Custom widget data push */
  OverlayCustomData: {
    widgetId: string
    data: Record<string, unknown>
  }

  /** Channel points redemption for interactive overlays */
  OverlayRedemption: {
    rewardTitle: string
    username: string
    userInput?: string
    timestamp: string
  }
}

/** Methods the client can invoke on OverlayHub */
export interface OverlayHubMethods {
  /** Join a channel's overlay room by channel token (no auth needed) */
  JoinOverlay: (channelToken: string) => Promise<void>
  LeaveOverlay: (channelToken: string) => Promise<void>
}

// ── OBSRelayHub (/hubs/obs-relay) ─────────────────────────────────────────────
// Bi-directional relay between the dashboard and the NoMercy OBS plugin.
// Events flow both ways: server → obs plugin (commands) and obs plugin → server (state).

export interface OBSRelayHubEventMap {
  /** OBS plugin reports current connection status */
  OBSConnected: {
    broadcasterId: string
    version: string
    platform: 'windows' | 'mac' | 'linux'
    obsVersion: string
  }

  OBSDisconnected: {
    broadcasterId: string
    reason?: string
  }

  /** Current scene list from OBS */
  OBSScenesUpdated: {
    broadcasterId: string
    currentScene: string
    scenes: Array<{ name: string; sources: string[] }>
  }

  /** Scene was switched (either by user or bot command) */
  OBSSceneSwitched: {
    broadcasterId: string
    previousScene: string
    currentScene: string
    triggeredBy: 'user' | 'automation'
  }

  /** Source visibility changed */
  OBSSourceToggled: {
    broadcasterId: string
    sceneName: string
    sourceName: string
    visible: boolean
  }

  /** Recording/streaming state changed */
  OBSStreamingStateChanged: {
    broadcasterId: string
    isStreaming: boolean
    isRecording: boolean
    timecode?: string
  }

  /** Stats from OBS (dropped frames, bitrate, etc.) */
  OBSStats: {
    broadcasterId: string
    fps: number
    cpuUsage: number
    memoryUsage: number
    droppedFrames: number
    totalFrames: number
    renderSkipped: number
    outputBitrate: number
    timestamp: string
  }

  /** OBS plugin echoes back the result of a command */
  OBSCommandResult: {
    commandId: string
    success: boolean
    error?: string
  }
}

/** Methods the client can invoke on OBSRelayHub */
export interface OBSRelayHubMethods {
  /** Switch scene in OBS */
  SwitchScene: (broadcasterId: string, sceneName: string) => Promise<void>
  /** Toggle a source's visibility */
  ToggleSource: (broadcasterId: string, sceneName: string, sourceName: string, visible: boolean) => Promise<void>
  /** Start/stop recording */
  SetRecording: (broadcasterId: string, recording: boolean) => Promise<void>
  /** Play a media source */
  PlayMedia: (broadcasterId: string, sourceName: string) => Promise<void>
  /** Send arbitrary OBS WebSocket command via the relay */
  SendOBSCommand: (broadcasterId: string, requestType: string, requestData?: Record<string, unknown>) => Promise<void>
  /** Request current OBS stats */
  RequestStats: (broadcasterId: string) => Promise<void>
}

// ── useSignalR / DashboardHub alias ──────────────────────────────────────────
// SignalREventMap is an alias for DashboardHubEventMap for backwards compatibility.

/** @alias DashboardHubEventMap */
export type SignalREventMap = DashboardHubEventMap

/** @alias DashboardHubMethods */
export type SignalRHubMethods = DashboardHubMethods
