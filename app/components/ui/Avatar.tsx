import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  src?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 32, md: 40, lg: 56 }
const textSizeMap = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const px = sizeMap[size]
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <View
      className={cn('items-center justify-center rounded-full overflow-hidden', className)}
      style={{ width: px, height: px, backgroundColor: '#6D28D9' }}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: px, height: px }} contentFit="cover" />
      ) : (
        <Text className={cn('font-semibold text-white', textSizeMap[size])}>{initials}</Text>
      )}
    </View>
  )
}
