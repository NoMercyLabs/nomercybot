import { View, Text, Pressable, Modal, FlatList } from 'react-native'
import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react-native'
import { cn } from '@/lib/utils/cn'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps {
  label?: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  error?: string
}

export function Select({ label, value, onValueChange, options, placeholder, error }: SelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium" style={{ color: '#d1d5db' }}>{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg px-3 py-2.5"
        style={{
          backgroundColor: '#16171f',
          borderWidth: 1,
          borderColor: error ? '#ef4444' : '#2a2b3a',
        }}
      >
        <Text className="text-sm" style={{ color: selected ? '#f4f5fa' : '#5a5b72' }}>
          {selected?.label ?? placeholder ?? 'Select...'}
        </Text>
        <ChevronDown size={16} color="#6b7280" />
      </Pressable>
      {error && <Text className="text-xs text-red-400">{error}</Text>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/60" onPress={() => setOpen(false)}>
          <View
            className="mx-4 mt-40 rounded-xl overflow-hidden"
            style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
          >
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center justify-between px-4 py-3.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
                  onPress={() => { onValueChange(item.value); setOpen(false) }}
                >
                  <Text className="text-sm text-white">{item.label}</Text>
                  {item.value === value && <Check size={16} color="#a78bfa" />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}
