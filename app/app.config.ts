import type { ExpoConfig } from 'expo/config'

const IS_DEV = process.env.APP_VARIANT === 'development'
const IS_PREVIEW = process.env.APP_VARIANT === 'preview'

function getBundleId(): string {
  if (IS_DEV) return 'tv.nomercy.bot.dev'
  if (IS_PREVIEW) return 'tv.nomercy.bot.preview'
  return 'tv.nomercy.bot'
}

function getAppName(): string {
  if (IS_DEV) return 'NomNomzBot (Dev)'
  if (IS_PREVIEW) return 'NomNomzBot (Preview)'
  return 'NomNomzBot'
}

const config: ExpoConfig = {
  name: getAppName(),
  slug: 'nomnomzbot',
  version: '1.0.0',
  scheme: 'nomnomzbot',
  orientation: 'default',
  userInterfaceStyle: 'dark',

  icon: './assets/icon.png',

  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0b0f',
  },

  assetBundlePatterns: ['**/*'],

  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/nomercybot',
    checkAutomatically: 'ON_LOAD',
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: getBundleId(),
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Used for profile picture selection.',
      NSPhotoLibraryUsageDescription: 'Used for profile picture selection.',
      UIBackgroundModes: ['audio', 'fetch', 'remote-notification'],
    },
  },

  android: {
    package: getBundleId(),
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0b0f',
    },
    permissions: [
      'INTERNET',
      'RECEIVE_BOOT_COMPLETED',
      'VIBRATE',
    ],
  },

  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-dev-client',
    'expo-router',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#9146FF',
        defaultChannel: 'default',
        sounds: [],
      },
    ],
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#0a0b0f',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    twitchClientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
}

export default config
