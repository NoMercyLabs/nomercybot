import { View, Text, Pressable } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Edit, Trash2 } from 'lucide-react-native'
import type { Command } from '../types'

interface CommandCardProps {
  command: Command
  onEdit: () => void
  onDelete: () => void
}

export function CommandCard({ command, onEdit, onDelete }: CommandCardProps) {
  return (
    <Card className="flex-row items-center justify-between p-4">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-medium" style={{ color: '#f4f5fa' }}>!{command.name}</Text>
          {!command.isEnabled && <Badge label="Disabled" variant="secondary" />}
          <Badge label={command.permission} variant="default" />
        </View>
        <Text className="text-sm" style={{ color: '#8889a0' }} numberOfLines={1}>{command.response}</Text>
        <Text className="text-xs" style={{ color: '#5a5b72' }}>Cooldown: {command.cooldownSeconds}s</Text>
      </View>
      <View className="flex-row gap-1">
        <Pressable onPress={onEdit} className="p-2 rounded-lg">
          <Edit size={16} color="#9ca3af" />
        </Pressable>
        <Pressable onPress={onDelete} className="p-2 rounded-lg">
          <Trash2 size={16} color="#ef4444" />
        </Pressable>
      </View>
    </Card>
  )
}
