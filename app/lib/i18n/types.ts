import type commonEn from '@/locales/en/common.json'
import type commandsEn from '@/locales/en/commands.json'
import type dashboardEn from '@/locales/en/dashboard.json'
import type pipelinesEn from '@/locales/en/pipelines.json'
import type settingsEn from '@/locales/en/settings.json'
import type chatEn from '@/locales/en/chat.json'
import type musicEn from '@/locales/en/music.json'
import type moderationEn from '@/locales/en/moderation.json'
import type rewardsEn from '@/locales/en/rewards.json'

// Augment i18next types for type-safe translation keys
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEn
      commands: typeof commandsEn
      dashboard: typeof dashboardEn
      pipelines: typeof pipelinesEn
      settings: typeof settingsEn
      chat: typeof chatEn
      music: typeof musicEn
      moderation: typeof moderationEn
      rewards: typeof rewardsEn
    }
  }
}
