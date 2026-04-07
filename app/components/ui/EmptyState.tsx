import { View, Text } from 'react-native'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({ icon, title, message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center gap-4 py-16 px-8', className)}>
      {icon && <View className="opacity-40">{icon}</View>}
      <View className="items-center gap-2">
        <Text className="text-lg font-semibold text-gray-300">{title}</Text>
        {message && <Text className="text-gray-500 text-center text-sm">{message}</Text>}
      </View>
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} variant="secondary" size="sm" />
      )}
    </View>
  )
}
