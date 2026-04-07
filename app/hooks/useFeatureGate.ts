import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'

interface FeatureStates {
  [key: string]: boolean
}

/**
 * Fetches channel feature states from the API and caches them.
 * Returns the full feature map plus loading/error state.
 */
export function useFeatureGate() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading, isError } = useQuery<FeatureStates>({
    queryKey: ['channel', channelId, 'features'],
    queryFn: () =>
      apiClient
        .get<{ data: FeatureStates }>(`/v1/channels/${channelId}/features`)
        .then((r) => r.data.data),
    enabled: !!channelId,
    staleTime: 60_000,
  })

  return { features: data ?? {}, loading: isLoading, error: isError }
}

/**
 * Check whether a specific feature is enabled for the current channel.
 *
 * @param featureKey  The API feature key (e.g. "chat_commands", "auto_moderation").
 * @returns `{ enabled, loading }` — `enabled` defaults to `true` while loading
 *          so that the UI is permissive until data arrives.
 */
export function useIsFeatureEnabled(featureKey: string): { enabled: boolean; loading: boolean } {
  const { features, loading } = useFeatureGate()

  // Default to enabled while still loading so the UI doesn't flash disabled state
  if (loading) return { enabled: true, loading: true }

  // If the key doesn't exist in the map the feature is implicitly enabled
  const enabled = features[featureKey] ?? true

  return { enabled, loading: false }
}

/**
 * Mapping from feature keys (as returned by the API) to sidebar navigation hrefs.
 * Used by the Sidebar to determine which nav items should show a disabled indicator.
 */
export const FEATURE_KEY_TO_NAV_HREF: Record<string, string> = {
  chat_commands: '/(dashboard)/commands',
  channel_points: '/(dashboard)/rewards',
  auto_moderation: '/(dashboard)/moderation',
  song_requests: '/(dashboard)/music',
  text_to_speech: '/(dashboard)/settings/tts',
  stream_alerts: '/(dashboard)/widgets',
  // timers doesn't have a dedicated feature key in FeaturesScreen,
  // but the sidebar mapping was requested — use a logical key
  timers: '/(dashboard)/timers',
}

/**
 * Reverse mapping: nav href -> feature key.
 * Built from FEATURE_KEY_TO_NAV_HREF so there's a single source of truth.
 */
export const NAV_HREF_TO_FEATURE_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(FEATURE_KEY_TO_NAV_HREF).map(([key, href]) => [href, key]),
)
