import { View, Text } from 'react-native'
import { cn } from '@/lib/utils/cn'

export type BadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'secondary' | 'muted'

export interface BadgeProps {
  label?: string
  children?: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default: { container: 'bg-[#2a2b3a]', text: 'text-[#aaabbe]' },
  info: { container: 'bg-[rgba(59,130,246,0.15)]', text: 'text-[#60a5fa]' },
  success: { container: 'bg-[rgba(34,197,94,0.15)]', text: 'text-[#4ade80]' },
  warning: { container: 'bg-[rgba(245,158,11,0.15)]', text: 'text-[#fbbf24]' },
  danger: { container: 'bg-[rgba(239,68,68,0.15)]', text: 'text-[#f87171]' },
  secondary: { container: 'bg-[#1e1f2a]', text: 'text-[#8889a0]' },
  muted: { container: 'bg-[#16171f]', text: 'text-[#5a5b72]' },
}

export function Badge({ label, children, variant = 'default', className }: BadgeProps) {
  const styles = variantStyles[variant]
  const content = label ?? children
  return (
    <View className={cn('rounded-md px-2 py-0.5', styles.container, className)}>
      <Text className={cn('text-xs font-medium', styles.text)}>{content}</Text>
    </View>
  )
}
