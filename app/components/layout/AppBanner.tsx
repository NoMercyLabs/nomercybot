import { View, Text, Pressable } from 'react-native'
import { X } from 'lucide-react-native'
import { useState } from 'react'

interface AppBannerProps {
  message: string
  variant?: 'info' | 'warning' | 'error'
}

export function AppBanner({ message, variant = 'info' }: AppBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const bgColor = {
    info: 'bg-blue-900',
    warning: 'bg-amber-900',
    error: 'bg-red-900',
  }[variant]

  return (
    <View className={`flex-row items-center justify-between px-4 py-2 ${bgColor}`}>
      <Text className="flex-1 text-sm text-white">{message}</Text>
      <Pressable onPress={() => setDismissed(true)} className="p-1">
        <X size={14} color="white" />
      </Pressable>
    </View>
  )
}
