import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

// Eagerly loaded namespaces
import commonEn from '@/locales/en/common.json'
import commandsEn from '@/locales/en/commands.json'

export type SupportedLocale = 'en' | 'nl' | 'de'

const deviceLocale = getLocales()[0]?.languageCode ?? 'en'
const savedLocale = (() => { try { return typeof localStorage !== 'undefined' ? localStorage.getItem('nomercybot-locale') : null } catch { return null } })()
const defaultLocale: SupportedLocale =
  savedLocale && (['en', 'nl', 'de'] as const).includes(savedLocale as SupportedLocale)
    ? (savedLocale as SupportedLocale)
    : (['en', 'nl', 'de'] as const).includes(deviceLocale as SupportedLocale)
    ? (deviceLocale as SupportedLocale)
    : 'en'

i18n.use(initReactI18next).init({
  lng: defaultLocale,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'commands'],

  resources: {
    en: { common: commonEn, commands: commandsEn },
  },

  interpolation: {
    escapeValue: false,
  },

  saveMissing: __DEV__,
  missingKeyHandler: __DEV__
    ? (_lngs: readonly string[], ns: string, key: string) => {
        console.warn(`Missing i18n key: ${ns}:${key}`)
      }
    : undefined,

  react: {
    useSuspense: false,
  },
})

export default i18n
