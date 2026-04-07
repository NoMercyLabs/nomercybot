import { Platform } from 'react-native'
import { useBreakpoint } from './useBreakpoint'

export type AppPlatform = 'web' | 'ios' | 'android' | 'tablet'

export function usePlatform() {
  const { isTablet } = useBreakpoint()

  const platform: AppPlatform =
    Platform.OS === 'web'
      ? 'web'
      : isTablet
        ? 'tablet'
        : (Platform.OS as 'ios' | 'android')

  return {
    platform,
    isWeb: Platform.OS === 'web',
    isNative: Platform.OS !== 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isTablet,
    supportsMonaco: Platform.OS === 'web',
    supportsPipelineBuilder: Platform.OS === 'web',
    supportsDragDrop: Platform.OS === 'web',
    supportsHover: Platform.OS === 'web',
    supportsKeyboardShortcuts: Platform.OS === 'web',
  }
}
