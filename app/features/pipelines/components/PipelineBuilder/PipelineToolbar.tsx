import { View, Text, Pressable, Modal, ScrollView } from 'react-native'
import { useState } from 'react'
import { Plus, Save, ChevronRight, X } from 'lucide-react-native'
import { NODE_REGISTRY } from './nodeRegistry'
import type { PipelineNode } from '@/types/pipeline'
import type { NodeCategory } from '@/types/pipeline'

interface PipelineToolbarProps {
  isDirty: boolean
  onAddNode: (node: PipelineNode) => void
  onSave: () => void
}

const CATEGORY_STYLES: Record<NodeCategory, { bg: string; border: string; text: string; badgeBg: string; textColor: string }> = {
  trigger: { bg: 'bg-green-900', border: 'border-green-700', text: 'text-green-300', badgeBg: 'bg-green-800', textColor: '#86efac' },
  condition: { bg: 'bg-amber-900', border: 'border-amber-700', text: 'text-amber-300', badgeBg: 'bg-amber-800', textColor: '#fcd34d' },
  action: { bg: 'bg-blue-900', border: 'border-blue-700', text: 'text-blue-300', badgeBg: 'bg-blue-800', textColor: '#93c5fd' },
}

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger: 'Triggers',
  condition: 'Conditions',
  action: 'Actions',
}

function NodePickerModal({
  visible,
  category,
  onClose,
  onSelect,
}: {
  visible: boolean
  category: NodeCategory | null
  onClose: () => void
  onSelect: (node: PipelineNode) => void
}) {
  const nodes = NODE_REGISTRY.filter((n) => !category || n.category === category)
  const categories: NodeCategory[] = category ? [category] : ['trigger', 'condition', 'action']

  function select(nodeType: string) {
    const def = NODE_REGISTRY.find((n) => n.nodeType === nodeType)
    if (!def) return
    const defaultConfig: Record<string, unknown> = { ...def.defaultConfig }
    onSelect({
      id: crypto.randomUUID(),
      type: def.category,
      nodeType: def.nodeType,
      label: def.label,
      config: defaultConfig,
      position: { x: 0, y: 0 },
    })
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 items-center justify-center px-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-sm rounded-xl overflow-hidden"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
          >
            <Text className="text-sm font-semibold" style={{ color: '#f4f5fa' }}>
              {category ? `Add ${CATEGORY_LABELS[category]}` : 'Add Node'}
            </Text>
            <Pressable onPress={onClose} className="p-1">
              <X size={16} color="#8889a0" />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 480 }}>
            {categories.map((cat) => {
              const catNodes = nodes.filter((n) => n.category === cat)
              if (catNodes.length === 0) return null
              const styles = CATEGORY_STYLES[cat]
              return (
                <View key={cat}>
                  {!category && (
                    <View className={`px-4 py-2 ${styles.bg}`}>
                      <Text className={`text-xs font-semibold uppercase ${styles.text}`}>
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </View>
                  )}
                  {catNodes.map((node) => (
                    <Pressable
                      key={node.nodeType}
                      onPress={() => select(node.nodeType)}
                      className="flex-row items-center gap-3 px-4 py-3"
                      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
                    >
                      <View className={`rounded px-1.5 py-0.5 ${styles.badgeBg}`}>
                        <Text className={`text-xs font-medium ${styles.text}`}>
                          {node.category}
                        </Text>
                      </View>
                      <View className="flex-1 gap-0.5">
                        <Text className="text-sm font-medium" style={{ color: '#e5e7eb' }}>{node.label}</Text>
                        <Text className="text-xs" style={{ color: '#6b7280' }}>{node.description}</Text>
                      </View>
                      <ChevronRight size={14} color="#5a5b72" />
                    </Pressable>
                  ))}
                </View>
              )
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

export function PipelineToolbar({ isDirty, onAddNode, onSave }: PipelineToolbarProps) {
  const [pickerCategory, setPickerCategory] = useState<NodeCategory | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  function openPicker(category: NodeCategory | null) {
    setPickerCategory(category)
    setShowPicker(true)
  }

  return (
    <>
      <View
        className="flex-row items-center gap-2 px-4 py-3 flex-wrap"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        {(['trigger', 'condition', 'action'] as NodeCategory[]).map((cat) => {
          const styles = CATEGORY_STYLES[cat]
          return (
            <Pressable
              key={cat}
              onPress={() => openPicker(cat)}
              className={`flex-row items-center gap-1.5 rounded-lg border px-3 py-2 ${styles.bg} ${styles.border}`}
            >
              <Plus size={13} color={styles.textColor} />
              <Text className={`text-sm font-medium ${styles.text} capitalize`}>{cat}</Text>
            </Pressable>
          )
        })}

        <View className="flex-1" />

        {isDirty && (
          <Pressable
            onPress={onSave}
            className="flex-row items-center gap-1.5 rounded-lg px-3 py-2"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Save size={14} color="white" />
            <Text className="text-white text-sm font-medium">Save</Text>
          </Pressable>
        )}
      </View>

      <NodePickerModal
        visible={showPicker}
        category={pickerCategory}
        onClose={() => setShowPicker(false)}
        onSelect={onAddNode}
      />
    </>
  )
}
