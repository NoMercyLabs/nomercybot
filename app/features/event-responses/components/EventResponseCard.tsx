import { View, Text } from 'react-native'
import { Zap, Settings2 } from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { KNOWN_EVENT_TYPES, type EventResponseListItem, type EventResponseType } from '../types'

interface EventResponseCardProps {
  eventType: string
  config?: EventResponseListItem
  onConfigure: () => void
  onToggle: (enabled: boolean) => void
}

const responseTypeBadgeVariant: Record<EventResponseType, BadgeVariant> = {
  chat_message: 'info',
  pipeline: 'default',
  overlay: 'warning',
  none: 'muted',
}

const responseTypeLabel: Record<EventResponseType, string> = {
  chat_message: 'Chat Message',
  pipeline: 'Pipeline',
  overlay: 'Overlay',
  none: 'None',
}

export function EventResponseCard({ eventType, config, onConfigure, onToggle }: EventResponseCardProps) {
  const known = KNOWN_EVENT_TYPES.find((e) => e.eventType === eventType)
  const label = known?.label ?? eventType
  const description = known?.description ?? eventType
  const isEnabled = config?.isEnabled ?? false
  const responseType = config?.responseType ?? 'none'

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Zap size={14} color="#8889a0" />
            <Text className="text-sm font-semibold text-white">{label}</Text>
          </View>
          <Text className="text-xs leading-relaxed" style={{ color: '#8889a0' }} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <Toggle value={isEnabled} onValueChange={onToggle} />
      </View>

      <View className="flex-row items-center gap-2">
        <Badge
          variant={isEnabled ? 'success' : 'muted'}
          label={isEnabled ? 'Enabled' : 'Disabled'}
        />
        <Badge
          variant={responseTypeBadgeVariant[responseType]}
          label={responseTypeLabel[responseType]}
        />
        <View className="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          onPress={onConfigure}
          leftIcon={<Settings2 size={13} color="rgb(156,163,175)" />}
          label="Configure"
        />
      </View>
    </Card>
  )
}
