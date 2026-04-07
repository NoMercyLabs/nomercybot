/** Returned by the list endpoint — lightweight, no messages array. */
export interface TimerListItem {
  id: number
  name: string
  intervalMinutes: number
  isEnabled: boolean
  lastFiredAt?: string
  messageCount: number
  createdAt: string
}

/** Returned by the detail endpoint — full timer with messages. */
export interface Timer {
  id: number
  name: string
  messages: string[]
  intervalMinutes: number
  minChatActivity: number
  isEnabled: boolean
  lastFiredAt?: string
  nextMessageIndex: number
  createdAt: string
  updatedAt: string
}

export interface TimerCreate {
  name: string
  messages: string[]
  intervalMinutes: number
  minChatActivity?: number
  isEnabled?: boolean
}

export interface TimerUpdate {
  name?: string
  messages?: string[]
  intervalMinutes?: number
  minChatActivity?: number
  isEnabled?: boolean
}
