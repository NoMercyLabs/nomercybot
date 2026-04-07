import { View, Text } from 'react-native'
import { useConnectionStatus } from '@/hooks/useConnectionStatus'
import { cn } from '@/lib/utils/cn'

const STATUS_CONFIG = {
  connected: { color: 'bg-green-500', label: 'Connected' },
  connecting: { color: 'bg-amber-500', label: 'Connecting...' },
  reconnecting: { color: 'bg-amber-500', label: 'Reconnecting...' },
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
} as const

export function ConnectionStatus() {
  const { status } = useConnectionStatus()
  const config = STATUS_CONFIG[status]

  return (
    <View className="flex-row items-center gap-2">
      <View className={cn('h-2 w-2 rounded-full', config.color)} />
      <Text className="text-xs text-gray-400">{config.label}</Text>
    </View>
  )
}
