import { View, Text, type ViewProps } from 'react-native'
import { cn } from '@/lib/utils/cn'

interface CardProps extends ViewProps {
  className?: string
  accentColor?: string
}

export function Card({ className, children, accentColor, style, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-xl', className)}
      style={[
        {
          backgroundColor: '#16171f',
          borderWidth: 1,
          borderColor: '#2a2b3a',
          ...(accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : {}),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  )
}

interface CardHeaderProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, children, className }: CardHeaderProps) {
  return (
    <View
      className={cn('flex-row items-center justify-between px-4 py-3', className)}
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a', backgroundColor: '#1e1f2a' }}
    >
      <View className="flex-1">
        {title ? (
          <>
            <Text className="text-sm font-semibold text-white">{title}</Text>
            {subtitle && <Text className="text-xs mt-0.5" style={{ color: '#5a5b72' }}>{subtitle}</Text>}
          </>
        ) : (
          children
        )}
      </View>
      {action && <View>{action}</View>}
    </View>
  )
}
