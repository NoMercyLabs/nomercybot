export type WidgetType =
  | 'alert'
  | 'chat'
  | 'goal'
  | 'leaderboard'
  | 'nowplaying'
  | 'eventlist'
  | 'counter'
  | 'custom'

export interface Widget {
  id: string
  name: string
  type: WidgetType
  isEnabled: boolean
  overlayUrl?: string
  settings: Record<string, unknown>
  eventSubscriptions: string[]
  createdAt: string
  updatedAt: string
}

export interface WidgetCreate {
  name: string
  type: WidgetType
  settings?: Record<string, unknown>
  eventSubscriptions?: string[]
}

export interface WidgetUpdate {
  name?: string
  settings?: Record<string, unknown>
  eventSubscriptions?: string[]
  isEnabled?: boolean
}

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  alert: 'Alert Overlay',
  chat: 'Chat Overlay',
  goal: 'Goal Widget',
  leaderboard: 'Leaderboard',
  nowplaying: 'Now Playing',
  eventlist: 'Event List',
  counter: 'Counter',
  custom: 'Custom HTML',
}

export const WIDGET_TYPE_DESCRIPTIONS: Record<WidgetType, string> = {
  alert: 'Animated alerts for follows, subs, and raids',
  chat: 'Styled chat overlay for your stream',
  goal: 'Sub/follower goal progress bar',
  leaderboard: 'Top chatters or gifters leaderboard',
  nowplaying: 'Currently playing song display',
  eventlist: 'Recent events ticker',
  counter: 'Adjustable numeric counter',
  custom: 'Custom HTML/CSS/JS widget',
}
