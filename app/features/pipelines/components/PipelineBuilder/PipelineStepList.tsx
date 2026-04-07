import { ScrollView, View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/utils/cn'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react-native'
import type { PipelineNode } from '@/types/pipeline'

const NODE_TYPE_COLORS = {
  trigger: 'bg-green-900 border-green-700',
  condition: 'bg-amber-900 border-amber-700',
  action: 'bg-blue-900 border-blue-700',
} as const

const NODE_TYPE_TEXT = {
  trigger: 'text-green-300',
  condition: 'text-amber-300',
  action: 'text-blue-300',
} as const

interface PipelineStepListProps {
  nodes: PipelineNode[]
  selectedNodeId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onReorder: (from: number, to: number) => void
}

export function PipelineStepList({
  nodes,
  selectedNodeId,
  onSelect,
  onRemove,
  onReorder,
}: PipelineStepListProps) {
  return (
    <ScrollView className="flex-1 p-4 gap-2">
      {nodes.map((node, index) => (
        <Pressable
          key={node.id}
          onPress={() => onSelect(node.id)}
          className={cn(
            'rounded-xl border p-4 flex-row items-center gap-3',
            NODE_TYPE_COLORS[node.type],
            selectedNodeId === node.id && 'border-accent-500',
          )}
        >
          <View className="flex-1 gap-1">
            <Text className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {node.type}
            </Text>
            <Text className={cn('font-medium', NODE_TYPE_TEXT[node.type])}>{node.label}</Text>
            <Text className="text-gray-500 text-xs">{node.nodeType}</Text>
          </View>
          <View className="flex-row gap-1">
            {index > 0 && (
              <Pressable onPress={() => onReorder(index, index - 1)} className="p-1">
                <ChevronUp size={14} color="rgb(156,163,175)" />
              </Pressable>
            )}
            {index < nodes.length - 1 && (
              <Pressable onPress={() => onReorder(index, index + 1)} className="p-1">
                <ChevronDown size={14} color="rgb(156,163,175)" />
              </Pressable>
            )}
            <Pressable onPress={() => onRemove(node.id)} className="p-1">
              <Trash2 size={14} color="rgb(239,68,68)" />
            </Pressable>
          </View>
        </Pressable>
      ))}
      {nodes.length === 0 && (
        <View className="flex-1 items-center justify-center py-16">
          <Text className="text-gray-500">No nodes yet. Add a trigger to get started.</Text>
        </View>
      )}
    </ScrollView>
  )
}
