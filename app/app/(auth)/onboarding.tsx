import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { apiClient } from '@/lib/api/client'
import {
  Radio,
  Users,
  Sparkles,
  Diamond,
  Music,
  Shield,
  LayoutGrid,
  Timer,
  MessageCircle,
  Award,
  Bot,
  Check,
  ChevronRight,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react-native'

type OnboardingStep = 'loading' | 'choose-role' | 'bot-setup' | 'features' | 'go-live' | 'viewer-join'

interface Feature {
  key: string
  label: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  badge?: string
}

const INITIAL_FEATURES: Feature[] = [
  {
    key: 'commands',
    label: 'Custom Commands',
    description: '50+ built-in commands + create your own with the pipeline builder',
    icon: <Sparkles size={20} color="#a78bfa" />,
    enabled: true,
  },
  {
    key: 'rewards',
    label: 'Channel Point Rewards',
    description: 'TTS, song requests, voice swap, and custom reward handlers',
    icon: <Diamond size={20} color="#a78bfa" />,
    enabled: true,
  },
  {
    key: 'music',
    label: 'Music & Song Requests',
    description: 'Now playing overlay, queue management, chat song requests',
    icon: <Music size={20} color="#a78bfa" />,
    enabled: false,
    badge: 'Spotify',
  },
  {
    key: 'moderation',
    label: 'Moderation Tools',
    description: 'AutoMod, blocked terms, shield mode, banned user management',
    icon: <Shield size={20} color="#a78bfa" />,
    enabled: false,
  },
  {
    key: 'overlays',
    label: 'Stream Widgets',
    description: 'Overlays, alerts, and browser source widgets for OBS',
    icon: <LayoutGrid size={20} color="#a78bfa" />,
    enabled: false,
  },
]

function StepIndicator({ steps, currentIndex }: { steps: string[]; currentIndex: number }) {
  return (
    <View className="flex-row items-center justify-center gap-0 mb-10">
      {steps.map((label, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <View key={label} className="flex-row items-center">
            {i > 0 && (
              <View
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: done ? '#7C3AED' : '#2a2b3a',
                  marginHorizontal: 6,
                }}
              />
            )}
            <View className="flex-row items-center gap-2">
              <View
                className="h-8 w-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: done ? '#7C3AED' : active ? 'rgba(124,58,237,0.2)' : '#16171f',
                  borderWidth: 2,
                  borderColor: done ? '#7C3AED' : active ? '#7C3AED' : '#2a2b3a',
                }}
              >
                {done ? (
                  <Check size={14} color="#fff" />
                ) : (
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: active ? '#a78bfa' : '#5a5b72' }}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className="text-xs font-medium"
                style={{ color: done || active ? '#f4f5fa' : '#5a5b72' }}
              >
                {label}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

function WizardCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="w-full max-w-lg rounded-2xl p-6 gap-5"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      {children}
    </View>
  )
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="flex-row items-start gap-2.5 rounded-xl px-4 py-3"
      style={{
        backgroundColor: 'rgba(59,130,246,0.08)',
        borderLeftWidth: 3,
        borderLeftColor: '#3b82f6',
      }}
    >
      <Info size={16} color="#93c5fd" style={{ marginTop: 1 }} />
      <Text className="text-xs leading-5 flex-1" style={{ color: '#93c5fd' }}>
        {children}
      </Text>
    </View>
  )
}

export default function OnboardingScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding)
  const fetchChannels = useChannelStore((s) => s.fetchChannels)
  const addToast = useNotificationStore((s) => s.addToast)

  const [step, setStep] = useState<OnboardingStep>('loading')
  const [features, setFeatures] = useState<Feature[]>(INITIAL_FEATURES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [botStatus, setBotStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking')
  const [botUsername, setBotUsername] = useState<string | null>(null)

  // Mod search state
  const [channelSearch, setChannelSearch] = useState('')

  // Check if user already has channels
  useEffect(() => {
    async function check() {
      try {
        await fetchChannels()
        const channels = useChannelStore.getState().channels
        if (channels.length > 0) {
          completeOnboarding()
          router.replace('/(dashboard)')
          return
        }
      } catch {
        // No channels — show onboarding
      }
      setStep('choose-role')
    }
    check()
  }, [completeOnboarding, fetchChannels, router])

  // Check platform bot status
  const checkBotStatus = useCallback(async () => {
    setBotStatus('checking')
    try {
      const res = await apiClient.get<{ data: { connected: boolean; login?: string; displayName?: string } }>(
        '/v1/system/setup/bot/status',
      )
      const data = res.data?.data
      if (data?.connected) {
        setBotStatus('connected')
        setBotUsername(data.displayName ?? data.login ?? 'NomNomzBot')
      } else {
        setBotStatus('disconnected')
      }
    } catch {
      setBotStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    if (step === 'bot-setup') {
      checkBotStatus()
    }
  }, [step, checkBotStatus])

  function toggleFeature(key: string) {
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    )
  }

  const [botOauthUrl, setBotOauthUrl] = useState<string | null>(null)
  const [botUrlCopied, setBotUrlCopied] = useState(false)

  useEffect(() => {
    if (step === 'bot-setup') {
      apiClient.get<{ data: { oauthUrl: string } }>('/v1/system/setup/bot/oauth-url')
        .then(res => setBotOauthUrl(res.data?.data?.oauthUrl ?? null))
        .catch(() => {})
    }
  }, [step])

  function handleCopyBotUrl() {
    if (!botOauthUrl) return
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(botOauthUrl)
      setBotUrlCopied(true)
      setTimeout(() => setBotUrlCopied(false), 3000)
    }
  }

  async function handleBotConnect() {
    try {
      const url = botOauthUrl ?? (await apiClient.get<{ data: { oauthUrl: string } }>('/v1/system/setup/bot/oauth-url')).data?.data?.oauthUrl
      if (url) {
        if (Platform.OS === 'web') {
          window.location.href = url
        } else {
          Linking.openURL(url)
        }
      }
    } catch {
      addToast('error', 'Failed to get bot authorization URL')
    }
  }

  async function handleGoLive() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      // 1. Create the channel
      await apiClient.post('/v1/channels', {
        broadcasterId: user.id,
        displayName: user.displayName,
      })

      // 2. Fetch channels to get the channelId
      await fetchChannels()
      const channels = useChannelStore.getState().channels
      const channelId = channels[0]?.id ?? user.id

      // 3. Enable selected features
      const enabledKeys = features.filter((f) => f.enabled).map((f) => f.key)
      await Promise.allSettled(
        enabledKeys.map((key) =>
          apiClient.post(`/v1/channels/${channelId}/features/${key}/toggle`),
        ),
      )

      // 4. Done
      completeOnboarding()
      router.replace('/(dashboard)')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to set up channel.')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoinChannel() {
    const query = channelSearch.trim()
    if (!query) {
      setError('Enter a channel name.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await apiClient.post(`/v1/channels/${encodeURIComponent(query)}/join`)
      await fetchChannels()
      completeOnboarding()
      router.replace('/(dashboard)')
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e?.message ?? 'Channel not found or not using NomercyBot.',
      )
    } finally {
      setLoading(false)
    }
  }

  function handleSkip() {
    completeOnboarding()
    router.replace('/(dashboard)')
  }

  const STEPS = ['Connect', 'Bot', 'Features', 'Go Live']
  const stepIndex =
    step === 'bot-setup' ? 1 : step === 'features' ? 2 : step === 'go-live' ? 3 : 0

  if (step === 'loading') {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0a0b0f' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#0a0b0f' }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Role selection ────────────────────────────────────── */}
        {step === 'choose-role' && (
          <>
            <View className="items-center gap-3 mb-10">
              <Text className="text-4xl font-bold" style={{ color: '#f4f5fa' }}>
                Welcome{user ? `, ${user.displayName}` : ''}!
              </Text>
              <Text
                className="text-base text-center leading-relaxed max-w-xs"
                style={{ color: '#8889a0' }}
              >
                How will you be using NomercyBot?
              </Text>
            </View>

            <View className="w-full max-w-sm gap-3">
              <Pressable
                onPress={() => setStep('bot-setup')}
                className="rounded-2xl p-5 flex-row items-center gap-4 active:opacity-80"
                style={{
                  backgroundColor: '#16171f',
                  borderWidth: 1,
                  borderColor: '#2a2b3a',
                }}
              >
                <View
                  className="h-12 w-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(124,58,237,0.2)' }}
                >
                  <Radio size={24} color="#a78bfa" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold" style={{ color: '#f4f5fa' }}>
                    I'm a broadcaster
                  </Text>
                  <Text className="text-sm" style={{ color: '#8889a0' }}>
                    Set up the bot for my own channel
                  </Text>
                </View>
                <ChevronRight size={20} color="#5a5b72" />
              </Pressable>

              <Pressable
                onPress={() => setStep('viewer-join')}
                className="rounded-2xl p-5 flex-row items-center gap-4 active:opacity-80"
                style={{
                  backgroundColor: '#16171f',
                  borderWidth: 1,
                  borderColor: '#2a2b3a',
                }}
              >
                <View
                  className="h-12 w-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}
                >
                  <Users size={24} color="#60a5fa" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold" style={{ color: '#f4f5fa' }}>
                    I'm a viewer / mod
                  </Text>
                  <Text className="text-sm" style={{ color: '#8889a0' }}>
                    Join a channel that uses NomercyBot
                  </Text>
                </View>
                <ChevronRight size={20} color="#5a5b72" />
              </Pressable>
            </View>

            <Pressable onPress={handleSkip} className="mt-8 px-4 py-2 active:opacity-60">
              <Text className="text-sm underline" style={{ color: '#5a5b72' }}>
                Skip for now
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Viewer / mod flow ────────────────────────────────── */}
        {step === 'viewer-join' && (
          <>
            <View className="items-center gap-3 mb-10">
              <Text className="text-4xl font-bold" style={{ color: '#f4f5fa' }}>
                Join a Channel
              </Text>
              <Text
                className="text-base text-center leading-relaxed max-w-xs"
                style={{ color: '#8889a0' }}
              >
                Enter the channel name you want to follow that uses NomercyBot.
              </Text>
            </View>

            <View className="w-full max-w-sm gap-3">
              <TextInput
                value={channelSearch}
                onChangeText={(t) => { setChannelSearch(t); setError(null) }}
                placeholder="Channel name..."
                placeholderTextColor="#5a5b72"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: '#1e1f2a',
                  borderWidth: 1,
                  borderColor: '#2a2b3a',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  color: '#f4f5fa',
                  fontSize: 14,
                  fontFamily: 'monospace',
                }}
              />

              {error && (
                <View
                  className="rounded-xl px-4 py-3"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                  }}
                >
                  <Text className="text-sm" style={{ color: '#f87171' }}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={handleJoinChannel}
                disabled={loading}
                className="rounded-xl py-3.5 items-center active:opacity-80"
                style={{ backgroundColor: '#3b82f6', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <View className="flex-row items-center gap-2">
                    <Users size={16} color="#fff" />
                    <Text className="font-semibold text-white">Join Channel</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => setStep('choose-role')}
                className="items-center py-2 active:opacity-60"
              >
                <Text className="text-sm font-medium" style={{ color: '#8889a0' }}>Back</Text>
              </Pressable>
            </View>

            <Pressable onPress={handleSkip} className="mt-8 px-4 py-2 active:opacity-60">
              <Text className="text-sm underline" style={{ color: '#5a5b72' }}>
                Skip for now
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Wizard steps (broadcaster flow) ──────────────────── */}
        {(step === 'bot-setup' || step === 'features' || step === 'go-live') && (
          <>
            <StepIndicator steps={STEPS} currentIndex={stepIndex} />

            {/* ── Step 2: Bot Setup ──────────────────────────────── */}
            {step === 'bot-setup' && (
              <WizardCard>
                <View className="gap-2">
                  <Text className="text-xl font-bold" style={{ color: '#f4f5fa' }}>
                    Connect your bot account
                  </Text>
                  <Text className="text-sm leading-5" style={{ color: '#8889a0' }}>
                    NomercyBot needs a Twitch account to send messages in your chat. This should be
                    a separate account from your broadcaster account.
                  </Text>
                </View>

                <InfoBanner>
                  The bot account is what your viewers see when the bot sends messages. You can use a
                  dedicated bot account (recommended) or skip this and set it up later.
                </InfoBanner>

                {/* Bot status */}
                <View
                  className="rounded-xl p-4 flex-row items-center gap-4"
                  style={{
                    backgroundColor:
                      botStatus === 'connected'
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(245,158,11,0.08)',
                    borderWidth: 1,
                    borderColor:
                      botStatus === 'connected'
                        ? 'rgba(34,197,94,0.3)'
                        : 'rgba(245,158,11,0.3)',
                  }}
                >
                  <View
                    className="h-10 w-10 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor:
                        botStatus === 'connected'
                          ? 'rgba(34,197,94,0.15)'
                          : 'rgba(245,158,11,0.15)',
                    }}
                  >
                    <Bot
                      size={20}
                      color={botStatus === 'connected' ? '#4ade80' : '#fbbf24'}
                    />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm font-semibold text-white">
                      {botStatus === 'checking'
                        ? 'Checking...'
                        : botStatus === 'connected'
                          ? `Connected as ${botUsername}`
                          : 'No bot account connected'}
                    </Text>
                    <Text
                      className="text-xs"
                      style={{
                        color: botStatus === 'connected' ? '#4ade80' : '#fbbf24',
                      }}
                    >
                      {botStatus === 'checking'
                        ? 'Verifying bot status...'
                        : botStatus === 'connected'
                          ? 'Bot is ready to join your channel'
                          : 'Authorize a Twitch account for the bot'}
                    </Text>
                  </View>
                  {botStatus === 'checking' && (
                    <ActivityIndicator size="small" color="#a78bfa" />
                  )}
                </View>

                {botStatus === 'disconnected' && botOauthUrl && (
                  <View className="gap-2">
                    <Text className="text-xs font-medium" style={{ color: '#5a5b72' }}>
                      Authorization URL — copy and paste in the browser where you're logged in as the bot
                    </Text>
                    <Pressable
                      onPress={handleCopyBotUrl}
                      className="rounded-xl p-3"
                      style={{
                        backgroundColor: '#1e1f2a',
                        borderWidth: 1,
                        borderColor: botUrlCopied ? '#4ade80' : '#2a2b3a',
                      }}
                    >
                      <Text
                        className="text-xs font-mono"
                        style={{ color: '#8889a0' }}
                        numberOfLines={2}
                        selectable
                      >
                        {botOauthUrl}
                      </Text>
                    </Pressable>
                    <Text className="text-xs" style={{ color: botUrlCopied ? '#4ade80' : '#5a5b72' }}>
                      {botUrlCopied ? 'Copied to clipboard!' : 'Click to copy'}
                    </Text>
                  </View>
                )}

                {botStatus === 'disconnected' && (
                  <Pressable
                    onPress={handleBotConnect}
                    className="rounded-xl py-3.5 items-center active:opacity-80"
                    style={{ backgroundColor: '#9147ff' }}
                  >
                    <View className="flex-row items-center gap-2">
                      <Bot size={16} color="#fff" />
                      <Text className="font-semibold text-white">
                        Authorize Bot Account on Twitch
                      </Text>
                    </View>
                  </Pressable>
                )}

                {botStatus === 'connected' && (
                  <View
                    className="flex-row items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: 'rgba(34,197,94,0.08)',
                      borderLeftWidth: 3,
                      borderLeftColor: '#4ade80',
                    }}
                  >
                    <Info size={14} color="#4ade80" style={{ marginTop: 1 }} />
                    <Text className="text-xs leading-5 flex-1" style={{ color: '#4ade80' }}>
                      The bot will be automatically added as a moderator in your channel when you finish setup.
                    </Text>
                  </View>
                )}

                {/* Navigation */}
                <View className="flex-row justify-between items-center pt-2">
                  <Pressable onPress={() => setStep('choose-role')} className="active:opacity-60">
                    <Text className="text-sm font-medium" style={{ color: '#8889a0' }}>
                      Back
                    </Text>
                  </Pressable>
                  <View className="flex-row gap-3">
                    {botStatus !== 'connected' && (
                      <Pressable
                        onPress={() => setStep('features')}
                        className="active:opacity-60"
                      >
                        <Text className="text-sm" style={{ color: '#5a5b72' }}>
                          Skip for now
                        </Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => setStep('features')}
                      className="rounded-xl px-6 py-2.5 active:opacity-80"
                      style={{ backgroundColor: '#7C3AED' }}
                    >
                      <Text className="text-sm font-semibold text-white">Continue</Text>
                    </Pressable>
                  </View>
                </View>
              </WizardCard>
            )}

            {/* ── Step 3: Features ───────────────────────────────── */}
            {step === 'features' && (
              <WizardCard>
                <View className="gap-2">
                  <Text className="text-xl font-bold" style={{ color: '#f4f5fa' }}>
                    Choose your features
                  </Text>
                  <Text className="text-sm leading-5" style={{ color: '#8889a0' }}>
                    Enable the features you want. You can always change these later. Each feature
                    may require additional Twitch permissions.
                  </Text>
                </View>

                <InfoBanner>
                  NomercyBot uses progressive OAuth — we only request permissions for features you
                  actually enable. You control what the bot can access.
                </InfoBanner>

                {/* Feature toggles */}
                <View className="gap-2">
                  {features.map((feature) => (
                    <Pressable
                      key={feature.key}
                      onPress={() => toggleFeature(feature.key)}
                      className="flex-row items-center justify-between rounded-xl p-3.5"
                      style={{
                        backgroundColor: feature.enabled
                          ? 'rgba(124,58,237,0.08)'
                          : 'transparent',
                        borderWidth: 1,
                        borderColor: feature.enabled ? '#7C3AED' : '#2a2b3a',
                      }}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className="h-10 w-10 rounded-lg items-center justify-center"
                          style={{
                            backgroundColor: feature.enabled
                              ? 'rgba(124,58,237,0.2)'
                              : '#1e1f2a',
                          }}
                        >
                          {feature.icon}
                        </View>
                        <View className="flex-1 gap-0.5">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-sm font-semibold" style={{ color: '#f4f5fa' }}>
                              {feature.label}
                            </Text>
                            {feature.badge && (
                              <View
                                className="rounded px-1.5 py-0.5"
                                style={{ backgroundColor: 'rgba(124,58,237,0.3)' }}
                              >
                                <Text
                                  style={{
                                    color: '#a78bfa',
                                    fontSize: 10,
                                    fontWeight: '700',
                                  }}
                                >
                                  {feature.badge}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs" style={{ color: '#8889a0' }}>
                            {feature.description}
                          </Text>
                        </View>
                      </View>
                      <View
                        className="h-6 w-11 rounded-full justify-center"
                        style={{
                          backgroundColor: feature.enabled ? '#7C3AED' : '#1e1f2a',
                          paddingHorizontal: 2,
                        }}
                      >
                        <View
                          className="h-5 w-5 rounded-full"
                          style={{
                            backgroundColor: '#fff',
                            alignSelf: feature.enabled ? 'flex-end' : 'flex-start',
                          }}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* Navigation */}
                <View className="flex-row justify-between items-center pt-2">
                  <Pressable onPress={() => setStep('bot-setup')} className="active:opacity-60">
                    <Text className="text-sm font-medium" style={{ color: '#8889a0' }}>
                      Back
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setStep('go-live')}
                    className="rounded-xl px-6 py-2.5 active:opacity-80"
                    style={{ backgroundColor: '#7C3AED' }}
                  >
                    <Text className="text-sm font-semibold text-white">Continue</Text>
                  </Pressable>
                </View>
              </WizardCard>
            )}

            {/* ── Step 4: Go Live ────────────────────────────────── */}
            {step === 'go-live' && (
              <WizardCard>
                <View className="gap-2">
                  <Text className="text-xl font-bold" style={{ color: '#f4f5fa' }}>
                    Ready to go live
                  </Text>
                  <Text className="text-sm leading-5" style={{ color: '#8889a0' }}>
                    Review your setup and launch NomercyBot in your channel.
                  </Text>
                </View>

                {/* Summary */}
                <View className="gap-3">
                  {/* Channel */}
                  <View
                    className="rounded-xl p-3.5 flex-row items-center gap-3"
                    style={{ backgroundColor: '#1e1f2a' }}
                  >
                    <Radio size={16} color="#a78bfa" />
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>
                        Channel
                      </Text>
                      <Text className="text-sm font-semibold text-white">
                        {user?.displayName ?? 'Your channel'}
                      </Text>
                    </View>
                    <Check size={16} color="#4ade80" />
                  </View>

                  {/* Bot */}
                  <View
                    className="rounded-xl p-3.5 flex-row items-center gap-3"
                    style={{ backgroundColor: '#1e1f2a' }}
                  >
                    <Bot size={16} color={botStatus === 'connected' ? '#a78bfa' : '#fbbf24'} />
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>
                        Bot Account
                      </Text>
                      <Text className="text-sm font-semibold text-white">
                        {botStatus === 'connected'
                          ? botUsername
                          : 'Not connected — set up later in Integrations'}
                      </Text>
                    </View>
                    {botStatus === 'connected' ? (
                      <Check size={16} color="#4ade80" />
                    ) : (
                      <AlertCircle size={16} color="#fbbf24" />
                    )}
                  </View>

                  {/* Features */}
                  <View
                    className="rounded-xl p-3.5 flex-row items-center gap-3"
                    style={{ backgroundColor: '#1e1f2a' }}
                  >
                    <Zap size={16} color="#a78bfa" />
                    <View className="flex-1">
                      <Text className="text-xs" style={{ color: '#5a5b72' }}>
                        Features
                      </Text>
                      <Text className="text-sm font-semibold text-white">
                        {features.filter((f) => f.enabled).length} of {features.length} enabled
                      </Text>
                    </View>
                    <Check size={16} color="#4ade80" />
                  </View>
                </View>

                {botStatus !== 'connected' && (
                  <View
                    className="rounded-xl px-4 py-3 flex-row items-start gap-2.5"
                    style={{
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(245,158,11,0.3)',
                    }}
                  >
                    <AlertCircle size={14} color="#fbbf24" style={{ marginTop: 1 }} />
                    <Text className="text-xs leading-5 flex-1" style={{ color: '#fbbf24' }}>
                      No bot account is connected. The bot won't be able to chat until you authorize
                      a bot account in Settings → Integrations.
                    </Text>
                  </View>
                )}

                {error && (
                  <View
                    className="rounded-xl px-4 py-3"
                    style={{
                      backgroundColor: 'rgba(239,68,68,0.1)',
                      borderWidth: 1,
                      borderColor: 'rgba(239,68,68,0.3)',
                    }}
                  >
                    <Text className="text-sm" style={{ color: '#f87171' }}>
                      {error}
                    </Text>
                  </View>
                )}

                {/* Navigation */}
                <View className="flex-row justify-between items-center pt-2">
                  <Pressable onPress={() => setStep('features')} className="active:opacity-60">
                    <Text className="text-sm font-medium" style={{ color: '#8889a0' }}>
                      Back
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={handleGoLive}
                    disabled={loading}
                    className="rounded-xl px-8 py-3 active:opacity-80"
                    style={{ backgroundColor: '#7C3AED', opacity: loading ? 0.5 : 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <View className="flex-row items-center gap-2">
                        <Zap size={16} color="#fff" />
                        <Text className="font-bold text-white">Launch NomercyBot</Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              </WizardCard>
            )}

            {/* Skip link */}
            <Pressable onPress={handleSkip} className="mt-6 px-4 py-2 active:opacity-60">
              <Text className="text-sm underline" style={{ color: '#5a5b72' }}>
                Skip for now
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
