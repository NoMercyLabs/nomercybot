import { useState } from 'react'
import { View, Text, ScrollView, Alert, RefreshControl, Pressable, TextInput } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useApiMutation } from '@/hooks/useApi'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { formatRelativeTime } from '@/lib/utils/format'
import {
  Radio, Eye, Clock, Activity, Film, Zap, Edit2, X, Check,
  Users, Globe, AlertTriangle,
} from 'lucide-react-native'

interface StreamInfo {
  isLive: boolean
  title: string
  gameName: string
  gameId: string
  viewerCount: number
  followerCount: number
  uptime: number | null
  bitrate: number | null
  fps: number | null
  thumbnailUrl: string | null
  language?: string
  tags?: string[]
  lastStreamedAt?: string | null
  startedAt?: string | null
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <View
      className="flex-row items-center justify-between py-3"
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      <View className="flex-row items-center gap-2.5">
        {icon}
        <Text className="text-sm" style={{ color: '#8889a0' }}>{label}</Text>
      </View>
      <Text className="text-sm font-medium text-white">{value}</Text>
    </View>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      <View
        className="px-4 py-3"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a', backgroundColor: '#1e1f2a' }}
      >
        <Text className="text-sm font-semibold text-white">{title}</Text>
      </View>
      <View className="px-4">{children}</View>
    </View>
  )
}

const CONTENT_LABELS = [
  { label: 'Mature Content', key: 'mature' },
  { label: 'Violence / Gore', key: 'violence' },
  { label: 'Sexual Themes', key: 'sexual' },
  { label: 'Drug Use', key: 'drugs' },
]

export function StreamScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const { isDesktop } = useBreakpoint()

  const [editTitle, setEditTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editGame, setEditGame] = useState(false)
  const [newGame, setNewGame] = useState('')
  const [newTag, setNewTag] = useState('')
  const [localTags, setLocalTags] = useState<string[]>([])
  const [contentLabels, setContentLabels] = useState<Record<string, boolean>>({})

  const { data, isLoading, isError, isRefetching, refetch } = useQuery<StreamInfo>({
    queryKey: ['stream', channelId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: StreamInfo }>(`/v1/channels/${channelId}/stream`)
      return res.data.data
    },
    enabled: !!channelId,
    refetchInterval: 15_000,
    select: (d) => {
      if (!localTags.length && d.tags?.length) setLocalTags(d.tags)
      return d
    },
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const updateTitleMutation = useApiMutation<StreamInfo, { title: string }>(
    '/stream/title', 'patch',
    { invalidateKeys: ['stream'], successMessage: 'Stream title updated', onSuccess: () => setEditTitle(false) },
  )

  const updateGameMutation = useApiMutation<StreamInfo, { gameName: string }>(
    '/stream/game', 'patch',
    { invalidateKeys: ['stream'], successMessage: 'Stream category updated', onSuccess: () => setEditGame(false) },
  )

  const updateTagsMutation = useApiMutation<StreamInfo, { tags: string[] }>(
    '/stream/tags', 'patch',
    { invalidateKeys: ['stream'], successMessage: 'Tags updated' },
  )

  const TITLE_MAX = 140

  function removeTag(tag: string) {
    setLocalTags((prev) => prev.filter((t) => t !== tag))
  }

  function addTag() {
    const trimmed = newTag.trim()
    if (!trimmed || localTags.length >= 10) return
    setLocalTags((prev) => [...prev, trimmed])
    setNewTag('')
  }

  const isDirty =
    (editTitle ? false : newTitle !== '' && newTitle !== data?.title) ||
    (editGame ? false : newGame !== '' && newGame !== data?.gameName) ||
    (() => {
      if (!data?.tags) return false
      return (
        localTags.length !== data.tags.length ||
        localTags.some((t, i) => t !== data.tags![i])
      )
    })() ||
    Object.values(contentLabels).some(Boolean)

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Stream Info"
          subtitle={data?.isLive ? 'Live now' : 'Not streaming'}
          rightContent={
            <View className="flex-row items-center gap-2.5">
              {data?.isLive && (
                <View className="flex-row items-center gap-1.5 px-2.5 py-1 rounded"
                  style={{ backgroundColor: '#22c55e' }}>
                  <View className="w-1.5 h-1.5 rounded-full bg-white" />
                  <Text className="text-xs font-bold text-white">LIVE</Text>
                </View>
              )}
              <Button
                size="sm"
                label="Update Stream"
                loading={updateTitleMutation.isPending || updateGameMutation.isPending || updateTagsMutation.isPending}
                onPress={() => {
                  if (newTitle && newTitle !== data?.title) updateTitleMutation.mutate({ title: newTitle })
                  if (newGame && newGame !== data?.gameName) updateGameMutation.mutate({ gameName: newGame })
                  const tagsChanged = localTags.length !== (data?.tags?.length ?? 0) || localTags.some((t, i) => t !== (data?.tags ?? [])[i])
                  if (tagsChanged) updateTagsMutation.mutate({ tags: localTags })
                }}
              />
            </View>
          }
        />

        {/* Unsaved changes banner */}
        {isDirty && (
          <View
            className="mx-5 mt-4 rounded-xl flex-row items-center justify-between px-4 py-3"
            style={{ backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)' }}
          >
            <Text className="text-sm font-medium" style={{ color: '#fbbf24' }}>
              ⚠ You have unsaved changes
            </Text>
            <View className="flex-row gap-2">
              <Button
                size="sm"
                variant="ghost"
                label="Discard"
                onPress={() => {
                  setNewTitle(data?.title ?? '')
                  setNewGame(data?.gameName ?? '')
                  setLocalTags(data?.tags ?? [])
                  setContentLabels({})
                }}
              />
              <Button
                size="sm"
                label="Save"
                loading={updateTitleMutation.isPending || updateGameMutation.isPending || updateTagsMutation.isPending}
                onPress={() => {
                  if (newTitle && newTitle !== data?.title) updateTitleMutation.mutate({ title: newTitle })
                  if (newGame && newGame !== data?.gameName) updateGameMutation.mutate({ gameName: newGame })
                  const tagsChanged =
                    localTags.length !== (data?.tags?.length ?? 0) ||
                    localTags.some((t, i) => t !== (data?.tags ?? [])[i])
                  if (tagsChanged) updateTagsMutation.mutate({ tags: localTags })
                }}
              />
            </View>
          </View>
        )}

        {isError || timedOut ? (
          <ErrorState title="Unable to load stream info" onRetry={refetch} />
        ) : showSkeleton ? (
          <View className="px-5 pt-4 gap-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </View>
        ) : (
          <View className="px-5 pt-4 gap-4">
            {isDesktop ? (
              <View className="flex-row gap-5" style={{ alignItems: 'flex-start' }}>
                {/* Left: form fields */}
                <View className="gap-4" style={{ flex: 3 }}>
                  {/* Stream title */}
                  <SectionCard title="Stream Title">
                    <View className="py-3 gap-2.5">
                      {editTitle ? (
                        <>
                          <TextInput
                            value={newTitle}
                            onChangeText={(v) => setNewTitle(v.slice(0, TITLE_MAX))}
                            placeholder="Enter stream title..."
                            placeholderTextColor="#3a3b4f"
                            className="text-sm text-white rounded-lg px-3 py-2.5"
                            style={{
                              backgroundColor: '#1e1f2a',
                              borderWidth: 1,
                              borderColor: '#2a2b3a',
                              outlineStyle: 'none',
                            } as any}
                            autoFocus
                            multiline
                          />
                          <View className="flex-row items-center justify-between">
                            <Text className="text-xs" style={{ color: '#5a5b72' }}>
                              {newTitle.length}/{TITLE_MAX}
                            </Text>
                            <View className="flex-row gap-2">
                              <Button size="sm" variant="ghost" label="Cancel" onPress={() => setEditTitle(false)} />
                              <Button size="sm" label="Save" loading={updateTitleMutation.isPending} onPress={() => { if (newTitle.trim()) updateTitleMutation.mutate({ title: newTitle.trim() }) }} />
                            </View>
                          </View>
                        </>
                      ) : (
                        <>
                          <View className="flex-row items-start justify-between gap-2">
                            <Text className="text-sm text-white flex-1" style={{ lineHeight: 20 }}>
                              {data?.title || 'No title set'}
                            </Text>
                            <Pressable
                              onPress={() => { setNewTitle(data?.title ?? ''); setEditTitle(true) }}
                              className="p-1.5 rounded-lg"
                              style={{ backgroundColor: '#1e1f2a' }}
                            >
                              <Edit2 size={13} color="#8889a0" />
                            </Pressable>
                          </View>
                          <Text className="text-xs" style={{ color: '#5a5b72' }}>
                            {(data?.title ?? '').length} / {TITLE_MAX} characters
                          </Text>
                        </>
                      )}
                    </View>
                  </SectionCard>

                  {/* Game / Category */}
                  <SectionCard title="Game / Category">
                    <View className="py-3 gap-2.5">
                      {editGame ? (
                        <>
                          <TextInput
                            value={newGame}
                            onChangeText={setNewGame}
                            placeholder="Search game or category..."
                            placeholderTextColor="#3a3b4f"
                            className="text-sm text-white rounded-lg px-3 py-2.5"
                            style={{
                              backgroundColor: '#1e1f2a',
                              borderWidth: 1,
                              borderColor: '#2a2b3a',
                              outlineStyle: 'none',
                            } as any}
                            autoFocus
                          />
                          <View className="flex-row justify-end gap-2">
                            <Button size="sm" variant="ghost" label="Cancel" onPress={() => setEditGame(false)} />
                            <Button size="sm" label="Save" loading={updateGameMutation.isPending} onPress={() => { if (newGame.trim()) updateGameMutation.mutate({ gameName: newGame.trim() }) }} />
                          </View>
                        </>
                      ) : (
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm text-white">{data?.gameName || 'No category set'}</Text>
                          <Pressable
                            onPress={() => { setNewGame(data?.gameName ?? ''); setEditGame(true) }}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: '#1e1f2a' }}
                          >
                            <Edit2 size={13} color="#8889a0" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </SectionCard>

                  {/* Tags */}
                  <SectionCard title={`Tags (${localTags.length}/10)`}>
                    <View className="py-3 gap-3">
                      <View className="flex-row flex-wrap gap-2">
                        {localTags.map((tag) => (
                          <Pressable
                            key={tag}
                            onPress={() => removeTag(tag)}
                            className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: '#7C3AED' }}
                          >
                            <Text className="text-xs font-medium" style={{ color: '#a78bfa' }}>{tag}</Text>
                            <X size={10} color="#7C3AED" />
                          </Pressable>
                        ))}
                      </View>
                      {localTags.length < 10 && (
                        <View className="flex-row items-center gap-2">
                          <TextInput
                            value={newTag}
                            onChangeText={setNewTag}
                            placeholder="Add tag..."
                            placeholderTextColor="#3a3b4f"
                            className="flex-1 text-sm text-white rounded-lg px-3 py-2"
                            style={{
                              backgroundColor: '#1e1f2a',
                              borderWidth: 1,
                              borderColor: '#2a2b3a',
                              outlineStyle: 'none',
                            } as any}
                            onSubmitEditing={addTag}
                          />
                          <Pressable
                            onPress={addTag}
                            className="px-3 py-2 rounded-lg"
                            style={{ backgroundColor: '#7C3AED' }}
                          >
                            <Text className="text-xs font-medium text-white">Add</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </SectionCard>
                </View>

                {/* Right: stats sidebar */}
                <View className="gap-4" style={{ flex: 2, minWidth: 280 }}>
                  {/* Current Stream */}
                  <SectionCard title="Current Stream">
                    {data?.isLive ? (
                      <>
                        <StatRow label="Status" value="Live" icon={<View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />} />
                        <StatRow label="Viewers" value={(data.viewerCount ?? 0).toLocaleString()} icon={<Eye size={14} color="#8889a0" />} />
                        {data.uptime != null && (
                          <StatRow label="Uptime" value={formatUptime(data.uptime)} icon={<Clock size={14} color="#8889a0" />} />
                        )}
                        {data.bitrate != null && (
                          <StatRow label="Bitrate" value={`${data.bitrate.toLocaleString()} kbps`} icon={<Activity size={14} color="#8889a0" />} />
                        )}
                      </>
                    ) : (
                      <View className="py-6 items-center gap-2">
                        <Zap size={28} color="#2a2b3a" />
                        <Text className="text-sm" style={{ color: '#3a3b4f' }}>Offline</Text>
                      </View>
                    )}
                  </SectionCard>

                  {/* Content Labels */}
                  <SectionCard title="Content Labels">
                    {CONTENT_LABELS.map((label, i) => (
                      <View
                        key={label.key}
                        className="flex-row items-center justify-between py-3"
                        style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                      >
                        <Text className="text-sm" style={{ color: '#cdcede' }}>{label.label}</Text>
                        <Toggle
                          value={contentLabels[label.key] ?? false}
                          onValueChange={(v) => setContentLabels((p) => ({ ...p, [label.key]: v }))}
                        />
                      </View>
                    ))}
                  </SectionCard>
                </View>
              </View>
            ) : (
              <View className="gap-4">
                {/* Stream title */}
                <SectionCard title="Stream Title">
                  <View className="py-3 gap-2.5">
                    {editTitle ? (
                      <>
                        <TextInput
                          value={newTitle}
                          onChangeText={(v) => setNewTitle(v.slice(0, TITLE_MAX))}
                          placeholder="Enter stream title..."
                          placeholderTextColor="#3a3b4f"
                          className="text-sm text-white rounded-lg px-3 py-2.5"
                          style={{
                            backgroundColor: '#1e1f2a',
                            borderWidth: 1,
                            borderColor: '#2a2b3a',
                            outlineStyle: 'none',
                          } as any}
                          autoFocus
                          multiline
                        />
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs" style={{ color: '#5a5b72' }}>
                            {newTitle.length}/{TITLE_MAX}
                          </Text>
                          <View className="flex-row gap-2">
                            <Button size="sm" variant="ghost" label="Cancel" onPress={() => setEditTitle(false)} />
                            <Button size="sm" label="Save" loading={updateTitleMutation.isPending} onPress={() => { if (newTitle.trim()) updateTitleMutation.mutate({ title: newTitle.trim() }) }} />
                          </View>
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="flex-row items-start justify-between gap-2">
                          <Text className="text-sm text-white flex-1" style={{ lineHeight: 20 }}>
                            {data?.title || 'No title set'}
                          </Text>
                          <Pressable
                            onPress={() => { setNewTitle(data?.title ?? ''); setEditTitle(true) }}
                            className="p-1.5 rounded-lg"
                            style={{ backgroundColor: '#1e1f2a' }}
                          >
                            <Edit2 size={13} color="#8889a0" />
                          </Pressable>
                        </View>
                        <Text className="text-xs" style={{ color: '#5a5b72' }}>
                          {(data?.title ?? '').length} / {TITLE_MAX} characters
                        </Text>
                      </>
                    )}
                  </View>
                </SectionCard>

                {/* Game / Category */}
                <SectionCard title="Game / Category">
                  <View className="py-3 gap-2.5">
                    {editGame ? (
                      <>
                        <TextInput
                          value={newGame}
                          onChangeText={setNewGame}
                          placeholder="Search game or category..."
                          placeholderTextColor="#3a3b4f"
                          className="text-sm text-white rounded-lg px-3 py-2.5"
                          style={{
                            backgroundColor: '#1e1f2a',
                            borderWidth: 1,
                            borderColor: '#2a2b3a',
                            outlineStyle: 'none',
                          } as any}
                          autoFocus
                        />
                        <View className="flex-row justify-end gap-2">
                          <Button size="sm" variant="ghost" label="Cancel" onPress={() => setEditGame(false)} />
                          <Button size="sm" label="Save" loading={updateGameMutation.isPending} onPress={() => { if (newGame.trim()) updateGameMutation.mutate({ gameName: newGame.trim() }) }} />
                        </View>
                      </>
                    ) : (
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-white">{data?.gameName || 'No category set'}</Text>
                        <Pressable
                          onPress={() => { setNewGame(data?.gameName ?? ''); setEditGame(true) }}
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: '#1e1f2a' }}
                        >
                          <Edit2 size={13} color="#8889a0" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </SectionCard>

                {/* Tags */}
                <SectionCard title={`Tags (${localTags.length}/10)`}>
                  <View className="py-3 gap-3">
                    <View className="flex-row flex-wrap gap-2">
                      {localTags.map((tag) => (
                        <Pressable
                          key={tag}
                          onPress={() => removeTag(tag)}
                          className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: 'rgba(124,58,237,0.2)', borderWidth: 1, borderColor: '#7C3AED' }}
                        >
                          <Text className="text-xs font-medium" style={{ color: '#a78bfa' }}>{tag}</Text>
                          <X size={10} color="#7C3AED" />
                        </Pressable>
                      ))}
                    </View>
                    {localTags.length < 10 && (
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          value={newTag}
                          onChangeText={setNewTag}
                          placeholder="Add tag..."
                          placeholderTextColor="#3a3b4f"
                          className="flex-1 text-sm text-white rounded-lg px-3 py-2"
                          style={{
                            backgroundColor: '#1e1f2a',
                            borderWidth: 1,
                            borderColor: '#2a2b3a',
                            outlineStyle: 'none',
                          } as any}
                          onSubmitEditing={addTag}
                        />
                        <Pressable
                          onPress={addTag}
                          className="px-3 py-2 rounded-lg"
                          style={{ backgroundColor: '#7C3AED' }}
                        >
                          <Text className="text-xs font-medium text-white">Add</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </SectionCard>

                {/* Stats + sidebar */}
                <View className="flex-row gap-3" style={{ flexWrap: 'wrap' }}>
                  {/* Current Stream */}
                  <View className="flex-1" style={{ minWidth: 180 }}>
                    <SectionCard title="Current Stream">
                      {data?.isLive ? (
                        <>
                          <StatRow label="Status" value="Live" icon={<View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }} />} />
                          <StatRow label="Viewers" value={(data.viewerCount ?? 0).toLocaleString()} icon={<Eye size={14} color="#8889a0" />} />
                          {data.uptime != null && (
                            <StatRow label="Uptime" value={formatUptime(data.uptime)} icon={<Clock size={14} color="#8889a0" />} />
                          )}
                          {data.bitrate != null && (
                            <StatRow label="Bitrate" value={`${data.bitrate.toLocaleString()} kbps`} icon={<Activity size={14} color="#8889a0" />} />
                          )}
                        </>
                      ) : (
                        <View className="py-6 items-center gap-2">
                          <Zap size={28} color="#2a2b3a" />
                          <Text className="text-sm" style={{ color: '#3a3b4f' }}>No active stream</Text>
                          {data?.lastStreamedAt && (
                            <Text className="text-xs" style={{ color: '#2a2b3a' }}>
                              Last streamed {formatRelativeTime(data.lastStreamedAt)}
                            </Text>
                          )}
                        </View>
                      )}
                    </SectionCard>
                  </View>

                  {/* Content Labels */}
                  <View className="flex-1" style={{ minWidth: 180 }}>
                    <SectionCard title="Content Labels">
                      {CONTENT_LABELS.map((label, i) => (
                        <View
                          key={label.key}
                          className="flex-row items-center justify-between py-3"
                          style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                        >
                          <Text className="text-sm" style={{ color: '#cdcede' }}>{label.label}</Text>
                          <Toggle
                            value={contentLabels[label.key] ?? false}
                            onValueChange={(v) => setContentLabels((p) => ({ ...p, [label.key]: v }))}
                          />
                        </View>
                      ))}
                    </SectionCard>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ErrorBoundary>
  )
}
