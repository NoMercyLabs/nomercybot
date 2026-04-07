import { ScrollView, View, Text, Pressable, TextInput, Platform } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { FeatureDisabledBanner } from '@/components/feedback/FeatureDisabledBanner'
import { ErrorState } from '@/components/ui/ErrorState'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Volume2, Play, Mic } from 'lucide-react-native'

interface TtsConfig {
  isEnabled: boolean
  defaultVoiceId: string
  maxLength: number
  minPermission: string
  skipBotMessages: boolean
  readUsernames: boolean
}

interface TtsVoice {
  id: string
  name: string
  displayName: string
  locale: string
  gender: string
  provider: string
  isDefault: boolean
}

const PERMISSIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'subscribers', label: 'Subscribers' },
  { value: 'vip', label: 'VIPs' },
  { value: 'moderators', label: 'Moderators' },
  { value: 'broadcaster', label: 'Broadcaster Only' },
]

export default function TtsSettingsScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const qc = useQueryClient()

  const [localConfig, setLocalConfig] = useState<TtsConfig | null>(null)
  const [testText, setTestText] = useState('Hello! This is a text to speech test.')
  const [selectedVoiceFilter, setSelectedVoiceFilter] = useState<string | null>(null)

  const { data: config, isLoading, isError, refetch } = useQuery<TtsConfig>({
    queryKey: ['tts', 'config', channelId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TtsConfig }>(`/v1/channels/${channelId}/tts/config`)
      return res.data.data
    },
    enabled: !!channelId,
  })

  const { data: voices = [] } = useQuery<TtsVoice[]>({
    queryKey: ['tts', 'voices'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TtsVoice[] }>(`/v1/channels/${channelId}/tts/voices`)
      return res.data.data
    },
    enabled: !!channelId,
  })

  useEffect(() => {
    if (config && !localConfig) setLocalConfig(config)
  }, [config, localConfig])

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<TtsConfig>) => {
      const res = await apiClient.put<{ data: TtsConfig }>(`/v1/channels/${channelId}/tts/config`, patch)
      return res.data.data
    },
    onSuccess: (data) => {
      setLocalConfig(data)
      qc.invalidateQueries({ queryKey: ['tts', 'config', channelId] })
      addToast('success', 'TTS settings saved')
    },
    onError: () => addToast('error', 'Failed to save TTS settings'),
  })

  const testMutation = useMutation({
    mutationFn: async (voiceId: string) => {
      const res = await apiClient.post<{ data: { audioBase64: string; durationMs: number } }>(
        `/v1/channels/${channelId}/tts/test`,
        { text: testText, voiceId },
      )
      return res.data.data
    },
    onSuccess: (data) => {
      if (Platform.OS === 'web' && data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`)
        audio.play()
      }
    },
    onError: () => addToast('error', 'Failed to test voice'),
  })

  const update = useCallback((patch: Partial<TtsConfig>) => {
    setLocalConfig((prev) => prev ? { ...prev, ...patch } : prev)
  }, [])

  const providers = [...new Set(voices.map((v) => v.provider))]
  const filteredVoices = selectedVoiceFilter
    ? voices.filter((v) => v.provider === selectedVoiceFilter)
    : voices

  if (isLoading) {
    return (
      <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Text to Speech" />
        <View className="px-6 py-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </View>
      </ScrollView>
    )
  }

  if (isError || !localConfig) {
    return (
      <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Text to Speech" />
        <View className="px-6 py-4">
          <ErrorState title="Unable to load TTS configuration" onRetry={refetch} />
        </View>
      </ScrollView>
    )
  }

  return (
    <ErrorBoundary>
      <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }} contentContainerStyle={{ paddingBottom: 32 }}>
        <PageHeader title="Text to Speech" subtitle="Configure text-to-speech for chat messages" />
        <FeatureDisabledBanner featureKey="text_to_speech" />

        <View className="px-6 py-4 gap-6">
          {/* Enable/Disable */}
          <View className="rounded-xl p-4" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
            <Toggle
              label="Enable TTS"
              description="Read chat messages aloud using text-to-speech"
              value={localConfig.isEnabled}
              onValueChange={(v) => update({ isEnabled: v })}
            />
          </View>

          {/* General Settings */}
          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>General Settings</Text>
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
              {/* Max message length */}
              <View className="px-4 py-3 flex-row items-center justify-between" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm font-medium text-white">Max Message Length</Text>
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>Characters before message is truncated</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="text-sm text-white text-right"
                    style={{ backgroundColor: '#0a0b0f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 80, outlineStyle: 'none' } as any}
                    keyboardType="numeric"
                    value={String(localConfig.maxLength)}
                    onChangeText={(v) => update({ maxLength: Math.max(1, Math.min(500, parseInt(v) || 1)) })}
                  />
                </View>
              </View>

              {/* Min permission */}
              <View className="px-4 py-3 gap-2" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                <Text className="text-sm font-medium text-white">Minimum Permission</Text>
                <Text className="text-xs" style={{ color: '#5a5b72' }}>Who can trigger TTS with their messages</Text>
                <View className="flex-row flex-wrap gap-2 mt-1">
                  {PERMISSIONS.map((p) => (
                    <Pressable
                      key={p.value}
                      onPress={() => update({ minPermission: p.value })}
                      className="px-3 py-1.5 rounded-lg"
                      style={{
                        backgroundColor: localConfig.minPermission === p.value ? 'rgba(124,58,237,0.3)' : '#0a0b0f',
                        borderWidth: 1,
                        borderColor: localConfig.minPermission === p.value ? '#7C3AED' : '#2a2b3a',
                      }}
                    >
                      <Text className="text-xs font-medium" style={{ color: localConfig.minPermission === p.value ? '#a78bfa' : '#8889a0' }}>
                        {p.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Toggles */}
              <View className="px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
                <Toggle
                  label="Skip Bot Messages"
                  description="Don't read messages from known bots"
                  value={localConfig.skipBotMessages}
                  onValueChange={(v) => update({ skipBotMessages: v })}
                />
              </View>
              <View className="px-4 py-3">
                <Toggle
                  label="Read Usernames"
                  description="Announce who sent the message before reading it"
                  value={localConfig.readUsernames}
                  onValueChange={(v) => update({ readUsernames: v })}
                />
              </View>
            </View>
          </View>

          {/* Voice Selection */}
          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>Voice</Text>

            {/* Provider filter */}
            {providers.length > 1 && (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setSelectedVoiceFilter(null)}
                  className="px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: !selectedVoiceFilter ? '#7C3AED' : '#16171f',
                    borderWidth: 1,
                    borderColor: !selectedVoiceFilter ? '#7C3AED' : '#2a2b3a',
                  }}
                >
                  <Text className="text-xs font-medium" style={{ color: !selectedVoiceFilter ? '#fff' : '#8889a0' }}>All</Text>
                </Pressable>
                {providers.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setSelectedVoiceFilter(p)}
                    className="px-3 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: selectedVoiceFilter === p ? '#7C3AED' : '#16171f',
                      borderWidth: 1,
                      borderColor: selectedVoiceFilter === p ? '#7C3AED' : '#2a2b3a',
                    }}
                  >
                    <Text className="text-xs font-medium capitalize" style={{ color: selectedVoiceFilter === p ? '#fff' : '#8889a0' }}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Voice list */}
            <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
              {filteredVoices.length === 0 ? (
                <View className="items-center py-8">
                  <Mic size={24} color="#3a3b4f" />
                  <Text className="text-sm mt-2" style={{ color: '#3a3b4f' }}>No voices available</Text>
                </View>
              ) : (
                filteredVoices.slice(0, 20).map((voice, i) => {
                  const isSelected = localConfig.defaultVoiceId === voice.id
                  return (
                    <Pressable
                      key={voice.id}
                      onPress={() => update({ defaultVoiceId: voice.id })}
                      className="flex-row items-center justify-between px-4 py-3"
                      style={{
                        ...(i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : {}),
                        ...(isSelected ? { backgroundColor: 'rgba(124,58,237,0.1)' } : {}),
                      }}
                    >
                      <View className="flex-1 gap-0.5">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-medium" style={{ color: isSelected ? '#a78bfa' : '#f4f5fa' }}>
                            {voice.displayName}
                          </Text>
                          {isSelected && (
                            <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: '#7C3AED' }}>
                              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>SELECTED</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs" style={{ color: '#5a5b72' }}>
                          {voice.provider} · {voice.locale} · {voice.gender}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => testMutation.mutate(voice.id)}
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: '#0a0b0f' }}
                      >
                        <Play size={14} color="#8889a0" />
                      </Pressable>
                    </Pressable>
                  )
                })
              )}
              {filteredVoices.length > 20 && (
                <View className="items-center py-2" style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a' }}>
                  <Text className="text-xs" style={{ color: '#5a5b72' }}>
                    Showing 20 of {filteredVoices.length} voices
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Test TTS */}
          <View className="gap-3">
            <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>Test</Text>
            <View className="rounded-xl p-4 gap-3" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
              <View className="flex-row items-center gap-2">
                <Volume2 size={16} color="#8b5cf6" />
                <Text className="text-sm font-medium text-white">Preview Voice</Text>
              </View>
              <TextInput
                className="text-sm text-white rounded-lg px-3 py-2.5"
                style={{ backgroundColor: '#0a0b0f', borderWidth: 1, borderColor: '#2a2b3a', outlineStyle: 'none' } as any}
                placeholder="Type a message to preview..."
                placeholderTextColor="#3a3b4f"
                value={testText}
                onChangeText={setTestText}
                multiline
              />
              <Button
                label={testMutation.isPending ? 'Playing...' : 'Test Voice'}
                leftIcon={<Play size={14} color="#fff" />}
                onPress={() => localConfig.defaultVoiceId && testMutation.mutate(localConfig.defaultVoiceId)}
                loading={testMutation.isPending}
              />
            </View>
          </View>

          {/* Save Button */}
          <Button
            label="Save TTS Settings"
            onPress={() => saveMutation.mutate(localConfig)}
            loading={saveMutation.isPending}
            size="lg"
          />
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
