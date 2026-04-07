export type PermissionLevel = 'everyone' | 'subscriber' | 'vip' | 'moderator' | 'broadcaster'

export type CommandType = 'text' | 'pipeline'

/** Matches backend CommandListItem — returned by the paginated list endpoint. */
export interface CommandListItem {
  id: number
  name: string
  type: CommandType
  permission: PermissionLevel
  isEnabled: boolean
  cooldownSeconds: number
  description?: string
  aliases: string[]
  usageCount: number
  createdAt: string
}

/** Matches backend CommandDto — returned by get/create/update endpoints. */
export interface Command {
  id: number
  name: string
  type: CommandType
  permission: PermissionLevel
  isEnabled: boolean
  response?: string
  responses?: string[]
  pipeline?: object | null
  cooldownSeconds: number
  cooldownPerUser: boolean
  replyTo?: boolean
  description?: string
  aliases: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

/** Matches backend CreateCommandDto. */
export interface CommandCreate {
  name: string
  type?: CommandType
  response?: string
  responses?: string[]
  pipeline?: object
  cooldownSeconds?: number
  cooldownPerUser?: boolean
  replyTo?: boolean
  permission?: PermissionLevel
  aliases?: string[]
  description?: string
  isEnabled?: boolean
}

/** Matches backend UpdateCommandDto — all fields optional. */
export interface CommandUpdate extends Partial<Omit<CommandCreate, 'name'>> {
  isEnabled?: boolean
}
