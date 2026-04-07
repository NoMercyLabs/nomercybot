import { View, Text, Pressable } from 'react-native'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Puzzle } from 'lucide-react-native'
import type { Pipeline } from '@/types/pipeline'

interface PipelineCardProps {
  pipeline: Pipeline
  onPress: () => void
}

export function PipelineCard({ pipeline, onPress }: PipelineCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card className="p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Puzzle size={16} color="rgb(167, 139, 250)" />
            <Text className="font-semibold text-white">{pipeline.name}</Text>
          </View>
          <Badge
            label={pipeline.isEnabled ? 'Active' : 'Disabled'}
            variant={pipeline.isEnabled ? 'success' : 'secondary'}
          />
        </View>
        {pipeline.description && (
          <Text className="text-sm" style={{ color: '#8889a0' }}>{pipeline.description}</Text>
        )}
        <Text className="text-xs" style={{ color: '#5a5b72' }}>{pipeline.graph.nodes.length} nodes</Text>
      </Card>
    </Pressable>
  )
}
