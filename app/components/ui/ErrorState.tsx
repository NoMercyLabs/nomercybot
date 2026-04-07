import { View, Text } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { Button } from './Button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Unable to load',
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 py-16 px-8">
      <View style={{ opacity: 0.5 }}>
        <AlertCircle size={40} color="#ef4444" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-base font-semibold text-white">{title}</Text>
        <Text className="text-sm text-center" style={{ color: '#5a5b72' }}>{message}</Text>
      </View>
      {onRetry && (
        <Button label="Retry" onPress={onRetry} variant="secondary" size="sm" />
      )}
    </View>
  )
}
