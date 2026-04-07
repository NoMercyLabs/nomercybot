import { View, Text, ScrollView, Pressable } from 'react-native'
import { X, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { NODE_REGISTRY } from './nodeRegistry'
import type { PipelineNode, ConfigField } from '@/types/pipeline'

interface PipelineNodeEditorProps {
  node: PipelineNode
  onUpdate: (updates: Partial<PipelineNode>) => void
  onDelete?: () => void
  onClose: () => void
}

export function PipelineNodeEditor({ node, onUpdate, onDelete, onClose }: PipelineNodeEditorProps) {
  const def = NODE_REGISTRY.find((n) => n.nodeType === node.nodeType)

  function updateConfig(key: string, value: unknown) {
    onUpdate({ config: { ...node.config, [key]: value } })
  }

  const CATEGORY_TEXT: Record<string, string> = {
    trigger: 'text-green-300',
    condition: 'text-amber-300',
    action: 'text-blue-300',
  }
  const CATEGORY_BG: Record<string, string> = {
    trigger: 'bg-green-900',
    condition: 'bg-amber-900',
    action: 'bg-blue-900',
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#16171f' }}>
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        <View className="flex-1 gap-0.5">
          <View className={`self-start rounded px-1.5 py-0.5 ${CATEGORY_BG[node.type] ?? 'bg-gray-800'}`}>
            <Text className={`text-xs font-medium capitalize ${CATEGORY_TEXT[node.type] ?? 'text-gray-300'}`}>
              {node.type}
            </Text>
          </View>
          <Text className="font-semibold" style={{ color: '#f4f5fa' }}>{node.label}</Text>
          {def?.description && (
            <Text className="text-xs" style={{ color: '#6b7280' }}>{def.description}</Text>
          )}
        </View>
        <Pressable onPress={onClose} className="p-1 ml-2">
          <X size={18} color="#9ca3af" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ gap: 16 }}>
        {/* Label */}
        <Input
          label="Label"
          value={node.label}
          onChangeText={(v) => onUpdate({ label: v })}
        />

        {/* Config schema fields */}
        {def?.configSchema?.map((field: ConfigField) => {
          const value = node.config[field.key]

          if (field.type === 'select') {
            return (
              <Select
                key={field.key}
                label={field.label}
                value={String(value ?? field.options?.[0]?.value ?? '')}
                onValueChange={(v) => updateConfig(field.key, v)}
                options={field.options ?? []}
              />
            )
          }

          if (field.type === 'number') {
            return (
              <Input
                key={field.key}
                label={field.label}
                placeholder={field.placeholder ?? '0'}
                value={String(value ?? '')}
                onChangeText={(v) => updateConfig(field.key, parseInt(v, 10) || 0)}
                keyboardType="numeric"
              />
            )
          }

          if (field.type === 'toggle') {
            return (
              <Toggle
                key={field.key}
                label={field.label}
                value={!!value}
                onValueChange={(v) => updateConfig(field.key, v)}
              />
            )
          }

          if (field.type === 'variable') {
            return (
              <View key={field.key}>
                <Input
                  label={field.label}
                  placeholder={field.placeholder ?? 'e.g. {user} scored {random.number.100}'}
                  value={String(value ?? '')}
                  onChangeText={(v) => updateConfig(field.key, v)}
                />
                <Text className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  Variables: {'{user}'}, {'{user.id}'}, {'{channel}'}, {'{stream.title}'}, {'{stream.game}'}, {'{stream.uptime}'}, {'{time}'}, {'{date}'}, {'{random.number.N}'}
                </Text>
              </View>
            )
          }

          return (
            <Input
              key={field.key}
              label={field.label}
              placeholder={field.placeholder ?? ''}
              value={String(value ?? '')}
              onChangeText={(v) => updateConfig(field.key, v)}
            />
          )
        })}

        {/* No config */}
        {def && def.configSchema.length === 0 && (
          <Text className="text-sm" style={{ color: '#6b7280' }}>No configuration needed for this node.</Text>
        )}

        {/* Delete */}
        {onDelete && (
          <Button
            variant="danger"
            onPress={onDelete}
            leftIcon={<Trash2 size={14} color="white" />}
            label="Delete Node"
          />
        )}
      </ScrollView>
    </View>
  )
}
