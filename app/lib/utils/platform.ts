import { Platform } from 'react-native'

export const isWeb = Platform.OS === 'web'
export const isNative = Platform.OS !== 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'

export function platformSelect<T>(options: { web: T; native: T }): T {
  return isWeb ? options.web : options.native
}
