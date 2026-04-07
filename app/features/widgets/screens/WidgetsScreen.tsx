import { View, Text, ScrollView, Pressable, Modal, Alert, Platform, RefreshControl } from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import {
  Bell, MessageSquare, Target, Trophy, Music,
  List, Hash, Code2, Plus, Copy, ExternalLink,
  Trash2, ChevronRight, Layers,
} from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Modal as AppModal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import { useWidgets } from '../hooks/useWidgets'
import { useToast } from '@/hooks/useToast'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { WIDGET_TYPE_LABELS, WIDGET_TYPE_DESCRIPTIONS, type WidgetType, type Widget } from '../types'
import * as Clipboard from 'expo-clipboard'

const WIDGET_ICONS: Record<WidgetType, typeof Bell> = {
  alert: Bell,
  chat: MessageSquare,
  goal: Target,
  leaderboard: Trophy,
  nowplaying: Music,
  eventlist: List,
  counter: Hash,
  custom: Code2,
}

const WIDGET_COLORS: Record<WidgetType, string> = {
  alert: '#f59e0b',
  chat: '#3b82f6',
  goal: '#10b981',
  leaderboard: '#a855f7',
  nowplaying: '#1DB954',
  eventlist: '#06b6d4',
  counter: '#8b5cf6',
  custom: '#6b7280',
}

const WIDGET_TYPES_LIST: WidgetType[] = [
  'alert', 'chat', 'goal', 'leaderboard', 'nowplaying', 'eventlist', 'counter', 'custom',
]

function WidgetCard({ widget, onToggle, onDelete, onCopyUrl }: {
  widget: Widget
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onCopyUrl: () => void
}) {
  const Icon = WIDGET_ICONS[widget.type] ?? Layers
  const color = WIDGET_COLORS[widget.type] ?? '#6b7280'

  return (
    <Pressable onPress={() => router.push(`/(dashboard)/widgets/${widget.id}` as any)}>
      <Card className="gap-3">
        <View className="flex-row items-start gap-3">
          <View
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} color={color} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold" style={{ color: '#f4f5fa' }}>{widget.name}</Text>
            <Text className="text-xs" style={{ color: '#5a5b72' }}>{WIDGET_TYPE_LABELS[widget.type]}</Text>
          </View>
          <Toggle value={widget.isEnabled} onValueChange={onToggle} />
        </View>

        {widget.overlayUrl && (
          <View className="flex-row items-center gap-2 rounded-md px-3 py-2" style={{ backgroundColor: '#1e1f2a' }}>
            <Text className="flex-1 text-xs font-mono" style={{ color: '#8889a0' }} numberOfLines={1}>
              {widget.overlayUrl}
            </Text>
            <Pressable onPress={onCopyUrl} className="p-1">
              <Copy size={13} color="#8889a0" />
            </Pressable>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <Badge variant={widget.isEnabled ? 'success' : 'muted'} label={widget.isEnabled ? 'Active' : 'Inactive'} />
          <View
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: widget.type === 'custom' ? 'rgba(107,114,128,0.2)' : 'rgba(124,58,237,0.15)' }}
          >
            <Text className="text-xs font-semibold" style={{ color: widget.type === 'custom' ? '#9ca3af' : '#a78bfa' }}>
              {widget.type === 'custom' ? 'Custom' : 'Built-in'}
            </Text>
          </View>
          <View className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onPress={onDelete}
            leftIcon={<Trash2 size={13} color="#ef4444" />}
            label="Delete"
          />
          <ChevronRight size={14} color="#5a5b72" />
        </View>
      </Card>
    </Pressable>
  )
}

function CreateWidgetModal({ visible, onClose, onCreate }: {
  visible: boolean
  onClose: () => void
  onCreate: (type: WidgetType) => void
}) {
  return (
    <AppModal visible={visible} onClose={onClose} title="Add Widget">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          {WIDGET_TYPES_LIST.map((type) => {
            const Icon = WIDGET_ICONS[type]
            const color = WIDGET_COLORS[type]
            return (
              <Pressable
                key={type}
                onPress={() => onCreate(type)}
                className="flex-row items-center gap-3 rounded-xl p-3"
              style={{ borderWidth: 1, borderColor: '#2a2b3a', backgroundColor: '#16171f' }}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={20} color={color} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-white">
                    {WIDGET_TYPE_LABELS[type]}
                  </Text>
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>
                    {WIDGET_TYPE_DESCRIPTIONS[type]}
                  </Text>
                </View>
                <ChevronRight size={14} color="#5a5b72" />
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </AppModal>
  )
}

export function WidgetsScreen() {
  const { widgets, isLoading, isError, isRefetching, refetch, createWidget, updateWidget, deleteWidget } = useWidgets()
  const toast = useToast()
  const { isDesktop } = useBreakpoint()
  const [showCreate, setShowCreate] = useState(false)
  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  async function handleCreate(type: WidgetType) {
    setShowCreate(false)
    try {
      const widget = await createWidget({
        name: WIDGET_TYPE_LABELS[type],
        type,
      })
      toast.success(`${WIDGET_TYPE_LABELS[type]} created`)
      router.push(`/(dashboard)/widgets/${widget.id}` as any)
    } catch {
      toast.error('Failed to create widget')
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await updateWidget(id, { isEnabled: enabled })
    } catch {
      toast.error('Failed to update widget')
    }
  }

  async function handleDelete(widget: Widget) {
    Alert.alert(
      'Delete Widget',
      `Delete "${widget.name}"? The overlay URL will stop working.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWidget(widget.id)
              toast.success('Widget deleted')
            } catch {
              toast.error('Failed to delete widget')
            }
          },
        },
      ],
    )
  }

  async function handleCopyUrl(url: string) {
    await Clipboard.setStringAsync(url)
    toast.success('URL copied to clipboard')
  }

  return (
    <ErrorBoundary>
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <PageHeader
        title="Widgets"
        subtitle="Manage overlay widgets"
        rightContent={
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ExternalLink size={13} color="#d1d5db" />}
              label="Get Overlay URL"
              onPress={() => {
                if (widgets[0]?.overlayUrl) handleCopyUrl(widgets[0].overlayUrl)
              }}
            />
            <Button
              size="sm"
              onPress={() => setShowCreate(true)}
              leftIcon={<Plus size={14} color="white" />}
              label="Add Widget"
            />
          </View>
        }
      />
      <FeatureDisabledBanner featureKey="stream_alerts" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {isError ? (
          <ErrorState title="Unable to load widgets" onRetry={refetch} />
        ) : showSkeleton ? (
          <View className="flex-row flex-wrap gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                <Skeleton className="h-40 rounded-xl" />
              </View>
            ))}
          </View>
        ) : widgets.length === 0 ? (
          <EmptyState
            title="No widgets yet"
            message="Create overlay widgets to display alerts, chat, goals, and more on your stream."
            actionLabel="Add Widget"
            onAction={() => setShowCreate(true)}
          />
        ) : (
          <>
            {widgets.length > 0 && widgets[0]?.overlayUrl && (
              <View
                className="rounded-xl p-3 flex-row items-center gap-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <ExternalLink size={14} color="#5a5b72" />
                <Text className="text-xs font-mono flex-1" style={{ color: '#8889a0' }} numberOfLines={1}>
                  {widgets[0].overlayUrl}
                </Text>
                <Pressable
                  onPress={() => widgets[0]?.overlayUrl && handleCopyUrl(widgets[0].overlayUrl)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Text className="text-xs font-medium" style={{ color: '#8889a0' }}>Copy</Text>
                </Pressable>
              </View>
            )}
            <View className="flex-row flex-wrap gap-4">
              {widgets.map((widget) => (
                <View key={widget.id} style={isDesktop ? { width: '31%' } : { flex: 1, minWidth: 260, maxWidth: 400 }}>
                  <WidgetCard
                    widget={widget}
                    onToggle={(enabled) => handleToggle(widget.id, enabled)}
                    onDelete={() => handleDelete(widget)}
                    onCopyUrl={() => widget.overlayUrl && handleCopyUrl(widget.overlayUrl)}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {widgets.length > 0 && (
          <View className="rounded-xl items-center gap-2 py-6 px-4" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
            <ExternalLink size={24} color="#5a5b72" />
            <Text className="text-sm font-medium text-white">OBS Setup</Text>
            <Text className="text-xs text-center px-4" style={{ color: '#5a5b72' }}>
              Add widget overlay URLs as Browser Sources in OBS, Streamlabs, or any streaming software.
            </Text>
          </View>
        )}
      </ScrollView>

      <CreateWidgetModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </View>
    </ErrorBoundary>
  )
}
