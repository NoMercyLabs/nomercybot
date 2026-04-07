import { ScrollView, View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useChannel } from '@/hooks/useChannel'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useActivityFeed } from '@/features/dashboard/hooks/useActivityFeed'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatNumber, formatRelativeTime } from '@/lib/utils/format'
import {
  Users, UserPlus, Terminal, MessageSquare,
  Heart, Star, Radio, Zap, Gift,
  Edit2, Play, Sword, Scissors, Users2, Hash,
  TrendingUp, Film,
} from 'lucide-react-native'
import type { DashboardStats, ActivityEvent, TopCommand } from '@/features/dashboard/types'
import { ErrorState } from '@/components/ui/ErrorState'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'

const QUICK_ACTIONS = [
  { label: 'Change Title', href: '/(dashboard)/stream', icon: Edit2, color: '#8889a0' },
  { label: 'Run Ad', href: '/(dashboard)/stream', icon: Play, color: '#8889a0' },
  { label: 'Shield Mode', href: '/(dashboard)/moderation', icon: Sword, color: '#8889a0' },
  { label: 'Create Clip', href: '/(dashboard)/stream', icon: Scissors, color: '#8889a0' },
  { label: 'Start Raid', href: '/(dashboard)/stream', icon: Radio, color: '#8889a0' },
  { label: 'Chat Mode', href: '/(dashboard)/chat', icon: MessageSquare, color: '#8889a0' },
]

const EVENT_ICONS: Record<ActivityEvent['type'], typeof Heart> = {
  follow: Heart,
  subscribe: Star,
  raid: Radio,
  cheer: Zap,
  command: Terminal,
  redemption: Gift,
}

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  follow: '#22c55e',
  subscribe: '#a78bfa',
  raid: '#f59e0b',
  cheer: '#60a5fa',
  command: '#4ade80',
  redemption: '#f472b6',
}

const EVENT_LABEL_KEYS: Record<ActivityEvent['type'], string> = {
  follow: 'followed',
  subscribe: 'subscribed',
  raid: 'raided',
  cheer: 'cheered',
  command: 'used a command',
  redemption: 'redeemed a reward',
}

export default function DashboardScreen() {
  const { currentChannel } = useChannel()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const { events } = useActivityFeed()
  const { t } = useFeatureTranslation('dashboard')
  const { isDesktop, isPhone } = useBreakpoint()

  const { data: stats, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', channelId],
    queryFn: () =>
      apiClient
        .get<{ data: DashboardStats }>(`/v1/dashboard/${channelId}/stats`)
        .then((r) => r.data.data),
    enabled: !!channelId,
    refetchInterval: 30_000,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  if (isError || timedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader title={currentChannel?.displayName ?? t('title')} />
        <ErrorState title="Unable to load dashboard" onRetry={refetch} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0a0b0f' }}
      contentContainerStyle={{ paddingBottom: isPhone ? 80 : 32 }}
    >
      <PageHeader
        title={currentChannel?.displayName ?? t('title')}
        subtitle={stats?.streamTitle ?? 'Overview of your channel'}
        rightContent={
          stats?.isLive ? (
            <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded"
              style={{ backgroundColor: '#22c55e' }}>
              <View className="w-1.5 h-1.5 rounded-full bg-white" />
              <Text className="text-xs font-bold text-white">LIVE</Text>
            </View>
          ) : (
            <View className="px-2.5 py-1 rounded" style={{ backgroundColor: '#1e1f2a' }}>
              <Text className="text-xs font-medium" style={{ color: '#5a5b72' }}>OFFLINE</Text>
            </View>
          )
        }
      />

      <View className="px-5 py-5 gap-6">
        {/* Stream Banner */}
        {stats?.isLive ? (
          <View
            className="rounded-xl overflow-hidden flex-row items-center"
            style={{
              borderWidth: 1,
              borderColor: 'rgba(124,58,237,0.2)',
              padding: 16,
              gap: 16,
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08), transparent)',
            } as any}
          >
            {/* Live thumbnail */}
            <View
              className="items-center justify-center rounded-lg"
              style={{ width: 120, height: 68, backgroundColor: '#ef4444', flexShrink: 0 }}
            >
              <Text className="text-xs font-bold text-white">LIVE</Text>
            </View>

            {/* Live info */}
            <View className="flex-1 gap-1" style={{ minWidth: 0 }}>
              <View className="flex-row items-center gap-2" style={{ marginBottom: 4 }}>
                <View
                  className="flex-row items-center gap-1.5 px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <View className="w-1.5 h-1.5 rounded-full bg-white" />
                  <Text className="text-xs font-bold text-white" style={{ fontSize: 10 }}>LIVE</Text>
                </View>
                {stats.uptime != null && (
                  <Text className="text-xs" style={{ color: '#8889a0' }}>
                    Started {Math.floor(stats.uptime / 3600)}h {Math.floor((stats.uptime % 3600) / 60)}m ago
                  </Text>
                )}
              </View>
              <Text className="text-sm font-semibold text-white" numberOfLines={1} style={{ fontSize: 15 }}>
                {stats.streamTitle ?? 'No title set'}
              </Text>
              <Text className="text-xs" style={{ color: '#8889a0' }}>
                {[stats.gameName, stats.language ? stats.language.toUpperCase() : null]
                  .filter(Boolean)
                  .join(' \u00B7 ') || 'No category'}
              </Text>
            </View>

            {/* Viewer count */}
            <View className="items-end" style={{ flexShrink: 0 }}>
              <Text className="text-2xl font-bold text-white">{formatNumber(stats.viewerCount ?? 0)}</Text>
              <Text className="text-xs" style={{ color: '#8889a0' }}>viewers</Text>
            </View>
          </View>
        ) : (
          /* Offline banner */
          <View
            className="rounded-xl overflow-hidden"
            style={{ borderWidth: 1, borderColor: '#2a2b3a', backgroundColor: '#16171f' }}
          >
            <View className="flex-row items-center" style={{ padding: 16, gap: 16 }}>
              {/* Offline thumbnail */}
              <View
                className="items-center justify-center rounded-lg"
                style={{ width: 120, height: 68, backgroundColor: '#1e1f2a', flexShrink: 0 }}
              >
                <Film size={20} color="#3a3b4f" />
                <Text style={{ fontSize: 9, color: '#3a3b4f', letterSpacing: 1, marginTop: 4 }}>OFFLINE</Text>
              </View>

              {/* Offline info */}
              <View className="flex-1 gap-1.5" style={{ minWidth: 0 }}>
                <View className="flex-row items-center gap-2">
                  <View
                    className="px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a' }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#5a5b72', letterSpacing: 0.5 }}>
                      OFFLINE
                    </Text>
                  </View>
                </View>
                <Text className="font-semibold text-white" numberOfLines={1} style={{ fontSize: 14 }}>
                  {stats?.streamTitle ?? 'No title set'}
                </Text>
                <Text className="text-xs" style={{ color: '#8889a0' }}>
                  {[stats?.gameName, stats?.language ? stats.language.toUpperCase() : null]
                    .filter(Boolean)
                    .join(' \u00B7 ') || 'No category set'}
                </Text>
              </View>
            </View>

            {/* Go Live prompt */}
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a' }}
            >
              <Text className="text-xs" style={{ color: '#5a5b72' }}>
                Start streaming to see live stats and activity
              </Text>
              <View
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' }}
              >
                <Radio size={12} color="#a78bfa" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#a78bfa' }}>Go Live</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stat cards — 2x2 grid on phone, single row on tablet/desktop */}
        {showSkeleton ? (
          isPhone ? (
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Skeleton className="h-24 flex-1 rounded-xl" />
                <Skeleton className="h-24 flex-1 rounded-xl" />
              </View>
              <View className="flex-row gap-3">
                <Skeleton className="h-24 flex-1 rounded-xl" />
                <Skeleton className="h-24 flex-1 rounded-xl" />
              </View>
            </View>
          ) : (
            <View className="flex-row gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 flex-1 rounded-xl" />
              ))}
            </View>
          )
        ) : isPhone ? (
          // 2x2 grid: explicit widths so React Native flexWrap actually works
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard icon={<Users size={16} color="#a78bfa" />} label="Viewers" value={formatNumber(stats?.viewerCount ?? 0)} accentColor="#7C3AED" flex />
              <StatCard icon={<UserPlus size={16} color="#60a5fa" />} label="Followers" value={formatNumber(stats?.followerCount ?? 0)} accentColor="#3b82f6" flex />
            </View>
            <View className="flex-row gap-3">
              <StatCard icon={<Star size={16} color="#4ade80" />} label="Subscribers" value={formatNumber(stats?.subscriberCount ?? 0)} accentColor="#22c55e" flex />
              <StatCard icon={<Terminal size={16} color="#fbbf24" />} label="Commands" value={formatNumber(stats?.commandsUsed ?? 0)} accentColor="#f59e0b" flex />
            </View>
          </View>
        ) : (
          <View className="flex-row gap-4">
            <StatCard icon={<Users size={16} color="#a78bfa" />} label="Peak Viewers" value={formatNumber(stats?.viewerCount ?? 0)} accentColor="#7C3AED" flex />
            <StatCard icon={<UserPlus size={16} color="#60a5fa" />} label="New Followers" value={formatNumber(stats?.followerCount ?? 0)} accentColor="#3b82f6" flex />
            <StatCard icon={<Star size={16} color="#4ade80" />} label="Subscribers" value={formatNumber(stats?.subscriberCount ?? 0)} accentColor="#22c55e" flex />
            <StatCard icon={<Terminal size={16} color="#fbbf24" />} label="Commands Used" value={formatNumber(stats?.commandsUsed ?? 0)} accentColor="#f59e0b" flex />
          </View>
        )}

        {/* Two-column layout on desktop */}
        {isDesktop ? (
          <View className="flex-row gap-6" style={{ alignItems: 'flex-start' }}>
            {/* Left: Recent Activity */}
            <View className="gap-4" style={{ flex: 10 }}>
              <RecentActivitySection events={events} />
            </View>

            {/* Right: Quick Actions */}
            <View className="gap-4" style={{ flex: 4, minWidth: 300 }}>
              <QuickActionsSection />
              <TopCommandsSection stats={stats} />
            </View>
          </View>
        ) : (
          <>
            <QuickActionsSection />
            <RecentActivitySection events={events} />
            <TopCommandsSection stats={stats} />
          </>
        )}
      </View>
    </ScrollView>
  )
}

function RecentActivitySection({ events }: { events: ActivityEvent[] }) {
  return (
    <View className="gap-4">
      <Text className="font-semibold text-white px-0.5" style={{ fontSize: 16 }}>Recent Activity</Text>
      <View
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
      >
        {events.length === 0 ? (
          <View className="items-center py-10">
            <Hash size={28} color="#2a2b3a" />
            <Text className="text-sm mt-3" style={{ color: '#3a3b4f' }}>No recent activity</Text>
            <Text className="text-xs mt-1" style={{ color: '#2a2b3a' }}>
              Activity appears when you go live
            </Text>
          </View>
        ) : (
          events.slice(0, 10).map((event, index) => {
            const color = EVENT_COLORS[event.type] ?? '#22c55e'
            const label = EVENT_LABEL_KEYS[event.type] ?? event.type
            return (
              <View
                key={event.id}
                className="flex-row items-start gap-2.5 px-4 py-2.5"
                style={index > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
              >
                <View
                  className="rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: color, marginTop: 5, flexShrink: 0 }}
                />
                <View className="flex-1" style={{ minWidth: 0 }}>
                  <Text className="text-sm" style={{ color: '#cdcede' }}>
                    <Text className="font-semibold" style={{ color: '#e8e9f0' }}>
                      {event.displayName}
                    </Text>
                    {' '}{label}
                  </Text>
                </View>
                <Text className="text-xs" style={{ color: '#5a5b72', marginLeft: 'auto' }}>
                  {formatRelativeTime(event.timestamp)}
                </Text>
              </View>
            )
          })
        )}
      </View>
    </View>
  )
}

function QuickActionsSection() {
  return (
    <View className="gap-4">
      <Text className="font-semibold text-white px-0.5" style={{ fontSize: 16 }}>Quick Actions</Text>
      {/* 3-column grid of action buttons */}
      <View className="gap-2">
        {[QUICK_ACTIONS.slice(0, 3), QUICK_ACTIONS.slice(3, 6)].map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row gap-2">
            {row.map((action) => {
              const Icon = action.icon
              return (
                <Pressable
                  key={action.label}
                  onPress={() => router.push(action.href as any)}
                  className="flex-1 rounded-lg items-center justify-center gap-2 py-4 px-3"
                  style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Icon size={20} color={action.color} />
                  <Text className="text-xs text-center" style={{ color: '#aaabbe' }} numberOfLines={2}>
                    {action.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

function TopCommandsSection({ stats }: { stats?: DashboardStats }) {
  const topCommands: TopCommand[] = stats?.topCommands ?? []

  return (
    <View className="gap-4">
      <Text className="font-semibold text-white px-0.5" style={{ fontSize: 16 }}>Top Commands Today</Text>
      <View
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
      >
        {/* Table header row */}
        <View className="flex-row items-center px-4 py-2" style={{ backgroundColor: '#1e1f2a', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
          <View style={{ flex: 2 }}>
            <Text className="text-xs font-semibold tracking-wider" style={{ color: '#3a3b4f' }}>COMMAND</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text className="text-xs font-semibold tracking-wider" style={{ color: '#3a3b4f' }}>USES</Text>
          </View>
        </View>
        {topCommands.length === 0 && (
          <View className="items-center py-8">
            <Terminal size={24} color="#2a2b3a" />
            <Text className="text-xs mt-2" style={{ color: '#3a3b4f' }}>No commands used yet today</Text>
          </View>
        )}
        {topCommands.slice(0, 5).map((cmd, i) => (
          <View
            key={cmd.name}
            className="flex-row items-center justify-between px-4 py-3"
            style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-xs w-4 text-right" style={{ color: '#3a3b4f' }}>{i + 1}</Text>
              <Text className="text-sm font-mono font-medium" style={{ color: '#a78bfa' }}>
                {cmd.name}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <TrendingUp size={11} color="#22c55e" />
              <Text className="text-xs font-semibold" style={{ color: '#8889a0' }}>{cmd.uses}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function StatCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  accentColor,
  flex,
}: {
  icon: React.ReactNode
  label: string
  value: string
  delta?: string
  deltaPositive?: boolean
  accentColor: string
  flex?: boolean
}) {
  return (
    <View
      className="rounded-xl px-4 py-4"
      style={{
        flex: flex ? 1 : undefined,
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: '#2a2b3a',
      }}
    >
      <Text className="text-xs" style={{ color: '#8889a0', marginBottom: 4 }}>{label}</Text>
      <Text className="text-2xl font-bold" style={{ color: '#f4f5fa' }}>{value}</Text>
      {delta && (
        <View className="flex-row items-center gap-1 mt-1">
          <TrendingUp size={10} color={deltaPositive !== false ? '#22c55e' : '#ef4444'} />
          <Text
            className="text-xs font-medium"
            style={{ color: deltaPositive !== false ? '#22c55e' : '#ef4444' }}
          >
            {delta}
          </Text>
        </View>
      )}
    </View>
  )
}
