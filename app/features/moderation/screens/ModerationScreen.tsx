import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native'
import { useRouter } from 'expo-router'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import {
  Link2,
  Type,
  MessageSquareX,
  Smile,
  Trash2,
  Plus,
  Ban,
  Clock,
  Trash,
  ShieldOff,
  ShieldCheck,
  Shield,
} from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { moderationApi } from '../api'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import type { AutomodConfig, ModerationBan, ModLogEntry, ModLogAction } from '../types'

interface DomainItem { value: string }
interface PhraseItem { value: string }
interface AutomodFormValues {
  linkFilter: { enabled: boolean; whitelist: DomainItem[] }
  capsFilter: { enabled: boolean; threshold: number }
  bannedPhrases: { enabled: boolean; phrases: PhraseItem[] }
  emoteSpam: { enabled: boolean; maxEmotes: number }
}

function configToForm(cfg: AutomodConfig): AutomodFormValues {
  return {
    linkFilter: { enabled: cfg.linkFilter.enabled, whitelist: cfg.linkFilter.whitelist.map((v) => ({ value: v })) },
    capsFilter: cfg.capsFilter,
    bannedPhrases: { enabled: cfg.bannedPhrases.enabled, phrases: cfg.bannedPhrases.phrases.map((v) => ({ value: v })) },
    emoteSpam: cfg.emoteSpam,
  }
}

function formToConfig(form: AutomodFormValues): AutomodConfig {
  return {
    linkFilter: { enabled: form.linkFilter.enabled, whitelist: form.linkFilter.whitelist.map((d) => d.value) },
    capsFilter: form.capsFilter,
    bannedPhrases: { enabled: form.bannedPhrases.enabled, phrases: form.bannedPhrases.phrases.map((p) => p.value) },
    emoteSpam: form.emoteSpam,
  }
}

const DEFAULT_FORM: AutomodFormValues = {
  linkFilter: { enabled: false, whitelist: [] },
  capsFilter: { enabled: false, threshold: 70 },
  bannedPhrases: { enabled: false, phrases: [] },
  emoteSpam: { enabled: false, maxEmotes: 10 },
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View
      className="flex-1 rounded-xl px-4 py-3 gap-1"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: '#2a2b3a',
        borderLeftWidth: 3,
        borderLeftColor: color,
        minWidth: 120,
      }}
    >
      <Text className="text-xl font-bold text-white">{value}</Text>
      <Text className="text-xs" style={{ color: '#5a5b72' }}>{label}</Text>
    </View>
  )
}

function AutoModTab() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, isRefetching, refetch } = useQuery<AutomodConfig>({
    queryKey: ['channel', channelId, 'automod'],
    queryFn: () => {
      if (!channelId) throw new Error('No channel selected')
      return moderationApi.getAutomodConfig(channelId)
    },
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const { control, handleSubmit, watch } = useForm<AutomodFormValues>({
    defaultValues: DEFAULT_FORM,
    values: data ? configToForm(data) : undefined,
  })

  const { fields: whitelistFields, append: appendDomain, remove: removeDomain } =
    useFieldArray({ control, name: 'linkFilter.whitelist' })
  const { fields: phraseFields, append: appendPhrase, remove: removePhrase } =
    useFieldArray({ control, name: 'bannedPhrases.phrases' })

  const [newDomain, setNewDomain] = useState('')
  const [newPhrase, setNewPhrase] = useState('')

  const saveMutation = useMutation({
    mutationFn: (form: AutomodFormValues) => {
      if (!channelId) throw new Error('No channel selected')
      return moderationApi.saveAutomodConfig(channelId, formToConfig(form))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'automod'] })
      addToast('success', 'AutoMod settings saved')
    },
    onError: () => addToast('error', 'Failed to save AutoMod settings'),
  })

  const linkEnabled = watch('linkFilter.enabled')
  const capsEnabled = watch('capsFilter.enabled')
  const phrasesEnabled = watch('bannedPhrases.enabled')
  const emoteEnabled = watch('emoteSpam.enabled')

  function handleAddDomain() {
    const trimmed = newDomain.trim()
    if (!trimmed) return
    appendDomain({ value: trimmed })
    setNewDomain('')
  }

  function handleAddPhrase() {
    const trimmed = newPhrase.trim()
    if (!trimmed) return
    appendPhrase({ value: trimmed })
    setNewPhrase('')
  }

  if (showSkeleton) {
    return (
      <View className="gap-4 p-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </View>
    )
  }

  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[
        { icon: <Link2 size={16} color="#a78bfa" />, title: 'Link Filter', controlName: 'linkFilter.enabled' as const, enabled: linkEnabled, extra: linkEnabled ? (
          <View className="gap-2.5 mt-1">
            <Text className="text-xs font-medium" style={{ color: '#8889a0' }}>Whitelisted Domains</Text>
            {whitelistFields.map((field, i) => (
              <View key={field.id} className="flex-row items-center gap-2">
                <Controller control={control} name={`linkFilter.whitelist.${i}.value`}
                  render={({ field: f }) => (
                    <View className="flex-1">
                      <Input value={f.value} onChangeText={f.onChange} placeholder="e.g. twitch.tv" autoCapitalize="none" />
                    </View>
                  )}
                />
                <Pressable onPress={() => removeDomain(i)} className="p-2 rounded-lg" style={{ backgroundColor: '#1e1f2a' }}>
                  <Trash2 size={14} color="#ef4444" />
                </Pressable>
              </View>
            ))}
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input value={newDomain} onChangeText={setNewDomain} placeholder="Add domain..." autoCapitalize="none" onSubmitEditing={handleAddDomain} />
              </View>
              <Button variant="secondary" size="sm" onPress={handleAddDomain} leftIcon={<Plus size={13} color="#a78bfa" />} label="Add" />
            </View>
          </View>
        ) : null },
        { icon: <Type size={16} color="#f59e0b" />, title: 'Caps Filter', controlName: 'capsFilter.enabled' as const, enabled: capsEnabled, extra: capsEnabled ? (
          <Controller control={control} name="capsFilter.threshold"
            render={({ field }) => (
              <View className="gap-1.5 mt-1">
                <Text className="text-sm" style={{ color: '#8889a0' }}>
                  Block if more than{' '}
                  <Text style={{ color: '#a78bfa', fontWeight: '600' }}>{field.value}%</Text> of message is caps
                </Text>
                <Input value={String(field.value)} onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) field.onChange(Math.min(100, Math.max(0, n))) }} keyboardType="numeric" placeholder="70" />
              </View>
            )}
          />
        ) : null },
        { icon: <MessageSquareX size={16} color="#ef4444" />, title: 'Banned Phrases', controlName: 'bannedPhrases.enabled' as const, enabled: phrasesEnabled, extra: phrasesEnabled ? (
          <View className="gap-2.5 mt-1">
            {phraseFields.map((field, i) => (
              <View key={field.id} className="flex-row items-center gap-2">
                <Controller control={control} name={`bannedPhrases.phrases.${i}.value`}
                  render={({ field: f }) => (<View className="flex-1"><Input value={f.value} onChangeText={f.onChange} placeholder="Phrase..." /></View>)}
                />
                <Pressable onPress={() => removePhrase(i)} className="p-2 rounded-lg" style={{ backgroundColor: '#1e1f2a' }}>
                  <Trash2 size={14} color="#ef4444" />
                </Pressable>
              </View>
            ))}
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <Input value={newPhrase} onChangeText={setNewPhrase} placeholder="Add a banned phrase..." onSubmitEditing={handleAddPhrase} />
              </View>
              <Button variant="secondary" size="sm" onPress={handleAddPhrase} leftIcon={<Plus size={13} color="#a78bfa" />} label="Add" />
            </View>
          </View>
        ) : null },
        { icon: <Smile size={16} color="#10b981" />, title: 'Emote Spam', controlName: 'emoteSpam.enabled' as const, enabled: emoteEnabled, extra: emoteEnabled ? (
          <Controller control={control} name="emoteSpam.maxEmotes"
            render={({ field }) => (
              <Input label="Max emotes per message" value={String(field.value)} onChangeText={(v) => { const n = parseInt(v, 10); if (!isNaN(n)) field.onChange(Math.max(1, n)) }} keyboardType="numeric" placeholder="10" />
            )}
          />
        ) : null },
      ].map((section) => (
        <View
          key={section.title}
          className="rounded-xl p-4 gap-3"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
        >
          <View className="flex-row items-center gap-2.5">
            {section.icon}
            <Text className="text-sm font-semibold text-white flex-1">{section.title}</Text>
          </View>
          <Controller
            control={control}
            name={section.controlName}
            render={({ field }) => (
              <Toggle value={field.value} onValueChange={field.onChange} label={`Enable ${section.title}`} />
            )}
          />
          {section.extra}
        </View>
      ))}

      <Button
        label="Save AutoMod Settings"
        loading={saveMutation.isPending}
        onPress={handleSubmit((form) => saveMutation.mutate(form))}
        className="mt-2"
      />
    </View>
  )
}

function BansTab() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const [confirmUnban, setConfirmUnban] = useState<ModerationBan | null>(null)

  const { data: bans = [], isLoading, isError: bansError, isRefetching, refetch } = useQuery<ModerationBan[]>({
    queryKey: ['channel', channelId, 'moderation-bans'],
    queryFn: () => {
      if (!channelId) throw new Error('No channel selected')
      return moderationApi.getModerationBans(channelId)
    },
    enabled: !!channelId,
  })

  const bansTimedOut = useLoadingTimeout(isLoading)
  const showBansSkeleton = isLoading && !bansError && !bansTimedOut

  const unbanMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!channelId) throw new Error('No channel selected')
      return moderationApi.unbanUser(channelId, userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'moderation-bans'] })
      addToast('success', 'User unbanned')
      setConfirmUnban(null)
    },
    onError: () => addToast('error', 'Failed to unban user'),
  })

  return (
    <>
      <View style={{ padding: 16, gap: 12 }}>
        {showBansSkeleton ? (
          <View className="gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
          </View>
        ) : bans.length === 0 ? (
          <EmptyState icon={<Ban size={40} color="#3a3b4f" />} title="No banned users" message="Banned users will appear here." />
        ) : (
          bans.map((ban) => (
            <View
              key={ban.userId}
              className="rounded-xl p-4 gap-2"
              style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
            >
              <View className="flex-row items-start gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.15)' }}>
                  <Ban size={16} color="#ef4444" />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-semibold text-white">{ban.username}</Text>
                  {ban.reason ? <Text className="text-xs" style={{ color: '#8889a0' }} numberOfLines={2}>{ban.reason}</Text> : null}
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>
                    Banned by {ban.bannedBy} · {new Date(ban.bannedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Button variant="outline" size="sm" label="Unban" onPress={() => setConfirmUnban(ban)} />
              </View>
            </View>
          ))
        )}
      </View>
      <ConfirmDialog
        visible={!!confirmUnban}
        title="Unban User"
        message={`Are you sure you want to unban ${confirmUnban?.username ?? ''}?`}
        confirmLabel="Unban"
        onConfirm={() => confirmUnban && unbanMutation.mutate(confirmUnban.userId)}
        onCancel={() => setConfirmUnban(null)}
      />
    </>
  )
}

const ACTION_CONFIG: Record<ModLogAction, { label: string; color: string; bgColor: string; Icon: typeof Ban }> = {
  ban:     { label: 'Ban',     color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)',   Icon: Ban },
  unban:   { label: 'Unban',   color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)',   Icon: ShieldCheck },
  timeout: { label: 'Timeout', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)',  Icon: Clock },
  delete:  { label: 'Delete',  color: '#eab308', bgColor: 'rgba(234,179,8,0.15)',   Icon: Trash },
}

function ModLogTab() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<ModLogEntry[]>([])
  const [hasMore, setHasMore] = useState(false)

  const { data: pageResult, isLoading, isError: logError, isFetching, refetch } = useQuery({
    queryKey: ['channel', channelId, 'moderation-log', page],
    queryFn: () => {
      if (!channelId) throw new Error('No channel selected')
      return moderationApi.getModerationLog(channelId, { page, take: 50 })
    },
    enabled: !!channelId,
  })

  const logTimedOut = useLoadingTimeout(isLoading)
  const showLogSkeleton = isLoading && page === 1 && !logError && !logTimedOut

  useEffect(() => {
    if (!pageResult) return
    if (page === 1) setEntries(pageResult.data)
    else setEntries((prev) => [...prev, ...pageResult.data])
    setHasMore(pageResult.hasMore)
  }, [pageResult, page])

  useEffect(() => {
    if (page === 1) refetch()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, gap: 10 }}
      refreshControl={<RefreshControl refreshing={isLoading && page === 1} onRefresh={() => { setEntries([]); setHasMore(false); setPage(1) }} tintColor="#a855f7" />}
    >
      {showLogSkeleton ? (
        <View className="gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </View>
      ) : entries.length === 0 ? (
        <EmptyState icon={<ShieldOff size={40} color="#3a3b4f" />} title="No mod log entries" message="Moderation actions will appear here." />
      ) : (
        <>
          {entries.map((entry) => {
            const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.ban
            const { Icon } = cfg
            return (
              <View
                key={entry.id}
                className="rounded-xl p-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.bgColor }}>
                    <Icon size={14} color={cfg.color} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text style={{ color: cfg.color }} className="text-xs font-bold uppercase">{cfg.label}</Text>
                      <Text className="text-sm font-semibold text-white">{entry.target}</Text>
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>by {entry.moderator}</Text>
                    </View>
                    {entry.reason ? <Text className="text-xs" style={{ color: '#8889a0' }} numberOfLines={1}>{entry.reason}</Text> : null}
                    {entry.duration != null ? <Text className="text-xs" style={{ color: '#5a5b72' }}>{entry.duration}s timeout</Text> : null}
                  </View>
                  <Text className="text-xs" style={{ color: '#3a3b4f' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            )
          })}
          {hasMore && (
            <Button
              label={isFetching ? 'Loading...' : 'Load more'}
              variant="secondary"
              loading={isFetching && page > 1}
              onPress={() => setPage((p) => p + 1)}
              className="mt-2"
            />
          )}
        </>
      )}
    </ScrollView>
  )
}

function BlockedTermsTab() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const [newTerm, setNewTerm] = useState('')

  const { data: terms = [], isLoading, isError: termsError, refetch, isRefetching } = useQuery<string[]>({
    queryKey: ['channel', channelId, 'blocked-terms'],
    queryFn: () =>
      apiClient
        .get<{ data: string[] }>(`/v1/channels/${channelId}/moderation/blocked-terms`)
        .then((r) => r.data.data),
    enabled: !!channelId,
  })

  const termsTimedOut = useLoadingTimeout(isLoading)
  const showTermsSkeleton = isLoading && !termsError && !termsTimedOut

  const addMutation = useMutation({
    mutationFn: (term: string) =>
      apiClient.post(`/v1/channels/${channelId}/moderation/blocked-terms`, { term }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'blocked-terms'] })
      addToast('success', 'Term blocked')
      setNewTerm('')
    },
    onError: () => addToast('error', 'Failed to add blocked term'),
  })

  const removeMutation = useMutation({
    mutationFn: (term: string) =>
      apiClient.delete(`/v1/channels/${channelId}/moderation/blocked-terms/${encodeURIComponent(term)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'blocked-terms'] })
      addToast('success', 'Term removed')
    },
  })

  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input
            placeholder="Add blocked term or phrase..."
            value={newTerm}
            onChangeText={setNewTerm}
            onSubmitEditing={() => newTerm.trim() && addMutation.mutate(newTerm.trim())}
          />
        </View>
        <Button
          variant="secondary"
          size="sm"
          loading={addMutation.isPending}
          onPress={() => newTerm.trim() && addMutation.mutate(newTerm.trim())}
          leftIcon={<Plus size={13} color="#a78bfa" />}
          label="Add"
        />
      </View>
      {showTermsSkeleton ? (
        <View className="gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </View>
      ) : terms.length === 0 ? (
        <EmptyState
          icon={<MessageSquareX size={36} color="#3a3b4f" />}
          title="No blocked terms"
          message="Add words or phrases to block them from chat."
        />
      ) : (
        terms.map((term) => (
          <View
            key={term}
            className="flex-row items-center justify-between rounded-lg px-3 py-2.5"
            style={{ backgroundColor: '#0a0b0f', borderWidth: 1, borderColor: '#2a2b3a' }}
          >
            <Text className="text-sm text-white font-mono">{term}</Text>
            <Pressable
              onPress={() => removeMutation.mutate(term)}
              className="p-1.5 rounded-lg"
              style={{ backgroundColor: '#1e1f2a' }}
            >
              <Trash2 size={13} color="#ef4444" />
            </Pressable>
          </View>
        ))
      )}
    </View>
  )
}

function SuspiciousUsersTab() {
  return (
    <View className="flex-1 items-center justify-center py-16 gap-2">
      <Shield size={36} color="#3a3b4f" />
      <Text className="text-sm" style={{ color: '#3a3b4f' }}>No suspicious users detected</Text>
      <Text className="text-xs text-center" style={{ color: '#2a2b3a' }}>
        Users flagged by Twitch's suspicious user system will appear here
      </Text>
    </View>
  )
}

function SharedBansTab() {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8 gap-4">
      <View
        className="h-16 w-16 rounded-2xl items-center justify-center"
        style={{ backgroundColor: 'rgba(124,58,237,0.12)' }}
      >
        <Shield size={28} color="#7C3AED" />
      </View>
      <View className="items-center gap-2">
        <Text className="text-base font-semibold" style={{ color: '#f4f5fa' }}>
          Coming Soon
        </Text>
        <Text
          className="text-sm text-center leading-5"
          style={{ color: '#5a5b72', maxWidth: 320 }}
        >
          Shared ban list import is coming in a future update. You will be able to import and sync ban lists from other channels to keep your community safe.
        </Text>
      </View>
    </View>
  )
}

interface ModerationStats {
  bansToday: number
  timeouts: number
  deletedMessages: number
  automodActions: number
}

export function ModerationScreen() {
  const router = useRouter()
  const [tab, setTab] = useState('automod')
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((s) => s.addToast)

  const { data: shieldData } = useQuery<{ enabled: boolean }>({
    queryKey: ['channel', channelId, 'shield-mode'],
    queryFn: () => moderationApi.getShieldMode(channelId!),
    enabled: !!channelId,
  })
  const shieldMode = shieldData?.enabled ?? false

  const shieldMutation = useMutation({
    mutationFn: (enabled: boolean) => moderationApi.setShieldMode(channelId!, enabled),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ['channel', channelId, 'shield-mode'] })
      const prev = queryClient.getQueryData(['channel', channelId, 'shield-mode'])
      queryClient.setQueryData(['channel', channelId, 'shield-mode'], { enabled })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['channel', channelId, 'shield-mode'], ctx?.prev)
      addToast('error', 'Failed to toggle Shield Mode')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'shield-mode'] })
    },
  })

  const { data: modStats } = useQuery<ModerationStats>({
    queryKey: ['channel', channelId, 'moderation-stats'],
    queryFn: () =>
      apiClient
        .get<{ data: ModerationStats }>(`/v1/channels/${channelId}/moderation/stats`)
        .then((r) => r.data.data),
    enabled: !!channelId,
    refetchInterval: 60_000,
  })

  const TABS = [
    { key: 'bans', label: 'Banned Users' },
    { key: 'blocked', label: 'Blocked Terms' },
    { key: 'automod', label: 'AutoMod Settings' },
    { key: 'modlog', label: 'Mod Actions Log' },
    { key: 'suspicious', label: 'Suspicious Users' },
    { key: 'shared', label: 'Shared Bans' },
  ]

  return (
    <ErrorBoundary>
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        nestedScrollEnabled
      >
        <PageHeader
          title="Moderation"
          subtitle="Manage chat moderation, bans, and AutoMod settings"
        />
        <FeatureDisabledBanner featureKey="auto_moderation" />

        <View className="px-5 py-4 gap-4">
          {/* Shield Banner */}
          <View
            className="rounded-xl flex-row items-center gap-4 px-5 py-4"
            style={{
              backgroundColor: shieldMode ? 'rgba(124,58,237,0.1)' : '#16171f',
              borderWidth: 1,
              borderColor: shieldMode ? 'rgba(124,58,237,0.3)' : '#2a2b3a',
            }}
          >
            <View
              className="h-12 w-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: shieldMode ? 'rgba(124,58,237,0.2)' : '#1e1f2a' }}
            >
              <Shield size={24} color={shieldMode ? '#a78bfa' : '#3a3b4f'} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold text-white">Shield Mode</Text>
              <Text className="text-xs leading-5" style={{ color: '#8889a0' }}>
                Emergency mode — restricts chat to subscribers only, enables maximum AutoMod
              </Text>
            </View>
            <Toggle
              value={shieldMode}
              onValueChange={(v) => shieldMutation.mutate(v)}
            />
          </View>

          {/* Stat cards */}
          <View className="flex-row flex-wrap gap-4">
            <StatCard label="Bans Today" value={modStats?.bansToday ?? 0} color="#ef4444" />
            <StatCard label="Timeouts" value={modStats?.timeouts ?? 0} color="#f59e0b" />
            <StatCard label="Deleted Messages" value={modStats?.deletedMessages ?? 0} color="#eab308" />
            <StatCard label="AutoMod Actions" value={modStats?.automodActions ?? 0} color="#3b82f6" />
          </View>

          {/* Tab bar + content */}
          <View
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
              contentContainerStyle={{ flexDirection: 'row' }}
            >
              {TABS.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setTab(t.key)}
                  className="px-4 py-3"
                  style={{
                    borderBottomWidth: 2,
                    borderBottomColor: tab === t.key ? '#7C3AED' : 'transparent',
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: tab === t.key ? '#a78bfa' : '#5a5b72' }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View>
              {tab === 'bans' && <BansTab />}
              {tab === 'blocked' && <BlockedTermsTab />}
              {tab === 'automod' && <AutoModTab />}
              {tab === 'modlog' && <ModLogTab />}
              {tab === 'suspicious' && <SuspiciousUsersTab />}
              {tab === 'shared' && <SharedBansTab />}
            </View>
          </View>
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
