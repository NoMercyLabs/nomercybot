import { View, Text, Pressable, ScrollView } from 'react-native'
import { cn } from '@/lib/utils/cn'

export interface Tab {
  key: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  activeKey?: string
  activeTab?: string
  onChange?: (key: string) => void
  onTabChange?: (key: string) => void
  className?: string
}

export function Tabs({ tabs, activeKey, activeTab, onChange, onTabChange, className }: TabsProps) {
  const currentKey = activeKey ?? activeTab ?? ''
  const handleChange = onChange ?? onTabChange ?? (() => {})
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('border-b border-[#2a2b3a]', className)}
    >
      <View className="flex-row">
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleChange(tab.key)}
            className={cn(
              'px-4 py-3 border-b-2',
              currentKey === tab.key ? 'border-[#8b5cf6]' : 'border-transparent',
            )}
          >
            <Text
              className={cn('text-sm font-medium')}
              style={{ color: currentKey === tab.key ? '#a78bfa' : '#9ca3af' }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
