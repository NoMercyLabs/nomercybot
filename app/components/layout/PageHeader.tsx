import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { cn } from '@/lib/utils/cn'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  showBack?: boolean
  action?: React.ReactNode
  /** Alias for action */
  rightContent?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, backHref, showBack, action, rightContent, className }: PageHeaderProps) {
  const router = useRouter()
  const right = action ?? rightContent

  return (
    <View
      className={cn('flex-row items-center justify-between px-5 py-4', className)}
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        {(backHref || showBack) && (
          <Pressable
            onPress={() => backHref ? router.push(backHref as any) : router.back()}
            className="p-1.5 rounded-lg -ml-1"
            style={{ backgroundColor: '#1e1f2a' }}
          >
            <ChevronLeft size={18} color="#8889a0" />
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="font-bold text-white" style={{ fontSize: 20 }}>{title}</Text>
          {subtitle && (
            <Text className="text-sm mt-0.5" style={{ color: '#8889a0', fontSize: 13 }}>{subtitle}</Text>
          )}
        </View>
      </View>
      {right && <View>{right}</View>}
    </View>
  )
}
