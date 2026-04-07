import { useState, useEffect } from 'react'
import { ScrollView, View, Text, RefreshControl } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useChannelStore } from '@/stores/useChannelStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { getMusicConfig, updateMusicConfig } from '@/features/music/api'
import type { MusicConfig } from '@/features/music/types'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'

const TRUST_LEVEL_LABELS: Record<string, string> = {
  everyone: 'Everyone',
  subscribers: 'Subscribers only',
  vip: 'VIPs and above',
  moderators: 'Moderators only',
  broadcaster: 'Broadcaster only',
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      <View
        className="px-4 py-3"
        style={{ backgroundColor: '#1e1f2a', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>
          {title}
        </Text>
      </View>
      <View className="px-4 py-3 gap-3">{children}</View>
    </View>
  )
}

export default function MusicSettingsScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id ?? '')
  const qc = useQueryClient()

  const { data: config, isLoading, isError, isRefetching, refetch } = useQuery<MusicConfig>({
    queryKey: ['music', 'config', channelId],
    queryFn: () => getMusicConfig(channelId),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const [isEnabled, setIsEnabled] = useState(true)
  const [allowSpotify, setAllowSpotify] = useState(true)
  const [allowYouTube, setAllowYouTube] = useState(true)
  const [maxQueue, setMaxQueue] = useState('50')
  const [maxPerUser, setMaxPerUser] = useState('5')

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isEnabled)
      setAllowSpotify(config.allowSpotify)
      setAllowYouTube(config.allowYouTube)
      setMaxQueue(String(config.maxQueueSize))
      setMaxPerUser(String(config.maxRequestsPerUser))
    }
  }, [config])

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MusicConfig>) => updateMusicConfig(channelId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['music', 'config', channelId] })
    },
  })

  const handleSave = () => {
    const maxQueueSize = Math.min(500, Math.max(1, parseInt(maxQueue, 10) || 50))
    const maxRequestsPerUser = Math.min(50, Math.max(1, parseInt(maxPerUser, 10) || 5))
    saveMutation.mutate({ isEnabled, allowSpotify, allowYouTube, maxQueueSize, maxRequestsPerUser })
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader title="Music Settings" backHref="/(dashboard)/music" />

        <View className="px-5 pt-4 gap-4">
          {/* Provider */}
          <SectionCard title="Provider">
            {showSkeleton ? (
              <Skeleton className="h-6 w-32 rounded" />
            ) : (
              <View className="flex-row items-center gap-2">
                <Text className="text-sm" style={{ color: '#8889a0' }}>Preferred provider:</Text>
                <Text className="text-sm font-medium text-white capitalize">
                  {config?.preferredProvider ?? '—'}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Availability */}
          <SectionCard title="Availability">
            <Toggle
              label="Enable music requests"
              description="Allow chat to request songs"
              value={isEnabled}
              onValueChange={setIsEnabled}
              disabled={isLoading}
            />
            <Toggle
              label="Allow Spotify"
              description="Accept Spotify track links and searches"
              value={allowSpotify}
              onValueChange={setAllowSpotify}
              disabled={isLoading}
            />
            <Toggle
              label="Allow YouTube"
              description="Accept YouTube links and searches"
              value={allowYouTube}
              onValueChange={setAllowYouTube}
              disabled={isLoading}
            />
          </SectionCard>

          {/* Who can request */}
          <SectionCard title="Who Can Request">
            <Text className="text-sm text-white">
              {TRUST_LEVEL_LABELS[config?.minTrustLevel ?? 'everyone']}
            </Text>
            <Text className="text-xs" style={{ color: '#5a5b72' }}>
              Trust level is configured via chat commands.
            </Text>
          </SectionCard>

          {/* Limits */}
          <SectionCard title="Limits">
            <Input
              label="Max queue size (1–500)"
              value={maxQueue}
              onChangeText={setMaxQueue}
              keyboardType="number-pad"
              maxLength={3}
              editable={!isLoading}
            />
            <Input
              label="Max requests per user (1–50)"
              value={maxPerUser}
              onChangeText={setMaxPerUser}
              keyboardType="number-pad"
              maxLength={2}
              editable={!isLoading}
            />
          </SectionCard>

          <Button
            label={saveMutation.isPending ? 'Saving…' : 'Save Settings'}
            onPress={handleSave}
            disabled={isLoading || saveMutation.isPending}
          />

          {saveMutation.isSuccess && (
            <Text className="text-center text-sm" style={{ color: '#4ade80' }}>Settings saved</Text>
          )}
          {saveMutation.isError && (
            <Text className="text-center text-sm" style={{ color: '#f87171' }}>Failed to save settings</Text>
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
