import { Platform } from 'react-native'
import Constants from 'expo-constants'

const ENV_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5080'

/**
 * Extracts the port number from the configured API URL (default 5080).
 */
function getApiPort(): string {
  try {
    const match = ENV_URL.match(/:(\d+)\s*$/)
    return match?.[1] ?? '5080'
  } catch {
    return '5080'
  }
}

/**
 * In dev builds, Expo knows the IP of the machine running Metro.
 * We can extract it and use it for the API URL so real Android devices
 * and emulators can both reach the backend without manual .env edits.
 *
 * Returns the host IP or null if not available.
 */
function getDevServerHost(): string | null {
  if (!__DEV__) return null

  // Expo exposes the Metro bundler host as "192.168.x.x:8081" (or similar)
  const debuggerHost =
    (Constants.expoGoConfig as Record<string, string> | undefined)?.debuggerHost ??
    (Constants.expoConfig?.hostUri as string | undefined)

  if (!debuggerHost) return null

  // Strip the Metro port, keep just the IP
  const host = debuggerHost.split(':')[0]
  return host || null
}

/**
 * Returns the API base URL, adjusted for the current runtime environment.
 *
 * Dev builds (Android emulator or real device):
 *   Extracts the dev machine's IP from Expo's Metro connection and builds
 *   `http://<dev-machine-ip>:<api-port>`. Works automatically — no manual
 *   .env changes needed for Android.
 *
 * Production builds:
 *   Returns EXPO_PUBLIC_API_URL as-is.
 */
function resolveApiBaseUrl(): string {
  // Only rewrite localhost URLs — if a real hostname is configured, use it
  if (!/https?:\/\/localhost/.test(ENV_URL)) {
    return ENV_URL
  }

  // On Android (emulator or real device), localhost doesn't reach the host
  if (Platform.OS === 'android') {
    const devHost = getDevServerHost()
    if (devHost) {
      return `http://${devHost}:${getApiPort()}`
    }
    // Fallback for emulator when Metro host isn't available
    if (!Constants.isDevice) {
      return ENV_URL.replace(/localhost/, '10.0.2.2')
    }
  }

  return ENV_URL
}

export const API_BASE_URL = resolveApiBaseUrl()
