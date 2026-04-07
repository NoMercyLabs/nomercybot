import { View, Text } from 'react-native'
import { cn } from '@/lib/utils/cn'
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react-native'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  className?: string
}

const config: Record<AlertVariant, { container: string; title: string; icon: React.ReactNode }> = {
  info: {
    container: 'bg-blue-950 border border-blue-800',
    title: 'text-blue-300',
    icon: <Info size={16} color="rgb(147, 197, 253)" />,
  },
  success: {
    container: 'bg-green-950 border border-green-800',
    title: 'text-green-300',
    icon: <CheckCircle size={16} color="rgb(134, 239, 172)" />,
  },
  warning: {
    container: 'bg-amber-950 border border-amber-800',
    title: 'text-amber-300',
    icon: <AlertTriangle size={16} color="rgb(252, 211, 77)" />,
  },
  error: {
    container: 'bg-red-950 border border-red-800',
    title: 'text-red-300',
    icon: <AlertCircle size={16} color="rgb(252, 165, 165)" />,
  },
}

export function Alert({ variant = 'info', title, message, className }: AlertProps) {
  const c = config[variant]
  return (
    <View className={cn('rounded-xl p-4 flex-row gap-3', c.container, className)}>
      <View className="mt-0.5">{c.icon}</View>
      <View className="flex-1 gap-1">
        {title && <Text className={cn('font-semibold text-sm', c.title)}>{title}</Text>}
        <Text className="text-gray-300 text-sm">{message}</Text>
      </View>
    </View>
  )
}
