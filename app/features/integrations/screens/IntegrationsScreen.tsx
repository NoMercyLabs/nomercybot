import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RefreshControl, Linking, Platform } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as WebBrowser from 'expo-web-browser'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Puzzle, Link, Link2Off, CheckCircle2, Clock, Bot, Check } from 'lucide-react-native'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { useBreakpoint } from '@/hooks/useBreakpoint'

interface Integration {
  id: string
  name: string
  description: string
  connected: boolean
  connectedAs?: string
  oauthUrl?: string
  category: string
  lastSync?: string
}

interface IntegrationsResponse {
  integrations: Integration[]
}

const INTEGRATION_META: Record<string, {
  category: string
  description: string
  features?: string[]
  color: string
  logoBg: string
  logoLabel?: string
}> = {
  twitch: {
    category: 'Platform',
    description: 'Primary Twitch account -- always connected',
    features: [
      'Chat bot functionality',
      'Channel point redemptions',
      'Subscriber and follower alerts',
    ],
    color: '#9146FF',
    logoBg: '#9146FF',
  },
  custom_bot: {
    category: 'Platform',
    description: 'White-label bot -- messages appear from your own bot account',
    features: [
      'Custom bot username in chat',
      'Separate moderator permissions',
      'Channel point management',
    ],
    color: '#7C3AED',
    logoBg: '#7C3AED',
  },
  spotify: {
    category: 'Music',
    description: 'Music playback and song requests',
    features: [
      'Now playing widget on overlay',
      'Song requests via !sr command',
      'Playback control from dashboard',
      'Auto-pause on raid',
    ],
    color: '#1DB954',
    logoBg: '#1ed760',
  },
  discord: {
    category: 'Social',
    description: 'Live notifications and role management',
    features: [
      'Go-live announcements with embed',
      'Auto-assign "LIVE" role when streaming',
      'Auto-remove role when offline',
    ],
    color: '#5865F2',
    logoBg: '#5865f2',
  },
  youtube: {
    category: 'Video',
    description: 'YouTube live stream management and stats',
    features: [
      'YouTube live stream monitoring',
      'Chat integration',
      'Video statistics tracking',
    ],
    color: '#FF0000',
    logoBg: '#FF0000',
  },
  obs: {
    category: 'Streaming',
    description: 'Scene control and streaming management',
    features: [
      'Scene switching (raids, BRB, starting soon)',
      'Source visibility control',
      'Audio mixing from dashboard',
      'Start/stop streaming and recording',
    ],
    color: '#302E31',
    logoBg: '#302e3a',
    logoLabel: 'OBS',
  },
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  isLoading,
}: {
  integration: Integration
  onConnect: (id: string, oauthUrl?: string) => void
  onDisconnect: (id: string) => void
  isLoading: boolean
}) {
  const meta = INTEGRATION_META[integration.id.toLowerCase()] ?? {
    category: integration.category,
    description: integration.description,
    color: '#5a5b72',
    logoBg: '#5a5b72',
  }
  const isPrimary = integration.id.toLowerCase() === 'twitch'
  const isBot = integration.id.toLowerCase() === 'custom_bot'
  const IconComponent = isBot ? Bot : Puzzle

  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: integration.connected ? 'rgba(34,197,94,0.25)' : '#2a2b3a',
      }}
    >
      {/* Header */}
      <View className="flex-row items-center gap-4 p-5">
        <View
          className="items-center justify-center rounded-xl"
          style={{
            width: 48,
            height: 48,
            backgroundColor: meta.logoBg,
            flexShrink: 0,
          }}
        >
          {meta.logoLabel ? (
            <Text className="text-sm font-bold text-white">{meta.logoLabel}</Text>
          ) : (
            <IconComponent size={24} color="#fff" />
          )}
        </View>
        <View className="flex-1" style={{ minWidth: 0 }}>
          <Text className="font-bold text-white" style={{ fontSize: 17 }}>{integration.name}</Text>
          <Text className="text-xs mt-0.5" style={{ color: '#8889a0' }}>{meta.description}</Text>
        </View>
        <View
          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full self-start"
          style={{
            backgroundColor: integration.connected
              ? 'rgba(52,211,153,0.12)'
              : 'rgba(239,68,68,0.12)',
          }}
        >
          <View
            className="rounded-full"
            style={{
              width: 6,
              height: 6,
              backgroundColor: integration.connected ? '#34d399' : '#ef4444',
            }}
          />
          <Text
            className="text-xs font-medium"
            style={{ color: integration.connected ? '#34d399' : '#ef4444' }}
          >
            {integration.connected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Features list */}
      {meta.features && (
        <View className="px-5 pb-4 gap-1.5">
          {meta.features.map((feature) => (
            <View key={feature} className="flex-row items-start gap-2">
              <Check size={16} color="#a78bfa" style={{ marginTop: 1, flexShrink: 0 }} />
              <Text className="text-sm" style={{ color: '#aaabbe' }}>{feature}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View
        className="flex-row items-center justify-between px-5 py-4"
        style={{ borderTopWidth: 1, borderTopColor: '#1e1f2a' }}
      >
        <View className="flex-row items-center gap-2">
          {integration.connected ? (
            <>
              <Text className="text-xs" style={{ color: '#8889a0' }}>
                {integration.connectedAs
                  ? `Connected as `
                  : 'Connected'}
              </Text>
              {integration.connectedAs && (
                <Text className="text-xs font-semibold" style={{ color: '#cdcede' }}>
                  {integration.connectedAs}
                </Text>
              )}
            </>
          ) : (
            <Text className="text-xs" style={{ color: '#5a5b72' }}>Not connected</Text>
          )}
          {integration.lastSync && (
            <View className="flex-row items-center gap-1 ml-2">
              <Clock size={10} color="#3a3b4f" />
              <Text className="text-xs" style={{ color: '#3a3b4f' }}>{integration.lastSync}</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          {isPrimary ? null : integration.connected ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                label="Reconnect"
                loading={isLoading}
                onPress={() => onConnect(integration.id, integration.oauthUrl)}
              />
              <Button
                size="sm"
                variant="ghost"
                label="Disconnect"
                loading={isLoading}
                onPress={() => onDisconnect(integration.id)}
                className="border border-red-500/30"
              />
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              label={isBot ? 'Connect Bot' : `Connect ${integration.name}`}
              leftIcon={isBot ? <Bot size={13} color="#fff" /> : <Link size={13} color="#fff" />}
              loading={isLoading}
              onPress={() => onConnect(integration.id, integration.oauthUrl)}
            />
          )}
        </View>
      </View>
    </View>
  )
}

const OAUTH_SUCCESS_PARAMS: Record<string, string> = {
  spotify_connected: 'Spotify connected successfully',
  discord_connected: 'Discord connected successfully',
  youtube_connected: 'YouTube connected successfully',
  custom_bot_connected: 'Custom bot connected successfully',
}

export function IntegrationsScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const { isDesktop } = useBreakpoint()
  const [disconnectTarget, setDisconnectTarget] = useState<Integration | null>(null)
  const params = useLocalSearchParams<Record<string, string>>()
  const router = useRouter()

  useEffect(() => {
    const successKey = Object.keys(OAUTH_SUCCESS_PARAMS).find((k) => params[k] === 'true')
    if (successKey) {
      addToast('success', OAUTH_SUCCESS_PARAMS[successKey])
      queryClient.invalidateQueries({ queryKey: ['integrations', channelId] })
      if (Platform.OS === 'web') {
        const url = new URL(window.location.href)
        Object.keys(OAUTH_SUCCESS_PARAMS).forEach((k) => url.searchParams.delete(k))
        window.history.replaceState(null, '', url.toString())
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data, isLoading, isError, isRefetching, refetch } = useQuery<IntegrationsResponse>({
    queryKey: ['integrations', channelId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: IntegrationsResponse }>(
        `/v1/channels/${channelId}/integrations`,
      )
      return res.data.data
    },
    enabled: !!channelId,
  })

  const disconnectMutation = useMutation<void, Error, string>({
    mutationFn: async (integrationId) => {
      if (!channelId) throw new Error('No channel selected')
      await apiClient.delete(`/v1/channels/${channelId}/integrations/${integrationId}`)
    },
    onSuccess: () => {
      addToast('success', 'Integration disconnected')
      queryClient.invalidateQueries({ queryKey: ['integrations', channelId] })
    },
    onError: (err) => addToast('error', err.message || 'Failed to disconnect integration'),
  })

  function handleDisconnect(integrationId: string) {
    const integration = data?.integrations.find((i) => i.id === integrationId)
    if (integration) {
      setDisconnectTarget(integration)
    }
  }

  function confirmDisconnect() {
    if (disconnectTarget) {
      disconnectMutation.mutate(disconnectTarget.id)
      setDisconnectTarget(null)
    }
  }

  async function handleConnect(integrationId: string, oauthUrl?: string) {
    // OBS uses WebSocket, not OAuth
    if (integrationId === 'obs') {
      addToast('info', 'OBS uses WebSocket — install the OBS WebSocket plugin and configure it in your OBS settings.')
      return
    }

    if (!oauthUrl) {
      try {
        const res = await apiClient.get<{ data: { oauthUrl: string } }>(
          `/v1/channels/${channelId}/integrations/${integrationId}/connect`,
        )
        oauthUrl = res.data?.data?.oauthUrl
      } catch {
        addToast('error', 'Failed to get connection URL')
        return
      }
    }
    if (!oauthUrl) return

    // Bot account uses a server-side redirect -- open directly so the browser follows the
    // redirect chain through Twitch and back to the callback URL with auth cookies intact.
    if (integrationId === 'custom_bot') {
      if (Platform.OS === 'web') {
        window.location.href = oauthUrl
      } else {
        await Linking.openURL(oauthUrl)
      }
      queryClient.invalidateQueries({ queryKey: ['integrations', channelId] })
      return
    }

    await WebBrowser.openBrowserAsync(oauthUrl)
    queryClient.invalidateQueries({ queryKey: ['integrations', channelId] })
  }

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Integrations"
          subtitle="Connect external services to enhance your channel"
        />

        <View className="px-5 pt-5 gap-5">
          {isError ? (
            <ErrorState title="Unable to load integrations" onRetry={refetch} />
          ) : showSkeleton ? (
            <View
              className="flex-row flex-wrap gap-5"
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={{ flex: 1, minWidth: 340, maxWidth: isDesktop ? 500 : undefined }}>
                  <Skeleton className="h-52 rounded-xl" />
                </View>
              ))}
            </View>
          ) : !data?.integrations.length ? (
            <EmptyState
              icon={<Puzzle size={40} color="#3a3b4f" />}
              title="No integrations available"
              message="Integrations will appear here once configured."
            />
          ) : (
            <View
              className="flex-row flex-wrap gap-5"
            >
              {data.integrations.map((integration) => (
                <View
                  key={integration.id}
                  style={{
                    flex: 1,
                    minWidth: 340,
                    maxWidth: isDesktop ? 500 : undefined,
                  }}
                >
                  <IntegrationCard
                    integration={integration}
                    onConnect={handleConnect}
                    onDisconnect={handleDisconnect}
                    isLoading={disconnectMutation.isPending && disconnectMutation.variables === integration.id}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={!!disconnectTarget}
        title={`Disconnect ${disconnectTarget?.name ?? 'Integration'}`}
        message={`Are you sure you want to disconnect ${disconnectTarget?.name ?? 'this integration'}? You can reconnect it later.`}
        confirmLabel="Disconnect"
        variant="danger"
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectTarget(null)}
      />
    </ErrorBoundary>
  )
}
