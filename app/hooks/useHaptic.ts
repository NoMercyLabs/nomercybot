import { Platform } from 'react-native'

let Haptics: typeof import('expo-haptics') | null = null

async function getHaptics() {
  if (Platform.OS === 'web') return null
  if (!Haptics) {
    Haptics = await import('expo-haptics')
  }
  return Haptics
}

export function useHaptic() {
  const light = async () => {
    const h = await getHaptics()
    h?.impactAsync(h.ImpactFeedbackStyle.Light)
  }

  const medium = async () => {
    const h = await getHaptics()
    h?.impactAsync(h.ImpactFeedbackStyle.Medium)
  }

  const heavy = async () => {
    const h = await getHaptics()
    h?.impactAsync(h.ImpactFeedbackStyle.Heavy)
  }

  const success = async () => {
    const h = await getHaptics()
    h?.notificationAsync(h.NotificationFeedbackType.Success)
  }

  const error = async () => {
    const h = await getHaptics()
    h?.notificationAsync(h.NotificationFeedbackType.Error)
  }

  const warning = async () => {
    const h = await getHaptics()
    h?.notificationAsync(h.NotificationFeedbackType.Warning)
  }

  return { light, medium, heavy, success, error, warning }
}
