import { View, Text } from 'react-native'
import type { TrustLevel } from '../types'

interface TrustBadgeProps {
  level: TrustLevel
}

const LEVEL_CONFIG: Record<TrustLevel, { bg: string; text: string; label: string }> = {
  viewer:      { bg: 'rgba(34,197,94,0.2)',  text: '#4ade80', label: 'Follower' },
  regular:     { bg: 'rgba(139,92,246,0.2)', text: '#a78bfa', label: 'Subscriber' },
  vip:         { bg: 'rgba(236,72,153,0.2)', text: '#f472b6', label: 'VIP' },
  moderator:   { bg: 'rgba(239,68,68,0.2)',  text: '#f87171', label: 'Moderator' },
  broadcaster: { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24', label: 'Broadcaster' },
}

export function TrustBadge({ level }: TrustBadgeProps) {
  const config = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.viewer

  return (
    <View className="rounded-md px-2 py-0.5" style={{ backgroundColor: config.bg }}>
      <Text className="text-xs font-medium" style={{ color: config.text }}>{config.label}</Text>
    </View>
  )
}
