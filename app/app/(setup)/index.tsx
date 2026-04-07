import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native'
import {
  Check,
  Bot,
  Music,
  MessageCircle,
  Settings,
  ChevronRight,
  AlertCircle,
  Info,
  Zap,
  ExternalLink,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemStatus {
  twitchConfigured: boolean
  botConnected: boolean
  botUsername?: string
  spotifyConfigured?: boolean
  discordConfigured?: boolean
}

type Step = 1 | 2 | 3 | 4

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEPS = [
  { id: 1 as Step, label: 'Twitch App', icon: Settings },
  { id: 2 as Step, label: 'Bot Account', icon: Bot },
  { id: 3 as Step, label: 'Integrations', icon: Zap },
  { id: 4 as Step, label: 'Ready', icon: Check },
] as const

const colors = {
  bg: '#0a0b0f',
  card: '#16171f',
  cardBorder: '#2a2b3a',
  accent: '#7C3AED',
  accentLight: '#a78bfa',
  text: '#f4f5fa',
  textSecondary: '#8889a0',
  textMuted: '#5a5b72',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#ef4444',
  surface: '#1e1f2a',
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, status }: { current: Step; status: SystemStatus }) {
  const isComplete = (step: Step): boolean => {
    switch (step) {
      case 1: return status.twitchConfigured
      case 2: return status.botConnected
      case 3: return true // optional
      case 4: return status.twitchConfigured && status.botConnected
      default: return false
    }
  }

  return (
    <View className="flex-row items-center justify-center px-5 py-4 gap-1">
      {STEPS.map((step, idx) => {
        const active = current === step.id
        const done = isComplete(step.id)
        const StepIcon = step.icon

        return (
          <View key={step.id} className="flex-row items-center">
            {idx > 0 && (
              <View
                className="h-[2px] w-6 mx-1 rounded-full"
                style={{ backgroundColor: done || active ? colors.accent : colors.cardBorder }}
              />
            )}
            <View className="items-center gap-1">
              <View
                className="w-9 h-9 rounded-full items-center justify-center"
                style={{
                  backgroundColor: active ? colors.accent : done ? 'rgba(124,58,237,0.2)' : colors.surface,
                  borderWidth: active ? 0 : 1,
                  borderColor: done ? colors.accent : colors.cardBorder,
                }}
              >
                {done && !active ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <StepIcon size={16} color={active ? '#fff' : colors.textMuted} />
                )}
              </View>
              <Text
                className="text-[10px] font-medium"
                style={{ color: active ? colors.accentLight : colors.textMuted }}
              >
                {step.label}
              </Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View
      className="flex-row items-center gap-2 px-3 py-1.5 rounded-full self-start"
      style={{ backgroundColor: ok ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)' }}
    >
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: ok ? colors.success : colors.warning }}
      />
      <Text className="text-xs font-medium" style={{ color: ok ? colors.success : colors.warning }}>
        {label}
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Card wrapper
// ---------------------------------------------------------------------------

function SetupCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-2xl p-5 gap-4 ${className ?? ''}`}
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
      }}
    >
      {children}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  icon,
  iconColor,
  expanded,
  onToggle,
  configured,
  children,
}: {
  title: string
  icon: React.ReactNode
  iconColor: string
  expanded: boolean
  onToggle: () => void
  configured?: boolean
  children: React.ReactNode
}) {
  return (
    <View
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}
    >
      <Pressable
        className="flex-row items-center justify-between p-4"
        onPress={onToggle}
      >
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className="text-sm font-semibold" style={{ color: colors.text }}>
            {title}
          </Text>
          {configured && (
            <View className="w-4 h-4 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(74,222,128,0.2)' }}>
              <Check size={10} color={colors.success} />
            </View>
          )}
        </View>
        <View
          style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
        >
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </Pressable>
      {expanded && (
        <View className="px-4 pb-4 gap-3">
          {children}
        </View>
      )}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Twitch App
// ---------------------------------------------------------------------------

function StepTwitchApp({
  status,
  loading,
  onNext,
}: {
  status: SystemStatus
  loading: boolean
  onNext: () => void
}) {
  return (
    <SetupCard>
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
        >
          <Settings size={20} color={colors.accentLight} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Twitch Application
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            Client ID and Secret must be configured on the server
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color={colors.accentLight} />
          <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
            Checking server configuration...
          </Text>
        </View>
      ) : (
        <>
          <View
            className="rounded-xl p-4 gap-3"
            style={{ backgroundColor: colors.surface }}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Twitch Client ID
              </Text>
              <StatusBadge
                ok={status.twitchConfigured}
                label={status.twitchConfigured ? 'Configured' : 'Not configured'}
              />
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Twitch Client Secret
              </Text>
              <StatusBadge
                ok={status.twitchConfigured}
                label={status.twitchConfigured ? 'Configured' : 'Not configured'}
              />
            </View>
          </View>

          {!status.twitchConfigured && (
            <View
              className="flex-row items-start gap-2.5 rounded-xl p-3"
              style={{ backgroundColor: 'rgba(251,191,36,0.08)' }}
            >
              <AlertCircle size={16} color={colors.warning} style={{ marginTop: 1 }} />
              <Text className="text-xs flex-1 leading-relaxed" style={{ color: colors.warning }}>
                Twitch credentials must be set in the server environment variables before continuing.
              </Text>
            </View>
          )}

          <Button
            variant={status.twitchConfigured ? 'primary' : 'secondary'}
            disabled={!status.twitchConfigured}
            onPress={onNext}
            label="Continue"
            rightIcon={<ChevronRight size={16} color="#fff" />}
          />
        </>
      )}
    </SetupCard>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Bot Account
// ---------------------------------------------------------------------------

function StepBotAccount({
  status,
  onRefreshStatus,
  onNext,
  onBack,
}: {
  status: SystemStatus
  onRefreshStatus: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [authorizing, setAuthorizing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Fetch the OAuth URL on mount so the user can copy it
  useEffect(() => {
    apiClient.get('/v1/system/setup/bot/oauth-url')
      .then(res => setOauthUrl(res.data?.data?.oauthUrl ?? null))
      .catch(() => {})
  }, [])

  // Poll for bot connection every 3 seconds while not connected
  useEffect(() => {
    if (status.botConnected) return
    const interval = setInterval(() => {
      onRefreshStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [status.botConnected, onRefreshStatus])

  // Auto-advance when bot becomes connected
  useEffect(() => {
    if (status.botConnected) {
      onNext()
    }
  }, [status.botConnected, onNext])

  const handleCopyUrl = useCallback(() => {
    if (!oauthUrl) return
    if (Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(oauthUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }, [oauthUrl])

  const handleAuthorize = useCallback(async () => {
    setAuthorizing(true)
    setError(null)
    try {
      const url = oauthUrl ?? (await apiClient.get('/v1/system/setup/bot/oauth-url')).data.data.oauthUrl
      if (Platform.OS === 'web') {
        // Redirect the current window to Twitch — after auth, Twitch redirects back
        window.location.href = url
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to get OAuth URL')
      setAuthorizing(false)
    }
  }, [oauthUrl])

  const handleCheckStatus = useCallback(async () => {
    setChecking(true)
    setError(null)
    try {
      await apiClient.get('/v1/system/setup/bot/status')
      onRefreshStatus()
    } catch (e: any) {
      setError(e?.message ?? 'Failed to check status')
    } finally {
      setChecking(false)
    }
  }, [onRefreshStatus])

  return (
    <SetupCard>
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
        >
          <Bot size={20} color={colors.accentLight} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Bot Account
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            Authorize the Twitch account the bot will use
          </Text>
        </View>
      </View>

      <View
        className="rounded-xl p-4 gap-3"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row items-center justify-between">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Bot Status
          </Text>
          <StatusBadge
            ok={status.botConnected}
            label={status.botConnected ? 'Connected' : 'Not connected'}
          />
        </View>
        {status.botConnected && status.botUsername && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Bot Username
            </Text>
            <Text className="text-sm font-semibold" style={{ color: colors.accentLight }}>
              {status.botUsername}
            </Text>
          </View>
        )}
      </View>

      {!status.botConnected && (
        <View
          className="flex-row items-start gap-2.5 rounded-xl p-3"
          style={{ backgroundColor: 'rgba(124,58,237,0.06)' }}
        >
          <Info size={16} color={colors.accentLight} style={{ marginTop: 1 }} />
          <Text className="text-xs flex-1 leading-relaxed" style={{ color: colors.textSecondary }}>
            Open the authorization link in a browser where you are logged in as the bot account (e.g. NomNomzBot). You can copy the link and paste it into a different browser.
          </Text>
        </View>
      )}

      {!status.botConnected && oauthUrl && (
        <View className="gap-2">
          <Text className="text-xs font-medium" style={{ color: colors.textMuted }}>
            Authorization URL
          </Text>
          <Pressable
            onPress={handleCopyUrl}
            className="rounded-xl p-3"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: copied ? colors.success : colors.cardBorder,
            }}
          >
            <Text
              className="text-xs font-mono"
              style={{ color: colors.textSecondary }}
              numberOfLines={2}
              selectable
            >
              {oauthUrl}
            </Text>
          </Pressable>
          <Text className="text-xs" style={{ color: copied ? colors.success : colors.textMuted }}>
            {copied ? 'Copied to clipboard!' : 'Click to copy — paste into a browser logged in as the bot account'}
          </Text>
        </View>
      )}

      {error && (
        <View
          className="flex-row items-start gap-2.5 rounded-xl p-3"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}
        >
          <AlertCircle size={16} color={colors.error} style={{ marginTop: 1 }} />
          <Text className="text-xs flex-1" style={{ color: colors.error }}>
            {error}
          </Text>
        </View>
      )}

      {!status.botConnected && (
        <View className="gap-2">
          <Button
            variant="primary"
            onPress={handleAuthorize}
            loading={authorizing}
            label="Authorize Bot Account"
            leftIcon={<ExternalLink size={16} color="#fff" />}
          />
          <Button
            variant="secondary"
            onPress={handleCheckStatus}
            loading={checking}
            label="Check Status"
          />
        </View>
      )}

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack} label="Back" />
        </View>
        <View className="flex-1">
          <Button
            variant={status.botConnected ? 'primary' : 'secondary'}
            disabled={!status.botConnected}
            onPress={onNext}
            label="Continue"
            rightIcon={<ChevronRight size={16} color={status.botConnected ? '#fff' : colors.textMuted} />}
          />
        </View>
      </View>
    </SetupCard>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Integrations
// ---------------------------------------------------------------------------

function StepIntegrations({
  status,
  onRefreshStatus,
  onNext,
  onBack,
}: {
  status: SystemStatus
  onRefreshStatus: () => void
  onNext: () => void
  onBack: () => void
}) {
  const [spotifyExpanded, setSpotifyExpanded] = useState(false)
  const [discordExpanded, setDiscordExpanded] = useState(false)

  const [spotifyId, setSpotifyId] = useState('')
  const [spotifySecret, setSpotifySecret] = useState('')
  const [spotifySaving, setSpotifySaving] = useState(false)
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [spotifySaved, setSpotifySaved] = useState(false)

  const [discordId, setDiscordId] = useState('')
  const [discordSecret, setDiscordSecret] = useState('')
  const [discordSaving, setDiscordSaving] = useState(false)
  const [discordError, setDiscordError] = useState<string | null>(null)
  const [discordSaved, setDiscordSaved] = useState(false)

  const handleSaveSpotify = useCallback(async () => {
    if (!spotifyId.trim() || !spotifySecret.trim()) return
    setSpotifySaving(true)
    setSpotifyError(null)
    try {
      await apiClient.put('/v1/system/setup/credentials/spotify', {
        clientId: spotifyId.trim(),
        clientSecret: spotifySecret.trim(),
      })
      setSpotifySaved(true)
      onRefreshStatus()
    } catch (e: any) {
      setSpotifyError(e?.message ?? 'Failed to save Spotify credentials')
    } finally {
      setSpotifySaving(false)
    }
  }, [spotifyId, spotifySecret, onRefreshStatus])

  const handleSaveDiscord = useCallback(async () => {
    if (!discordId.trim() || !discordSecret.trim()) return
    setDiscordSaving(true)
    setDiscordError(null)
    try {
      await apiClient.put('/v1/system/setup/credentials/discord', {
        clientId: discordId.trim(),
        clientSecret: discordSecret.trim(),
      })
      setDiscordSaved(true)
      onRefreshStatus()
    } catch (e: any) {
      setDiscordError(e?.message ?? 'Failed to save Discord credentials')
    } finally {
      setDiscordSaving(false)
    }
  }, [discordId, discordSecret, onRefreshStatus])

  return (
    <SetupCard>
      <View className="flex-row items-center gap-3">
        <View
          className="w-11 h-11 rounded-xl items-center justify-center"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
        >
          <Zap size={20} color={colors.accentLight} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold" style={{ color: colors.text }}>
            Integrations
          </Text>
          <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
            Optional - configure Spotify and Discord integrations
          </Text>
        </View>
      </View>

      {/* Spotify */}
      <CollapsibleSection
        title="Spotify"
        icon={<Music size={16} color="#1DB954" />}
        iconColor="#1DB954"
        expanded={spotifyExpanded}
        onToggle={() => setSpotifyExpanded((v) => !v)}
        configured={status.spotifyConfigured || spotifySaved}
      >
        {spotifySaved ? (
          <View className="flex-row items-center gap-2 py-2">
            <Check size={16} color={colors.success} />
            <Text className="text-sm" style={{ color: colors.success }}>
              Spotify credentials saved
            </Text>
          </View>
        ) : (
          <>
            <Input
              label="Client ID"
              placeholder="Enter Spotify Client ID"
              value={spotifyId}
              onChangeText={setSpotifyId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Client Secret"
              placeholder="Enter Spotify Client Secret"
              value={spotifySecret}
              onChangeText={setSpotifySecret}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {spotifyError && (
              <Text className="text-xs" style={{ color: colors.error }}>
                {spotifyError}
              </Text>
            )}
            <Button
              variant="primary"
              size="sm"
              onPress={handleSaveSpotify}
              loading={spotifySaving}
              disabled={!spotifyId.trim() || !spotifySecret.trim()}
              label="Save Spotify"
            />
          </>
        )}
      </CollapsibleSection>

      {/* Discord */}
      <CollapsibleSection
        title="Discord"
        icon={<MessageCircle size={16} color="#5865F2" />}
        iconColor="#5865F2"
        expanded={discordExpanded}
        onToggle={() => setDiscordExpanded((v) => !v)}
        configured={status.discordConfigured || discordSaved}
      >
        {discordSaved ? (
          <View className="flex-row items-center gap-2 py-2">
            <Check size={16} color={colors.success} />
            <Text className="text-sm" style={{ color: colors.success }}>
              Discord credentials saved
            </Text>
          </View>
        ) : (
          <>
            <Input
              label="Client ID"
              placeholder="Enter Discord Client ID"
              value={discordId}
              onChangeText={setDiscordId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Input
              label="Client Secret"
              placeholder="Enter Discord Client Secret"
              value={discordSecret}
              onChangeText={setDiscordSecret}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            {discordError && (
              <Text className="text-xs" style={{ color: colors.error }}>
                {discordError}
              </Text>
            )}
            <Button
              variant="primary"
              size="sm"
              onPress={handleSaveDiscord}
              loading={discordSaving}
              disabled={!discordId.trim() || !discordSecret.trim()}
              label="Save Discord"
            />
          </>
        )}
      </CollapsibleSection>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack} label="Back" />
        </View>
        <View className="flex-1">
          <Button
            variant="secondary"
            onPress={onNext}
            label="Skip"
            rightIcon={<ChevronRight size={16} color={colors.textSecondary} />}
          />
        </View>
        {(spotifySaved || discordSaved || status.spotifyConfigured || status.discordConfigured) && (
          <View className="flex-1">
            <Button
              variant="primary"
              onPress={onNext}
              label="Continue"
              rightIcon={<ChevronRight size={16} color="#fff" />}
            />
          </View>
        )}
      </View>
    </SetupCard>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Ready
// ---------------------------------------------------------------------------

function StepReady({
  status,
  onBack,
}: {
  status: SystemStatus
  onBack: () => void
}) {
  const router = useRouter()

  const checks = [
    { label: 'Twitch Application', ok: status.twitchConfigured },
    { label: 'Bot Account', ok: status.botConnected, detail: status.botUsername },
    { label: 'Spotify', ok: !!status.spotifyConfigured, optional: true },
    { label: 'Discord', ok: !!status.discordConfigured, optional: true },
  ]

  const allRequired = status.twitchConfigured && status.botConnected

  return (
    <SetupCard>
      <View className="items-center gap-3 py-2">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{
            backgroundColor: allRequired ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
          }}
        >
          {allRequired ? (
            <Check size={32} color={colors.success} />
          ) : (
            <AlertCircle size={32} color={colors.warning} />
          )}
        </View>
        <Text className="text-xl font-bold" style={{ color: colors.text }}>
          {allRequired ? 'Setup Complete' : 'Setup Incomplete'}
        </Text>
        <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
          {allRequired
            ? 'Everything is configured. You can now continue to the login page.'
            : 'Some required steps are not yet completed.'}
        </Text>
      </View>

      <View
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder }}
      >
        {checks.map((item, idx) => (
          <View
            key={item.label}
            className="flex-row items-center justify-between p-4"
            style={
              idx < checks.length - 1
                ? { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }
                : undefined
            }
          >
            <View className="flex-row items-center gap-3 flex-1">
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: item.ok
                    ? 'rgba(74,222,128,0.15)'
                    : item.optional
                      ? 'rgba(136,137,160,0.1)'
                      : 'rgba(251,191,36,0.15)',
                }}
              >
                {item.ok ? (
                  <Check size={12} color={colors.success} />
                ) : item.optional ? (
                  <Text className="text-[10px]" style={{ color: colors.textMuted }}>--</Text>
                ) : (
                  <AlertCircle size={12} color={colors.warning} />
                )}
              </View>
              <View>
                <Text className="text-sm" style={{ color: colors.text }}>
                  {item.label}
                  {item.optional && (
                    <Text style={{ color: colors.textMuted }}> (optional)</Text>
                  )}
                </Text>
                {item.detail && (
                  <Text className="text-xs" style={{ color: colors.textMuted }}>
                    {item.detail}
                  </Text>
                )}
              </View>
            </View>
            <StatusBadge
              ok={item.ok}
              label={item.ok ? 'Done' : item.optional ? 'Skipped' : 'Pending'}
            />
          </View>
        ))}
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button variant="ghost" onPress={onBack} label="Back" />
        </View>
        <View className="flex-[2]">
          <Button
            variant="primary"
            disabled={!allRequired}
            onPress={() => router.replace('/(auth)/login')}
            label="Continue to Login"
            rightIcon={<ChevronRight size={16} color="#fff" />}
          />
        </View>
      </View>
    </SetupCard>
  )
}

// ---------------------------------------------------------------------------
// Main Setup Wizard
// ---------------------------------------------------------------------------

export default function SetupWizardScreen() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<SystemStatus>({
    twitchConfigured: false,
    botConnected: false,
  })

  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, botRes] = await Promise.allSettled([
        apiClient.get('/v1/system/status'),
        apiClient.get('/v1/system/setup/bot/status'),
      ])

      const checks = statusRes.status === 'fulfilled' ? statusRes.value.data?.data?.checks : null
      const botData = botRes.status === 'fulfilled' ? botRes.value.data?.data : null

      setStatus({
        twitchConfigured: !!checks?.twitchApp?.ok,
        botConnected: !!checks?.platformBot?.ok || !!botData?.connected,
        botUsername: botData?.displayName ?? botData?.login ?? undefined,
        spotifyConfigured: !!checks?.spotify?.ok,
        discordConfigured: !!checks?.discord?.ok,
      })
    } catch {
      // Server may be unavailable — keep defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Auto-detect bot_connected from redirect query params
  useEffect(() => {
    if (Platform.OS === 'web') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('setup_step') === 'bot_connected') {
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname)
        // Refresh status and advance to bot step
        fetchStatus().then(() => setStep(2))
      }
    }
  }, [fetchStatus])

  const handleRefreshStatus = useCallback(() => {
    fetchStatus()
  }, [fetchStatus])

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      <PageHeader
        title="System Setup"
        subtitle="Configure NomercyBot for the first time"
      />

      <StepIndicator current={step} status={status} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <StepTwitchApp
            status={status}
            loading={loading}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <StepBotAccount
            status={status}
            onRefreshStatus={handleRefreshStatus}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepIntegrations
            status={status}
            onRefreshStatus={handleRefreshStatus}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <StepReady
            status={status}
            onBack={() => setStep(3)}
          />
        )}
      </ScrollView>
    </View>
  )
}
