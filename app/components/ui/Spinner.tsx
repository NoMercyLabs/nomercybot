import { ActivityIndicator, View } from 'react-native'

interface SpinnerProps {
  size?: 'small' | 'large'
  color?: string
  className?: string
}

export function Spinner({ size = 'large', color = 'rgb(124, 58, 237)' }: SpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size={size} color={color} />
    </View>
  )
}
