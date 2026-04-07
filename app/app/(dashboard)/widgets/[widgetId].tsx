import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, ExternalLink, Trash2, AlertTriangle } from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useChannelStore } from '@/stores/useChannelStore'
import { useToast } from '@/hooks/useToast'
import { widgetsApi } from '@/features/widgets/api'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { WIDGET_TYPE_LABELS } from '@/features/widgets/types'
import type { Widget, WidgetType } from '@/features/widgets/types'

// ── Per-type config fields ───────────────────────────────────────────────────

interface ConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'toggle' | 'select'
  options?: { label: string; value: string }[]
  placeholder?: string
}

const WIDGET_CONFIG_FIELDS: Partial<Record<WidgetType, ConfigField[]>> = {
  alert: [
    { key: 'animationStyle', label: 'Animation Style', type: 'select', options: [
      { label: 'Bounce', value: 'bounce' },
      { label: 'Slide In', value: 'slide' },
      { label: 'Fade', value: 'fade' },
    ]},
    { key: 'durationMs', label: 'Display Duration (ms)', type: 'number', placeholder: '5000' },
    { key: 'volume', label: 'Alert Volume (0–100)', type: 'number', placeholder: '80' },
    { key: 'showFollows', label: 'Show Follow Alerts', type: 'toggle' },
    { key: 'showSubs', label: 'Show Sub Alerts', type: 'toggle' },
    { key: 'showRaids', label: 'Show Raid Alerts', type: 'toggle' },
    { key: 'showCheers', label: 'Show Cheer Alerts', type: 'toggle' },
  ],
  chat: [
    { key: 'fontSize', label: 'Font Size (px)', type: 'number', placeholder: '16' },
    { key: 'messageDurationMs', label: 'Message Duration (ms)', type: 'number', placeholder: '30000' },
    { key: 'maxMessages', label: 'Max Messages Visible', type: 'number', placeholder: '10' },
    { key: 'showBadges', label: 'Show Badges', type: 'toggle' },
    { key: 'showAvatars', label: 'Show Avatars', type: 'toggle' },
    { key: 'animateIn', label: 'Animate Messages In', type: 'toggle' },
  ],
  goal: [
    { key: 'goalType', label: 'Goal Type', type: 'select', options: [
      { label: 'Followers', value: 'followers' },
      { label: 'Subscribers', value: 'subscribers' },
      { label: 'Donations', value: 'donations' },
      { label: 'Bits', value: 'bits' },
    ]},
    { key: 'target', label: 'Target Amount', type: 'number', placeholder: '100' },
    { key: 'label', label: 'Goal Label', type: 'text', placeholder: 'e.g. Road to 1000 followers!' },
    { key: 'showPercentage', label: 'Show Percentage', type: 'toggle' },
  ],
  leaderboard: [
    { key: 'leaderboardType', label: 'Type', type: 'select', options: [
      { label: 'Points', value: 'points' },
      { label: 'Chat Messages', value: 'messages' },
      { label: 'Bits', value: 'bits' },
      { label: 'Gifted Subs', value: 'gifts' },
    ]},
    { key: 'count', label: 'Number of Entries', type: 'number', placeholder: '10' },
    { key: 'period', label: 'Period', type: 'select', options: [
      { label: 'All Time', value: 'all' },
      { label: 'This Month', value: 'month' },
      { label: 'This Week', value: 'week' },
      { label: 'Today', value: 'day' },
    ]},
  ],
  nowplaying: [
    { key: 'showAlbumArt', label: 'Show Album Art', type: 'toggle' },
    { key: 'showProgressBar', label: 'Show Progress Bar', type: 'toggle' },
    { key: 'showArtist', label: 'Show Artist Name', type: 'toggle' },
    { key: 'marqueeTitle', label: 'Scroll Long Titles', type: 'toggle' },
  ],
  eventlist: [
    { key: 'maxEvents', label: 'Max Events', type: 'number', placeholder: '8' },
    { key: 'showFollows', label: 'Show Follows', type: 'toggle' },
    { key: 'showSubs', label: 'Show Subscriptions', type: 'toggle' },
    { key: 'showRaids', label: 'Show Raids', type: 'toggle' },
    { key: 'showCheers', label: 'Show Cheers', type: 'toggle' },
    { key: 'showRedemptions', label: 'Show Redemptions', type: 'toggle' },
  ],
  counter: [
    { key: 'label', label: 'Counter Label', type: 'text', placeholder: 'e.g. Deaths' },
    { key: 'initialValue', label: 'Starting Value', type: 'number', placeholder: '0' },
    { key: 'step', label: 'Increment Step', type: 'number', placeholder: '1' },
    { key: 'command', label: 'Chat Command (e.g. !deaths)', type: 'text', placeholder: '!counter' },
  ],
  custom: [
    { key: 'html', label: 'HTML', type: 'text', placeholder: '<div>...</div>' },
    { key: 'css', label: 'CSS', type: 'text', placeholder: 'body { ... }' },
    { key: 'js', label: 'JavaScript', type: 'text', placeholder: 'console.log(...)' },
  ],
}

// ── Config field renderer ────────────────────────────────────────────────────

function ConfigFieldRow({
  field,
  value,
  onchange,
}: {
  field: ConfigField
  value: unknown
  onchange: (key: string, val: unknown) => void
}) {
  if (field.type === 'toggle') {
    return (
      <Toggle
        label={field.label}
        value={!!value}
        onValueChange={(v) => onchange(field.key, v)}
      />
    )
  }
  if (field.type === 'select' && field.options) {
    const { Select } = require('@/components/ui/Select')
    return (
      <Select
        label={field.label}
        value={String(value ?? field.options[0]?.value ?? '')}
        onValueChange={(v: string) => onchange(field.key, v)}
        options={field.options}
      />
    )
  }
  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      value={value != null ? String(value) : ''}
      onChangeText={(v) =>
        onchange(field.key, field.type === 'number' ? (parseFloat(v) || 0) : v)
      }
      keyboardType={field.type === 'number' ? 'numeric' : 'default'}
      multiline={field.key === 'html' || field.key === 'css' || field.key === 'js'}
      numberOfLines={field.key === 'html' || field.key === 'css' || field.key === 'js' ? 5 : 1}
    />
  )
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function WidgetEditorScreen() {
  const { widgetId } = useLocalSearchParams<{ widgetId: string }>()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const toast = useToast()
  const qc = useQueryClient()

  const { data: widget, isLoading, isError, refetch } = useQuery<Widget>({
    queryKey: ['widgets', channelId, widgetId],
    queryFn: () => widgetsApi.get(channelId!, widgetId!),
    enabled: !!channelId && !!widgetId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const updateMutation = useMutation({
    mutationFn: (patch: { name?: string; isEnabled?: boolean; settings?: Record<string, unknown> }) =>
      widgetsApi.update(channelId!, widgetId!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['widgets', channelId] })
      toast.success('Saved')
    },
    onError: () => toast.error('Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => widgetsApi.delete(channelId!, widgetId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['widgets', channelId] })
      toast.success('Widget deleted')
      router.replace('/(dashboard)/widgets' as any)
    },
    onError: () => toast.error('Failed to delete'),
  })

  function patchSettings(key: string, value: unknown) {
    if (!widget) return
    updateMutation.mutate({ settings: { ...widget.settings, [key]: value } })
  }

  function confirmDelete() {
    Alert.alert('Delete Widget', `Delete "${widget?.name}"? The overlay URL will stop working.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])
  }

  async function copyUrl() {
    if (!widget?.overlayUrl) return
    await Clipboard.setStringAsync(widget.overlayUrl)
    toast.success('URL copied!')
  }

  if (showSkeleton) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Widget Editor" showBack />
        <View className="p-4 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </View>
      </View>
    )
  }

  if (isError || timedOut || !widget) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Widget Editor" showBack />
        <EmptyState
          icon={<AlertTriangle size={32} color="#ef4444" />}
          title={isError ? 'Failed to load widget' : 'Widget not found'}
          message={isError ? 'Could not fetch widget data.' : undefined}
          actionLabel={isError ? 'Retry' : undefined}
          onAction={isError ? refetch : undefined}
        />
      </View>
    )
  }

  const fields = WIDGET_CONFIG_FIELDS[widget.type] ?? []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0b0f' }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 32 }}>
      <PageHeader
        title={widget.name}
        showBack
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onPress={confirmDelete}
            loading={deleteMutation.isPending}
            leftIcon={<Trash2 size={14} color="#ef4444" />}
            label="Delete"
          />
        }
      />

      {/* Info */}
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <Text className="text-sm font-semibold text-white">{widget.name}</Text>
            <Text className="text-xs" style={{ color: '#8889a0' }}>{WIDGET_TYPE_LABELS[widget.type]}</Text>
          </View>
          <Badge
            variant={widget.isEnabled ? 'success' : 'muted'}
            label={widget.isEnabled ? 'Active' : 'Inactive'}
          />
        </View>
        <Toggle
          label="Enabled"
          description="Widget will be available at the overlay URL"
          value={widget.isEnabled}
          onValueChange={(v) => updateMutation.mutate({ isEnabled: v })}
        />
      </Card>

      {/* Overlay URL */}
      {widget.overlayUrl && (
        <Card className="gap-2">
          <Text className="text-sm font-semibold text-white">Overlay URL</Text>
          <Text className="text-xs" style={{ color: '#8889a0' }}>
            Add this as a Browser Source in OBS or Streamlabs.
          </Text>
          <View className="flex-row items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: '#1e1f2a' }}>
            <Text className="flex-1 text-xs font-mono" style={{ color: '#8889a0' }} numberOfLines={1}>
              {widget.overlayUrl}
            </Text>
            <Pressable onPress={copyUrl} className="p-1">
              <Copy size={14} color="#8889a0" />
            </Pressable>
          </View>
          <Button
            variant="secondary"
            size="sm"
            onPress={copyUrl}
            leftIcon={<Copy size={13} color="#8889a0" />}
            label="Copy URL"
          />
        </Card>
      )}

      {/* Widget-specific settings */}
      {fields.length > 0 && (
        <Card className="gap-4">
          <Text className="text-sm font-semibold text-white">Configuration</Text>
          {fields.map((field) => (
            <ConfigFieldRow
              key={field.key}
              field={field}
              value={widget.settings[field.key]}
              onchange={patchSettings}
            />
          ))}
        </Card>
      )}

      {/* Name */}
      <Card className="gap-3">
        <Text className="text-sm font-semibold text-white">Widget Name</Text>
        <Input
          label="Name"
          value={widget.name}
          onChangeText={(v) => updateMutation.mutate({ name: v })}
        />
      </Card>
    </ScrollView>
  )
}
