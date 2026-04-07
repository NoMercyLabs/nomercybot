import { View, Text, Animated } from 'react-native'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native'
import { cn } from '@/lib/utils/cn'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const styles = {
  success: 'bg-green-900/90 border-green-500/30',
  error: 'bg-red-900/90 border-red-500/30',
  warning: 'bg-yellow-900/90 border-yellow-500/30',
  info: 'bg-gray-800 border-gray-700',
}

const textStyles = {
  success: 'text-green-200',
  error: 'text-red-200',
  warning: 'text-yellow-200',
  info: 'text-gray-200',
}

const iconColors = {
  success: '#86efac',
  error: '#fca5a5',
  warning: '#fde68a',
  info: '#d1d5db',
}

export function Toast({ message, type = 'info' }: ToastProps) {
  const Icon = icons[type]
  return (
    <View
      className={cn('flex-row items-center gap-3 rounded-xl border px-4 py-3', styles[type])}
      style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' } as any}
    >
      <Icon size={18} color={iconColors[type]} />
      <Text className={cn('flex-1 text-sm font-medium', textStyles[type])}>{message}</Text>
    </View>
  )
}
