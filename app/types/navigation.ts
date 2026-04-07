export type RootStackParamList = {
  '(auth)': undefined
  '(dashboard)': undefined
  '(public)': undefined
  'admin': undefined
  '+not-found': undefined
}

export type AuthStackParamList = {
  login: undefined
  callback: { code?: string; state?: string; error?: string }
  onboarding: undefined
}

export type DashboardStackParamList = {
  index: undefined
  'commands/index': undefined
  'commands/[name]': { name: string }
  'commands/groups': undefined
  'rewards/index': undefined
  'rewards/leaderboard': undefined
  'chat/index': undefined
  'chat/settings': undefined
  'moderation/index': undefined
  'moderation/filters': undefined
  'moderation/bans': undefined
  'moderation/log': undefined
  'music/index': undefined
  'music/settings': undefined
  'widgets/index': undefined
  'widgets/[widgetId]': { widgetId: string }
  'stream/index': undefined
  'community/index': undefined
  'community/[userId]': { userId: string }
  'pipelines/index': undefined
  'pipelines/[pipelineId]': { pipelineId: string }
  'integrations/index': undefined
  'permissions/index': undefined
  'settings/index': undefined
  'settings/tts': undefined
  'settings/danger': undefined
  'billing/index': undefined
  'my-data/index': undefined
}
