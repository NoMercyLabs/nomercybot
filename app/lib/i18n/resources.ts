import i18n, { type SupportedLocale } from './index'

export async function loadNamespace(locale: SupportedLocale, namespace: string): Promise<void> {
  if (i18n.hasResourceBundle(locale, namespace)) return

  try {
    const messages = await importNamespace(locale, namespace)
    i18n.addResourceBundle(locale, namespace, messages, true, true)
  } catch (error) {
    console.warn(`Failed to load i18n namespace: ${locale}/${namespace}`, error)
    if (locale !== 'en') {
      await loadNamespace('en', namespace)
    }
  }
}

async function importNamespace(
  locale: SupportedLocale,
  namespace: string,
): Promise<Record<string, unknown>> {
  const map: Record<string, Record<string, () => Promise<any>>> = {
    en: {
      commands: () => import('@/locales/en/commands.json'),
      dashboard: () => import('@/locales/en/dashboard.json'),
      pipelines: () => import('@/locales/en/pipelines.json'),
      moderation: () => import('@/locales/en/moderation.json'),
      music: () => import('@/locales/en/music.json'),
      settings: () => import('@/locales/en/settings.json'),
      chat: () => import('@/locales/en/chat.json'),
      rewards: () => import('@/locales/en/rewards.json'),
    },
    nl: {
      common: () => import('@/locales/nl/common.json'),
      commands: () => import('@/locales/nl/commands.json'),
      dashboard: () => import('@/locales/nl/dashboard.json'),
      pipelines: () => import('@/locales/nl/pipelines.json'),
      moderation: () => import('@/locales/nl/moderation.json'),
      music: () => import('@/locales/nl/music.json'),
      settings: () => import('@/locales/nl/settings.json'),
      chat: () => import('@/locales/nl/chat.json'),
      rewards: () => import('@/locales/nl/rewards.json'),
    },
    de: {
      common: () => import('@/locales/de/common.json'),
      commands: () => import('@/locales/de/commands.json'),
      dashboard: () => import('@/locales/de/dashboard.json'),
      pipelines: () => import('@/locales/de/pipelines.json'),
      moderation: () => import('@/locales/de/moderation.json'),
      music: () => import('@/locales/de/music.json'),
      settings: () => import('@/locales/de/settings.json'),
      chat: () => import('@/locales/de/chat.json'),
      rewards: () => import('@/locales/de/rewards.json'),
    },
  }

  const loader = map[locale]?.[namespace]
  if (!loader) throw new Error(`Unknown namespace: ${locale}/${namespace}`)

  const module = await loader()
  return module.default ?? module
}
