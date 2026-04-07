import { View, Text, ScrollView, Pressable } from 'react-native'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import {
  MessageSquare, Shield, Music, Mic2, Megaphone, Gift,
  Bell, BarChart2, Radio, Scissors, DollarSign, Mail,
  type LucideIcon,
} from 'lucide-react-native'

interface Feature {
  key: string
  title: string
  description: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  tier: 'free' | 'plus' | 'pro'
  requiresOAuth?: boolean
  oauthScope?: string
}

const FEATURES: Feature[] = [
  {
    key: 'commands',
    title: 'Chat Commands',
    description: 'Custom commands that respond to chat triggers',
    icon: MessageSquare,
    iconColor: '#a78bfa',
    iconBg: 'rgba(124,58,237,0.15)',
    tier: 'free',
  },
  {
    key: 'auto_moderation',
    title: 'Auto-Moderation',
    description: 'Automatically filter links, caps, and banned phrases',
    icon: Shield,
    iconColor: '#60a5fa',
    iconBg: 'rgba(59,130,246,0.15)',
    tier: 'free',
    requiresOAuth: true,
    oauthScope: 'channel:moderate',
  },
  {
    key: 'song_requests',
    title: 'Song Requests',
    description: 'Let viewers request songs via chat or channel points',
    icon: Music,
    iconColor: '#4ade80',
    iconBg: 'rgba(34,197,94,0.15)',
    tier: 'plus',
  },
  {
    key: 'text_to_speech',
    title: 'Text to Speech',
    description: 'Read chat messages aloud using TTS',
    icon: Mic2,
    iconColor: '#fbbf24',
    iconBg: 'rgba(245,158,11,0.15)',
    tier: 'plus',
  },
  {
    key: 'shoutouts',
    title: 'Shoutouts',
    description: 'Auto-shoutout raiders and featured channels',
    icon: Megaphone,
    iconColor: '#f472b6',
    iconBg: 'rgba(244,114,182,0.15)',
    tier: 'free',
    requiresOAuth: true,
    oauthScope: 'channel:manage:raids',
  },
  {
    key: 'rewards',
    title: 'Channel Points',
    description: 'Manage and automate channel point rewards',
    icon: Gift,
    iconColor: '#a78bfa',
    iconBg: 'rgba(124,58,237,0.15)',
    tier: 'free',
    requiresOAuth: true,
    oauthScope: 'channel:manage:redemptions',
  },
  {
    key: 'stream_alerts',
    title: 'Stream Alerts',
    description: 'Automated alerts for follows, subs, and raids',
    icon: Bell,
    iconColor: '#34d399',
    iconBg: 'rgba(52,211,153,0.15)',
    tier: 'free',
  },
  {
    key: 'polls_predictions',
    title: 'Polls & Predictions',
    description: 'Create and manage polls and predictions',
    icon: BarChart2,
    iconColor: '#60a5fa',
    iconBg: 'rgba(59,130,246,0.15)',
    tier: 'pro',
    requiresOAuth: true,
    oauthScope: 'channel:manage:polls',
  },
  {
    key: 'stream_info',
    title: 'Stream Info',
    description: 'Update title, game, and tags from the dashboard',
    icon: Radio,
    iconColor: '#f97316',
    iconBg: 'rgba(249,115,22,0.15)',
    tier: 'free',
    requiresOAuth: true,
    oauthScope: 'channel:manage:broadcast',
  },
  {
    key: 'clip_creation',
    title: 'Clip Creation',
    description: 'Create clips from chat commands or quick actions',
    icon: Scissors,
    iconColor: '#22c55e',
    iconBg: 'rgba(34,197,94,0.15)',
    tier: 'plus',
    requiresOAuth: true,
    oauthScope: 'clips:edit',
  },
  {
    key: 'ad_management',
    title: 'Ad Management',
    description: 'Run and schedule ads from the dashboard',
    icon: DollarSign,
    iconColor: '#fbbf24',
    iconBg: 'rgba(245,158,11,0.15)',
    tier: 'pro',
    requiresOAuth: true,
    oauthScope: 'channel:edit:commercial',
  },
  {
    key: 'whispers',
    title: 'Whispers',
    description: 'Send whispers to viewers via bot commands',
    icon: Mail,
    iconColor: '#818cf8',
    iconBg: 'rgba(129,140,248,0.15)',
    tier: 'pro',
    requiresOAuth: true,
    oauthScope: 'user:manage:whispers',
  },
]

interface FeatureStates {
  [key: string]: boolean
}

const TIER_CONFIG = {
  free: { label: 'FREE', bg: 'rgba(34,197,94,0.15)', color: '#4ade80' },
  plus: { label: 'PLUS', bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  pro:  { label: 'PRO',  bg: 'rgba(124,58,237,0.2)',  color: '#a78bfa' },
}

function TierBadge({ tier }: { tier: 'free' | 'plus' | 'pro' }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: cfg.bg }}>
      <Text className="text-xs font-bold" style={{ color: cfg.color, fontSize: 9 }}>{cfg.label}</Text>
    </View>
  )
}

function FeatureCard({
  feature,
  enabled,
  onToggle,
  isLoading,
}: {
  feature: Feature
  enabled: boolean
  onToggle: (key: string, value: boolean) => void
  isLoading: boolean
}) {
  const Icon = feature.icon

  return (
    <View
      className="rounded-xl p-5 gap-4"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: enabled ? 'rgba(124,58,237,0.3)' : '#2a2b3a',
      }}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View
          className="h-10 w-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: feature.iconBg }}
        >
          <Icon size={20} color={feature.iconColor} />
        </View>
        <Toggle value={enabled} onValueChange={(v) => !isLoading && onToggle(feature.key, v)} />
      </View>
      <View className="gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold text-white">{feature.title}</Text>
          <TierBadge tier={feature.tier} />
        </View>
        <Text className="text-xs leading-5" style={{ color: '#5a5b72' }}>
          {feature.description}
        </Text>
      </View>
      {feature.requiresOAuth && (
        <View
          className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
          style={{
            backgroundColor: enabled ? 'rgba(59,130,246,0.1)' : 'rgba(90,82,128,0.1)',
            borderWidth: 1,
            borderColor: enabled ? 'rgba(59,130,246,0.3)' : '#2a2b3a',
          }}
        >
          <Text className="text-xs font-mono" style={{ color: enabled ? '#60a5fa' : '#3a3b4f' }}>
            {feature.oauthScope}
          </Text>
        </View>
      )}
    </View>
  )
}

export function FeaturesScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: featureStates, isLoading, isError, refetch } = useQuery<FeatureStates>({
    queryKey: ['channel', channelId, 'features'],
    queryFn: () =>
      apiClient
        .get<{ data: Array<{ featureKey: string; isEnabled: boolean }> }>(`/v1/channels/${channelId}/features`)
        .then((r) =>
          Object.fromEntries(r.data.data.map((f) => [f.featureKey, f.isEnabled]))
        ),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiClient.post(`/v1/channels/${channelId}/features/${key}/toggle`, { enabled }),
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['channel', channelId, 'features'] })
      const prev = queryClient.getQueryData<FeatureStates>(['channel', channelId, 'features'])
      queryClient.setQueryData<FeatureStates>(['channel', channelId, 'features'], (old) => ({
        ...old,
        [key]: enabled,
      }))
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['channel', channelId, 'features'], ctx?.prev)
      addToast('error', 'Failed to update feature')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'features'] })
    },
  })

  return (
    <ErrorBoundary>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <PageHeader title="Features" subtitle="Enable features for your channel" />

        <View className="px-5 py-4 gap-3">
          {/* OAuth info banner */}
          <View
            className="rounded-xl p-4 flex-row items-start gap-3"
            style={{
              backgroundColor: 'rgba(59,130,246,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(59,130,246,0.3)',
            }}
          >
            <View className="w-6 h-6 rounded-full items-center justify-center mt-0.5" style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
              <Text className="text-xs font-bold" style={{ color: '#60a5fa' }}>i</Text>
            </View>
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold" style={{ color: '#60a5fa' }}>Progressive OAuth</Text>
              <Text className="text-xs leading-5" style={{ color: '#8889a0' }}>
                NoMercyBot only requests permissions for features you actually enable. Enabling a feature may prompt you to authorize additional Twitch permissions.
              </Text>
            </View>
          </View>

          {/* Features grid */}
          {isError ? (
            <ErrorState title="Unable to load features" onRetry={refetch} />
          ) : (
          <View className="flex-row flex-wrap gap-4">
            {showSkeleton
              ? Array.from({ length: 12 }).map((_, i) => (
                  <View key={i} style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
                    <Skeleton className="h-40 rounded-xl" />
                  </View>
                ))
              : FEATURES.map((feature) => (
                  <View key={feature.key} style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
                    <FeatureCard
                      feature={feature}
                      enabled={featureStates?.[feature.key] ?? false}
                      onToggle={(key, value) => toggleMutation.mutate({ key, enabled: value })}
                      isLoading={toggleMutation.isPending}
                    />
                  </View>
                ))}
          </View>
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
