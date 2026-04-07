import { View, ActivityIndicator } from 'react-native'

interface LoadingOverlayProps {
  visible: boolean
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null
  return (
    <View className="absolute inset-0 items-center justify-center bg-black/50 z-50">
      <ActivityIndicator size="large" color="rgb(124, 58, 237)" />
    </View>
  )
}
