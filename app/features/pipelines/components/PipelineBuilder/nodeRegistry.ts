import type { NodeCategory, ConfigField } from '@/types/pipeline'

export interface NodeDefinition {
  nodeType: string
  label: string
  category: NodeCategory
  description: string
  defaultConfig: Record<string, unknown>
  configSchema: ConfigField[]
}

export const NODE_REGISTRY: NodeDefinition[] = [
  // Triggers
  {
    nodeType: 'chat.message',
    label: 'Chat Message',
    category: 'trigger',
    description: 'Fires when a chat message is received',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'channel.follow',
    label: 'New Follow',
    category: 'trigger',
    description: 'Fires when someone follows the channel',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'channel.subscription',
    label: 'Subscription',
    category: 'trigger',
    description: 'Fires when someone subscribes or resubscribes',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'channel.cheer',
    label: 'Cheer (Bits)',
    category: 'trigger',
    description: 'Fires when someone cheers with bits',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'channel.raid',
    label: 'Raid',
    category: 'trigger',
    description: 'Fires when the channel is raided',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'channel.channel_points_custom_reward_redemption.add',
    label: 'Channel Point Redemption',
    category: 'trigger',
    description: 'Fires when a viewer redeems a channel point reward',
    defaultConfig: {},
    configSchema: [],
  },

  // Conditions
  {
    nodeType: 'user_role',
    label: 'User Role Check',
    category: 'condition',
    description: 'Only proceed if the user meets the minimum role requirement',
    defaultConfig: { min_role: 'viewer' },
    configSchema: [
      {
        key: 'min_role',
        label: 'Minimum Role',
        type: 'select',
        options: [
          { label: 'Viewer', value: 'viewer' },
          { label: 'Subscriber', value: 'subscriber' },
          { label: 'VIP', value: 'vip' },
          { label: 'Moderator', value: 'moderator' },
          { label: 'Broadcaster', value: 'broadcaster' },
        ],
        required: true,
      },
    ],
  },
  {
    nodeType: 'random',
    label: 'Random Chance',
    category: 'condition',
    description: 'Proceed with a random percentage chance',
    defaultConfig: { percent: 50 },
    configSchema: [
      {
        key: 'percent',
        label: 'Chance (%)',
        type: 'number',
        placeholder: '50',
        required: true,
      },
    ],
  },
  {
    nodeType: 'variable_equals',
    label: 'Variable Check',
    category: 'condition',
    description: 'Compare a pipeline variable against a value',
    defaultConfig: { variable: '', value: '', operator: 'equals' },
    configSchema: [
      {
        key: 'variable',
        label: 'Variable Name',
        type: 'text',
        placeholder: 'counter',
        required: true,
      },
      {
        key: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Not Equals', value: 'not_equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts With', value: 'starts_with' },
          { label: 'Is Empty', value: 'is_empty' },
          { label: 'Is Not Empty', value: 'is_not_empty' },
        ],
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: '0',
      },
    ],
  },

  // Actions
  {
    nodeType: 'send_message',
    label: 'Send Message',
    category: 'action',
    description: 'Sends a message in chat. Supports {variable} template syntax.',
    defaultConfig: { message: '' },
    configSchema: [
      {
        key: 'message',
        label: 'Message',
        type: 'variable',
        placeholder: 'e.g. Welcome {user} to the stream!',
        required: true,
      },
    ],
  },
  {
    nodeType: 'send_reply',
    label: 'Send Reply',
    category: 'action',
    description: 'Replies to the triggering message in chat',
    defaultConfig: { message: '' },
    configSchema: [
      {
        key: 'message',
        label: 'Message',
        type: 'variable',
        placeholder: 'e.g. Good point, {user}!',
        required: true,
      },
    ],
  },
  {
    nodeType: 'timeout',
    label: 'Timeout User',
    category: 'action',
    description: 'Times out the triggering user for a number of seconds',
    defaultConfig: { duration: 60, reason: '' },
    configSchema: [
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'number',
        placeholder: '60',
        required: true,
      },
      {
        key: 'reason',
        label: 'Reason',
        type: 'text',
        placeholder: 'Auto-moderation',
      },
    ],
  },
  {
    nodeType: 'ban',
    label: 'Ban User',
    category: 'action',
    description: 'Bans the triggering user from the channel',
    defaultConfig: { reason: '' },
    configSchema: [
      {
        key: 'reason',
        label: 'Reason',
        type: 'text',
        placeholder: 'Violation of rules',
      },
    ],
  },
  {
    nodeType: 'wait',
    label: 'Wait',
    category: 'action',
    description: 'Pauses pipeline execution for a number of seconds (max 30)',
    defaultConfig: { seconds: 5 },
    configSchema: [
      {
        key: 'seconds',
        label: 'Seconds (max 30)',
        type: 'number',
        placeholder: '5',
        required: true,
      },
    ],
  },
  {
    nodeType: 'set_variable',
    label: 'Set Variable',
    category: 'action',
    description: 'Sets a pipeline variable to a value',
    defaultConfig: { name: '', value: '' },
    configSchema: [
      {
        key: 'name',
        label: 'Variable Name',
        type: 'text',
        placeholder: 'counter',
        required: true,
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: '0',
        required: true,
      },
    ],
  },
  {
    nodeType: 'stop',
    label: 'Stop',
    category: 'action',
    description: 'Stops pipeline execution immediately',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'delete_message',
    label: 'Delete Message',
    category: 'action',
    description: 'Deletes the message that triggered this pipeline',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'shoutout',
    label: 'Shoutout',
    category: 'action',
    description: 'Sends a /shoutout command for a user',
    defaultConfig: { cooldown_minutes: 60 },
    configSchema: [
      {
        key: 'user_id',
        label: 'User (leave blank for triggering user)',
        type: 'text',
        placeholder: '{user.id}',
      },
      {
        key: 'cooldown_minutes',
        label: 'Cooldown (minutes)',
        type: 'number',
        placeholder: '60',
      },
    ],
  },
  {
    nodeType: 'song_request',
    label: 'Song Request',
    category: 'action',
    description: 'Adds a song to the music queue',
    defaultConfig: {},
    configSchema: [],
  },
  {
    nodeType: 'song_skip',
    label: 'Skip Song',
    category: 'action',
    description: 'Skips the currently playing song',
    defaultConfig: {},
    configSchema: [],
  },
]

export function getNodeDef(nodeType: string): NodeDefinition | undefined {
  return NODE_REGISTRY.find((n) => n.nodeType === nodeType)
}

export const NODES_BY_CATEGORY = {
  trigger: NODE_REGISTRY.filter((n) => n.category === 'trigger'),
  condition: NODE_REGISTRY.filter((n) => n.category === 'condition'),
  action: NODE_REGISTRY.filter((n) => n.category === 'action'),
}
