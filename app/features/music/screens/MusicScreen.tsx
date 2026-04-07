import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Image } from 'expo-image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Pause, SkipForward, Volume2, Music2, X } from 'lucide-react-native'
import { useChannelStore } from '@/stores/useChannelStore'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getNowPlaying,
  getQueue,
  skipTrack,
  pauseTrack,
  resumeTrack,
  addToQueue,
  removeFromQueue,
} from '../api'
import { useMusic } from '../hooks/useMusic'
import type { NowPlaying, QueueItem } from '../types'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'

const fmtDuration = (ms: number) => {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const TABS = [
  { key: 'nowplaying', label: 'Now Playing' },
  { key: 'queue', label: 'Queue' },
  { key: 'history', label: 'History' },
]

// ---------------------------------------------------------------------------
// Now Playing Card
// ---------------------------------------------------------------------------

function NowPlayingCard({
  channelId,
  np,
  isLoading,
}: {
  channelId: string
  np: NowPlaying | null | undefined
  isLoading: boolean
}) {
  const qc = useQueryClient()

  const skipMutation = useMutation({
    mutationFn: () => skipTrack(channelId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['music', 'now-playing', channelId] })
      qc.invalidateQueries({ queryKey: ['music', 'queue', channelId] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: () => (np?.isPlaying ? pauseTrack(channelId) : resumeTrack(channelId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['music', 'now-playing', channelId] })
    },
  })

  const progressPct =
    np && np.durationMs > 0 ? (np.progressMs / np.durationMs) * 100 : 0

  return (
    <Card className="items-center gap-4 py-6 px-4 mx-4 mt-4">
      {/* Album art */}
      {isLoading ? (
        <Skeleton className="h-32 w-32 rounded-xl" />
      ) : (
        <View className="h-32 w-32 rounded-xl items-center justify-center overflow-hidden" style={{ backgroundColor: '#16171f' }}>
          {np?.imageUrl ? (
            <Image
              source={{ uri: np.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <Text className="text-4xl">🎵</Text>
          )}
        </View>
      )}

      {/* Track info */}
      {isLoading ? (
        <View className="items-center gap-2 w-full px-8">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </View>
      ) : (
        <View className="items-center gap-1 w-full px-4">
          <Text className="text-base font-semibold text-white text-center" numberOfLines={1}>
            {np?.trackName ?? 'Nothing playing'}
          </Text>
          {np?.artist ? (
            <Text className="text-sm" style={{ color: '#8889a0' }} numberOfLines={1}>
              {np.artist}
              {np.album ? ` · ${np.album}` : ''}
            </Text>
          ) : null}
          {np?.requestedBy ? (
            <Text className="text-xs mt-0.5" style={{ color: '#5a5b72' }}>
              Requested by {np.requestedBy}
            </Text>
          ) : null}
        </View>
      )}

      {/* Progress bar */}
      <View className="w-full px-4 gap-1">
        <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1e1f2a' }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, backgroundColor: '#7C3AED' }}
          />
        </View>
        <View className="flex-row justify-between">
          <Text className="text-xs" style={{ color: '#5a5b72' }}>
            {np ? fmtDuration(np.progressMs) : '0:00'}
          </Text>
          <Text className="text-xs" style={{ color: '#5a5b72' }}>
            {np ? fmtDuration(np.durationMs) : '0:00'}
          </Text>
        </View>
      </View>

      {/* Playback controls */}
      <View className="flex-row items-center gap-6">
        <Pressable
          onPress={() => toggleMutation.mutate()}
          className="h-12 w-12 rounded-full items-center justify-center"
          style={{ backgroundColor: '#7C3AED' }}
          disabled={toggleMutation.isPending || !np}
        >
          {np?.isPlaying ? (
            <Pause size={22} color="white" />
          ) : (
            <Play size={22} color="white" />
          )}
        </Pressable>
        <Pressable
          onPress={() => skipMutation.mutate()}
          className="p-2"
          disabled={skipMutation.isPending || !np}
        >
          <SkipForward size={24} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Volume / provider indicator */}
      {np != null && (
        <View className="flex-row items-center gap-2">
          <Volume2 size={14} color="#5a5b72" />
          <Text className="text-xs" style={{ color: '#8889a0' }}>{np.volume}%</Text>
          <Text className="text-xs ml-2 capitalize" style={{ color: '#5a5b72' }}>{np.provider}</Text>
        </View>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Queue Tab
// ---------------------------------------------------------------------------

function QueueTab({ channelId }: { channelId: string }) {
  const qc = useQueryClient()
  const [query, setQuery] = useState('')
  const [removingPositions, setRemovingPositions] = useState<Set<number>>(new Set())

  const { data: queue, isLoading, isError, refetch, isRefetching } = useQuery<QueueItem[]>({
    queryKey: ['music', 'queue', channelId],
    queryFn: () => getQueue(channelId),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const addMutation = useMutation({
    mutationFn: (q: string) => addToQueue(channelId, q),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['music', 'queue', channelId] })
      setQuery('')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (position: number) => {
      setRemovingPositions((prev) => new Set(prev).add(position))
      return removeFromQueue(channelId, position)
    },
    onSuccess: (_data, position) => {
      setRemovingPositions((prev) => {
        const next = new Set(prev)
        next.delete(position)
        return next
      })
      qc.invalidateQueries({ queryKey: ['music', 'queue', channelId] })
    },
    onError: (_err, position) => {
      setRemovingPositions((prev) => {
        const next = new Set(prev)
        next.delete(position)
        return next
      })
    },
  })

  const handleAdd = useCallback(() => {
    if (query.trim()) addMutation.mutate(query.trim())
  }, [query, addMutation])

  const renderItem = ({ item }: { item: QueueItem }) => (
    <View className="flex-row items-center gap-3 py-2.5" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
      <Text className="text-xs w-5 text-right" style={{ color: '#5a5b72' }}>{item.position}</Text>
      <View className="h-10 w-10 rounded-lg items-center justify-center overflow-hidden flex-shrink-0" style={{ backgroundColor: '#16171f' }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: 40, height: 40 }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-base">🎵</Text>
        )}
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-sm text-white" numberOfLines={1}>
          {item.trackName}
        </Text>
        <Text className="text-xs" style={{ color: '#8889a0' }} numberOfLines={1}>
          {item.artist}
          {item.requestedBy ? ` · ${item.requestedBy}` : ''}
        </Text>
      </View>
      <Text className="text-xs mr-1" style={{ color: '#5a5b72' }}>{fmtDuration(item.durationMs)}</Text>
      <Pressable
        onPress={() => removeMutation.mutate(item.position)}
        className="p-1.5"
        disabled={removingPositions.has(item.position)}
      >
        <X size={16} color="#6b7280" />
      </Pressable>
    </View>
  )

  return (
    <View className="flex-1">
      {/* Add to queue input */}
      <View className="flex-row items-center gap-2 px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
        <TextInput
          className="flex-1 rounded-lg px-3 py-2 text-sm text-white"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
          placeholder="Search or paste Spotify URI..."
          placeholderTextColor="#3a3b4f"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Button
          label="Add"
          onPress={handleAdd}
          size="sm"
          disabled={!query.trim() || addMutation.isPending}
        />
      </View>

      {showSkeleton ? (
        <View className="gap-2 p-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon={<Music2 size={48} color="#f87171" />}
          title="Failed to load queue"
          message="Pull down to retry"
        />
      ) : (
        <FlatList
          data={queue ?? []}
          keyExtractor={(item) => String(item.position)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#a78bfa" />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Music2 size={48} color="#9ca3af" />}
              title="Queue is empty"
              message="Add songs using the input above"
            />
          }
        />
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// History Tab — no backend endpoint yet
// ---------------------------------------------------------------------------

function HistoryTab() {
  return (
    <EmptyState
      icon={<Music2 size={48} color="#9ca3af" />}
      title="History not available"
      message="Song history is coming in a future update"
    />
  )
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export function MusicScreen() {
  const { t: tRaw } = useFeatureTranslation('music')
  const t = tRaw as (key: string) => string
  const channelId = useChannelStore((s) => s.currentChannel?.id ?? '')
  const { isDesktop } = useBreakpoint()

  // Subscribe to real-time SignalR events so queries auto-refresh on track/queue changes
  useMusic()

  const { data: nowPlaying, isLoading: npLoading, isError: npError } = useQuery<NowPlaying | null>({
    queryKey: ['music', 'now-playing', channelId],
    queryFn: () => getNowPlaying(channelId),
    enabled: !!channelId,
    refetchInterval: 5000,
  })

  const npTimedOut = useLoadingTimeout(npLoading)
  const npShowSkeleton = npLoading && !npError && !npTimedOut

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader title={t('title')} subtitle="Control playback and manage song requests" />
        <FeatureDisabledBanner featureKey="song_requests" />

        {isDesktop ? (
          // Desktop: 2-column layout
          <View className="flex-1 flex-row gap-0">
            {/* Left: Now Playing (fixed width) */}
            <View
              style={{
                width: 400,
                borderRightWidth: 1,
                borderRightColor: '#2a2b3a',
              }}
            >
              <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
                <NowPlayingCard
                  channelId={channelId}
                  np={nowPlaying}
                  isLoading={npShowSkeleton}
                />
              </ScrollView>
            </View>
            {/* Right: Queue + History */}
            <View className="flex-1 flex-col">
              <QueueTab channelId={channelId} />
            </View>
          </View>
        ) : (
          // Mobile: stacked
          <>
            <NowPlayingCard
              channelId={channelId}
              np={nowPlaying}
              isLoading={npShowSkeleton}
            />
            <QueueTab channelId={channelId} />
          </>
        )}
      </View>
    </ErrorBoundary>
  )
}
