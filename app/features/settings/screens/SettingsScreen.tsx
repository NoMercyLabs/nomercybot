import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChannelStore } from '@/stores/useChannelStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useToast } from '@/hooks/useToast'
import { useTranslation } from 'react-i18next'
import { loadNamespace } from '@/lib/i18n/resources'
import {
  LogOut, AlertTriangle, Settings, Layers, Bell,
  Palette, Bot, Copy, ShieldAlert,
} from 'lucide-react-native'
import * as Clipboard from 'expo-clipboard'
import { apiClient } from '@/lib/api/client'
import { useSettings } from '../hooks/useSettings'
import { settingsApi } from '../api'
import { FEATURE_KEYS } from '../types'

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Nederlands', value: 'nl' },
  { label: 'Deutsch', value: 'de' },
]

const ACCENT_PRESETS = ['#7C3AED', '#3b82f6', '#22c55e', '#f59e0b']

const SIDEBAR_TABS = [
  { key: 'general', label: 'General' },
  { key: 'bot', label: 'Bot Config' },
  { key: 'tts', label: 'Text to Speech' },
  { key: 'overlay', label: 'Overlay' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'danger', label: 'Danger Zone', danger: true },
]

const NOTIFICATION_PREFS = [
  { key: 'follows', label: 'New Followers', description: 'Get notified when someone follows' },
  { key: 'subscribers', label: 'New Subscribers', description: 'Get notified when someone subscribes' },
  { key: 'raids', label: 'Raids', description: 'Get notified when someone raids' },
  { key: 'cheers', label: 'Cheers', description: 'Get notified for bit cheers' },
  { key: 'redemptions', label: 'Reward Redemptions', description: 'Get notified for channel point redemptions' },
]

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description?: string
  control: React.ReactNode
}) {
  return (
    <View
      className="flex-row items-center justify-between py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      <View className="flex-1 mr-4 gap-0.5">
        <Text className="text-sm font-medium text-white">{label}</Text>
        {description && (
          <Text className="text-xs" style={{ color: '#5a5b72' }}>{description}</Text>
        )}
      </View>
      {control}
    </View>
  )
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View
      className="rounded-xl px-4"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      {title && (
        <View className="pt-4 pb-2">
          <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>
            {title}
          </Text>
        </View>
      )}
      {children}
    </View>
  )
}

export function SettingsScreen() {
  const { i18n } = useTranslation()
  const router = useRouter()
  const [tab, setTab] = useState('general')
  const toast = useToast()
  const logout = useAuthStore((s) => s.logout)
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()
  const { isDark, toggleTheme, accentOverride, setAccent } = useThemeStore()

  const [botPrefix, setBotPrefix] = useState('!')
  const [autoJoin, setAutoJoin] = useState(true)
  const [whisperResponses, setWhisperResponses] = useState(false)
  const [overlayShowAlerts, setOverlayShowAlerts] = useState(true)
  const [overlayAlertDuration, setOverlayAlertDuration] = useState('5000')

  const {
    channel,
    isLoading,
    isError,
    isRefetching,
    refetch,
    updateChannel,
    toggleFeature,
    isFeatureEnabled,
  } = useSettings()

  const { data: botStatus } = useQuery<{ connected: boolean; login: string; displayName: string }>({
    queryKey: ['channel', channelId, 'bot-status'],
    queryFn: async () => {
      const res = await apiClient.get(`/v1/channels/${channelId}/bot/status`)
      return res.data.data
    },
    enabled: !!channelId,
  })

  useEffect(() => {
    if (channel) {
      setBotPrefix(channel.botPrefix ?? '!')
      setAutoJoin(channel.autoJoin ?? true)
      setWhisperResponses(channel.whisperResponses ?? false)
      setOverlayShowAlerts(channel.overlayShowAlerts ?? true)
      setOverlayAlertDuration(String(channel.overlayAlertDuration ?? 5000))
    }
  }, [channel])

  const { data: notifPrefs = {} } = useQuery<Record<string, boolean>>({
    queryKey: ['channel', channelId, 'notification-prefs'],
    queryFn: () => settingsApi.getNotificationPrefs(channelId!),
    enabled: !!channelId && tab === 'notifications',
  })

  const notifMutation = useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      settingsApi.updateNotificationPrefs(channelId!, prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'notification-prefs'] })
      toast.success('Notification preferences saved')
    },
    onError: () => toast.error('Failed to save notification preferences'),
  })

  const saveGeneralMutation = useMutation({
    mutationFn: () => updateChannel({ botPrefix, autoJoin, whisperResponses }),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  })

  const saveOverlayMutation = useMutation({
    mutationFn: () =>
      updateChannel({
        overlayShowAlerts,
        overlayAlertDuration: parseInt(overlayAlertDuration, 10) || 5000,
      }),
    onSuccess: () => toast.success('Overlay settings saved'),
    onError: () => toast.error('Failed to save overlay settings'),
  })

  async function handleLocaleChange(locale: string) {
    try {
      await updateChannel({ locale })
      await loadNamespace(locale as any, 'common')
      await i18n.changeLanguage(locale)
      try { localStorage.setItem('nomercybot-locale', locale) } catch {}
    } catch {
      toast.error('Failed to save language')
    }
  }

  async function handleToggleFeature(key: string) {
    try {
      await toggleFeature(key)
    } catch {
      toast.error('Failed to update feature')
    }
  }

  async function copyOverlayToken() {
    const token = channel?.overlayToken ?? ''
    if (!token) { toast.error('No token available'); return }
    await Clipboard.setStringAsync(token)
    toast.success('Token copied!')
  }

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Settings" />

        <View className="flex-1 flex-row">
          {/* ── LEFT SIDEBAR ── */}
          <View
            style={{
              width: 200,
              backgroundColor: '#111218',
              borderRightWidth: 1,
              borderRightColor: '#2a2b3a',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} className="py-3">
              {SIDEBAR_TABS.map((t) => {
                const isActive = tab === t.key
                const textColor = t.danger
                  ? (isActive ? '#ef4444' : '#6b7280')
                  : (isActive ? '#a78bfa' : '#8889a0')
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    className="flex-row items-center gap-3 mx-2 px-3 py-2.5 rounded-lg mb-0.5"
                    style={{
                      backgroundColor: t.danger
                        ? (isActive ? 'rgba(239,68,68,0.1)' : 'transparent')
                        : (isActive ? 'rgba(124,58,237,0.15)' : 'transparent'),
                    }}
                  >
                    {t.key === 'general' && <Settings size={15} color={textColor} />}
                    {t.key === 'bot' && <Bot size={15} color={textColor} />}
                    {t.key === 'overlay' && <Layers size={15} color={textColor} />}
                    {t.key === 'notifications' && <Bell size={15} color={textColor} />}
                    {t.key === 'appearance' && <Palette size={15} color={textColor} />}
                    {t.key === 'danger' && <ShieldAlert size={15} color={textColor} />}
                    <Text
                      className="text-sm flex-1"
                      style={{ color: textColor, fontWeight: isActive ? '600' : '400' }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* ── CONTENT AREA ── */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          >
            {/* GENERAL */}
            {tab === 'general' && (
              <>
                <Text className="text-base font-semibold text-white">General Settings</Text>
                {isLoading && !isError ? (
                  <View className="gap-3">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                  </View>
                ) : (
                  <>
                    <SectionCard title="Bot Identity">
                      <SettingRow
                        label="Bot Username"
                        description="Your bot's Twitch username"
                        control={
                          <Text className="text-sm font-mono" style={{ color: botStatus?.login ? '#a78bfa' : '#5a5b72' }}>
                            {botStatus?.login || 'Not configured'}
                          </Text>
                        }
                      />
                      <View className="py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                        <Input
                          label="Command Prefix"
                          value={botPrefix}
                          onChangeText={setBotPrefix}
                          placeholder="!"
                          maxLength={3}
                        />
                      </View>
                    </SectionCard>

                    <SectionCard title="Language">
                      <View className="py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                        <Select
                          label="Interface Language"
                          value={i18n.language}
                          onValueChange={handleLocaleChange}
                          options={LANGUAGES}
                        />
                      </View>
                    </SectionCard>

                    <SectionCard title="Behaviour">
                      <SettingRow
                        label="Auto-join Chat"
                        description="Bot joins your chat automatically when you go live"
                        control={<Toggle value={autoJoin} onValueChange={setAutoJoin} />}
                      />
                      <SettingRow
                        label="Whisper Responses"
                        description="Respond to commands via Twitch whispers"
                        control={<Toggle value={whisperResponses} onValueChange={setWhisperResponses} />}
                      />
                    </SectionCard>

                    <Button
                      label={saveGeneralMutation.isPending ? 'Saving…' : 'Save Changes'}
                      onPress={() => saveGeneralMutation.mutate()}
                      disabled={saveGeneralMutation.isPending}
                    />

                    {saveGeneralMutation.isSuccess && (
                      <Text className="text-center text-sm" style={{ color: '#4ade80' }}>Settings saved</Text>
                    )}
                    {saveGeneralMutation.isError && (
                      <Text className="text-center text-sm" style={{ color: '#f87171' }}>Failed to save</Text>
                    )}
                  </>
                )}
              </>
            )}

            {/* BOT CONFIG */}
            {tab === 'bot' && (
              <>
                <Text className="text-base font-semibold text-white">Bot Features</Text>
                {isLoading && !isError ? (
                  <View className="gap-4">
                    {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                  </View>
                ) : (
                  <SectionCard title="Features">
                    <SettingRow
                      label="Moderation"
                      description="Enable automated moderation features"
                      control={
                        <Toggle
                          value={isFeatureEnabled(FEATURE_KEYS.MODERATION)}
                          onValueChange={() => handleToggleFeature(FEATURE_KEYS.MODERATION)}
                        />
                      }
                    />
                    <SettingRow
                      label="Music"
                      description="Enable music queue and controls"
                      control={
                        <Toggle
                          value={isFeatureEnabled(FEATURE_KEYS.MUSIC)}
                          onValueChange={() => handleToggleFeature(FEATURE_KEYS.MUSIC)}
                        />
                      }
                    />
                    <SettingRow
                      label="Pipelines"
                      description="Enable automation pipelines"
                      control={
                        <Toggle
                          value={isFeatureEnabled(FEATURE_KEYS.PIPELINES)}
                          onValueChange={() => handleToggleFeature(FEATURE_KEYS.PIPELINES)}
                        />
                      }
                    />
                    <SettingRow
                      label="Text-to-Speech"
                      description="Read chat messages aloud via TTS"
                      control={
                        <Toggle
                          value={isFeatureEnabled(FEATURE_KEYS.TTS)}
                          onValueChange={() => handleToggleFeature(FEATURE_KEYS.TTS)}
                        />
                      }
                    />
                  </SectionCard>
                )}
              </>
            )}

            {/* OVERLAY */}
            {tab === 'overlay' && (
              <>
                <Text className="text-base font-semibold text-white">Overlay Settings</Text>

                <SectionCard title="Overlay Token">
                  <View className="py-3 gap-2" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>
                      Add this as a Browser Source in OBS or Streamlabs.
                    </Text>
                    <View
                      className="flex-row items-center gap-2 rounded-lg px-3 py-2.5"
                      style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a' }}
                    >
                      <Text
                        className="flex-1 text-xs font-mono"
                        style={{ color: '#8889a0' }}
                        numberOfLines={1}
                      >
                        {channel?.overlayToken ?? 'No token generated'}
                      </Text>
                      <Pressable onPress={copyOverlayToken} className="p-1">
                        <Copy size={13} color="#8889a0" />
                      </Pressable>
                    </View>
                    <Button
                      variant="secondary"
                      size="sm"
                      label="Copy Token"
                      leftIcon={<Copy size={13} color="#8889a0" />}
                      onPress={copyOverlayToken}
                    />
                  </View>
                </SectionCard>

                <SectionCard title="Alert Settings">
                  <SettingRow
                    label="Show Alerts"
                    description="Display on-stream alerts for follows, subs, and raids"
                    control={<Toggle value={overlayShowAlerts} onValueChange={setOverlayShowAlerts} />}
                  />
                  {overlayShowAlerts && (
                    <View className="py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                      <Input
                        label="Alert Duration (ms)"
                        value={overlayAlertDuration}
                        onChangeText={setOverlayAlertDuration}
                        keyboardType="number-pad"
                        placeholder="5000"
                      />
                    </View>
                  )}
                </SectionCard>

                <Button
                  label={saveOverlayMutation.isPending ? 'Saving…' : 'Save Overlay Settings'}
                  onPress={() => saveOverlayMutation.mutate()}
                  disabled={saveOverlayMutation.isPending}
                />
              </>
            )}

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <>
                <Text className="text-base font-semibold text-white">Notification Preferences</Text>
                <SectionCard>
                  {NOTIFICATION_PREFS.map((pref) => (
                    <SettingRow
                      key={pref.key}
                      label={pref.label}
                      description={pref.description}
                      control={
                        <Toggle
                          value={notifPrefs[pref.key] ?? true}
                          onValueChange={(v) => {
                            notifMutation.mutate({ ...notifPrefs, [pref.key]: v })
                          }}
                        />
                      }
                    />
                  ))}
                </SectionCard>
              </>
            )}

            {/* APPEARANCE */}
            {tab === 'appearance' && (
              <>
                <Text className="text-base font-semibold text-white">Appearance</Text>

                <SectionCard title="Theme">
                  <SettingRow
                    label="Dark Mode"
                    description="Use dark interface theme"
                    control={<Toggle value={isDark} onValueChange={toggleTheme} />}
                  />
                </SectionCard>

                <SectionCard title="Accent Color">
                  <View className="py-4 gap-3">
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>
                      Choose a preset or set a custom color.
                    </Text>
                    <View className="flex-row gap-3 items-center">
                      {ACCENT_PRESETS.map((color) => {
                        const isSelected = (accentOverride ?? '#7C3AED') === color
                        return (
                          <Pressable
                            key={color}
                            onPress={() => setAccent(color)}
                            className="rounded-full items-center justify-center"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: color,
                              borderWidth: isSelected ? 3 : 2,
                              borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.2)',
                            }}
                          />
                        )
                      })}
                    </View>
                    <ColorPicker value={accentOverride ?? '#7C3AED'} onValueChange={setAccent} />
                  </View>
                </SectionCard>
              </>
            )}

            {/* TTS — redirect to dedicated page */}
            {tab === 'tts' && (
              <>
                <Text className="text-base font-semibold text-white">Text to Speech</Text>
                <View
                  className="rounded-xl p-4 gap-3"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Text className="text-sm" style={{ color: '#8889a0' }}>
                    Configure TTS provider, voice selection, permissions, and test preview.
                  </Text>
                  <Button
                    label="Open TTS Settings"
                    onPress={() => router.push('/(dashboard)/settings/tts' as any)}
                  />
                </View>
              </>
            )}

            {/* DANGER ZONE */}
            {tab === 'danger' && (
              <>
                <Text className="text-base font-semibold text-white">Danger Zone</Text>
                <View
                  className="rounded-xl p-4 gap-4"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <AlertTriangle size={16} color="#ef4444" />
                    <Text className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                      Irreversible Actions
                    </Text>
                  </View>
                  <Text className="text-xs" style={{ color: '#8889a0' }}>
                    These actions cannot be undone. Please proceed with caution.
                  </Text>
                  <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.2)' }}>
                    <SettingRow
                      label="Sign Out"
                      description="Sign out of your account on this device"
                      control={
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={logout}
                          leftIcon={<LogOut size={14} color="#9ca3af" />}
                          label="Sign Out"
                        />
                      }
                    />
                    <SettingRow
                      label="Disconnect Bot"
                      description="Remove the bot from your channel"
                      control={
                        <Button variant="danger" size="sm" label="Disconnect" />
                      }
                    />
                    <View className="py-4">
                      <Text className="text-sm font-medium" style={{ color: '#ef4444' }}>Delete Account</Text>
                      <Text className="text-xs mt-1 mb-3" style={{ color: '#5a5b72' }}>
                        Permanently delete your account and all associated data. This cannot be undone.
                      </Text>
                      <Button variant="danger" label="Delete Account" />
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </ErrorBoundary>
  )
}
