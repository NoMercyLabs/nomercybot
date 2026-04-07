import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native'
import { useState, useCallback } from 'react'
import { router } from 'expo-router'
import { useApiQuery } from '@/hooks/useApi'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Plus, Search, Terminal } from 'lucide-react-native'
import { ErrorState } from '@/components/ui/ErrorState'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import type { CommandListItem } from '../types'

type FilterType = 'All' | 'Custom' | 'Platform' | 'Disabled'

const FILTERS: FilterType[] = ['All', 'Custom', 'Platform', 'Disabled']

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  pipeline: { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa' },
  text:     { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa' },
  random:   { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  counter:  { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' },
  platform: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
}

const PERMISSION_LABELS: Record<string, string> = {
  everyone: 'Everyone',
  subscriber: 'Sub',
  vip: 'VIP',
  moderator: 'Mod',
  broadcaster: 'Broadcaster',
}

function TypeBadge({ type }: { type: string }) {
  const lower = (type ?? 'text').toLowerCase()
  const isCustom = lower === 'text' || lower === 'pipeline' || lower === 'random' || lower === 'counter'
  const colors = isCustom
    ? { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa' }
    : TYPE_COLORS[lower] ?? TYPE_COLORS.text
  const label = isCustom ? 'Custom' : 'Platform'
  return (
    <View className="self-start px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.bg }}>
      <Text className="text-xs font-semibold" style={{ color: colors.text }}>{label}</Text>
    </View>
  )
}

function InlineToggle({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        backgroundColor: value ? '#7C3AED' : '#3a3b4f',
        justifyContent: 'center',
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#fff',
          alignSelf: value ? 'flex-end' : 'flex-start',
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } : {}),
        } as any}
      />
    </Pressable>
  )
}

export function CommandsScreen() {
  const { t } = useFeatureTranslation('commands')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useApiQuery<CommandListItem[]>('commands', '/commands')

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const toggleMutation = useMutation({
    mutationFn: async ({ name, isEnabled }: { name: string; isEnabled: boolean }) => {
      await apiClient.patch(`/v1/channels/${channelId}/commands/${name}`, { isEnabled })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commands'] })
    },
  })

  const handleToggle = useCallback((cmd: CommandListItem) => {
    toggleMutation.mutate({ name: cmd.name, isEnabled: !cmd.isEnabled })
  }, [toggleMutation])

  const filtered = (data ?? []).filter((cmd) => {
    const matchesSearch =
      !search ||
      cmd.name.toLowerCase().includes(search.toLowerCase()) ||
      (cmd.description ?? '').toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    switch (activeFilter) {
      case 'Custom': {
        const t = ((cmd as any).type ?? 'text').toLowerCase()
        return t !== 'platform'
      }
      case 'Platform':
        return ((cmd as any).type ?? 'text').toLowerCase() === 'platform'
      case 'Disabled':
        return !cmd.isEnabled
      default:
        return true
    }
  })

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title={t('title')}
          subtitle="Manage chat commands"
        />
        <FeatureDisabledBanner featureKey="chat_commands" />

        {/* Search + Filters + Create button */}
        <View
          className="flex-row items-center gap-3 px-5 py-3"
          style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
        >
          <View
            className="flex-row items-center gap-2 rounded-lg px-3 py-2"
            style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a', flex: 1, maxWidth: 320 }}
          >
            <Search size={14} color="#5a5b72" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search commands..."
              placeholderTextColor="#3a3b4f"
              className="flex-1 text-sm text-white"
              style={{ outlineStyle: 'none' } as any}
            />
          </View>
          <View className="flex-row gap-2">
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: activeFilter === f ? 'rgba(124,58,237,0.15)' : '#1e1f2a',
                  borderWidth: 1,
                  borderColor: activeFilter === f ? '#7C3AED' : '#2a2b3a',
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: activeFilter === f ? '#a78bfa' : '#8889a0' }}
                >
                  {f}
                </Text>
              </Pressable>
            ))}
          </View>
          <View className="flex-1" />
          <Button
            size="sm"
            onPress={() => router.push('/(dashboard)/commands/new' as any)}
            leftIcon={<Plus size={14} color="white" />}
            label="Create Command"
          />
        </View>

        {/* Table header */}
        <View
          className="flex-row items-center px-5 py-2.5"
          style={{ backgroundColor: '#16171f', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
        >
          {[
            { label: 'COMMAND', flex: 2 },
            { label: 'TYPE', flex: 1 },
            { label: 'PERMISSION', flex: 1 },
            { label: 'COOLDOWN', flex: 1 },
            { label: 'ENABLED', flex: 1 },
            { label: 'USAGE', flex: 1 },
          ].map((col) => (
            <View key={col.label} style={{ flex: col.flex }}>
              <Text className="text-xs font-semibold tracking-wider" style={{ color: '#8889a0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {col.label}
              </Text>
            </View>
          ))}
        </View>

        {isError ? (
          <ErrorState title="Unable to load commands" onRetry={refetch} />
        ) : showSkeleton ? (
          <View className="gap-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <View
                key={i}
                className="flex-row items-center gap-3 px-5 py-3"
                style={{ backgroundColor: i % 2 === 0 ? '#0a0b0f' : '#16132b' }}
              >
                <View style={{ flex: 2 }}><Skeleton className="h-4 rounded" /></View>
                <View style={{ flex: 1 }}><Skeleton className="h-4 rounded" /></View>
                <View style={{ flex: 1 }}><Skeleton className="h-4 rounded" /></View>
                <View style={{ flex: 1 }}><Skeleton className="h-4 rounded" /></View>
                <View style={{ flex: 1 }}><Skeleton className="h-4 rounded" /></View>
                <View style={{ flex: 1 }}><Skeleton className="h-4 rounded" /></View>
              </View>
            ))}
          </View>
        ) : (
          <ScrollView>
            {filtered.length === 0 ? (
              <View className="items-center py-16">
                <Terminal size={32} color="#3a3b4f" />
                <Text className="text-sm mt-3" style={{ color: '#5a5b72' }}>
                  {search ? `No commands match "${search}"` : t('empty.title')}
                </Text>
                {!search && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      size="sm"
                      label="Create your first command"
                      leftIcon={<Plus size={13} color="white" />}
                      onPress={() => router.push('/(dashboard)/commands/new' as any)}
                    />
                  </View>
                )}
              </View>
            ) : (
              <>
                {filtered.map((cmd, index) => (
                  <Pressable
                    key={String(cmd.id)}
                    onPress={() => router.push(`/(dashboard)/commands/${cmd.name}` as any)}
                    style={{ backgroundColor: index % 2 === 0 ? '#0a0b0f' : 'rgba(26,21,48,0.5)' }}
                  >
                    <View
                      className="flex-row items-center px-5 py-2"
                      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
                    >
                      <View style={{ flex: 2 }}>
                        <Text className="text-sm font-mono font-medium" style={{ color: '#a78bfa' }}>
                          !{cmd.name}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <TypeBadge type={(cmd as any).type ?? 'Text'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-xs" style={{ color: '#aaabbe' }}>
                          {PERMISSION_LABELS[cmd.permission] ?? cmd.permission}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-xs" style={{ color: '#8889a0' }}>
                          {cmd.cooldownSeconds}s
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <InlineToggle
                          value={cmd.isEnabled}
                          onValueChange={() => handleToggle(cmd)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text className="text-xs" style={{ color: '#8889a0' }}>
                          {cmd.usageCount?.toLocaleString() ?? '0'}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
                <View className="flex-row items-center justify-between px-5 py-3">
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>
                    Showing {filtered.length} of {(data ?? []).length} commands
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </ErrorBoundary>
  )
}
