import { View, Text } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { useIsFeatureEnabled } from '@/hooks/useFeatureGate'

interface FeatureDisabledBannerProps {
  /** The API feature key to check (e.g. "chat_commands", "auto_moderation"). */
  featureKey: string
}

/**
 * Shows an informational banner when a feature is disabled for the current channel.
 * Renders nothing when the feature is enabled or while loading.
 */
export function FeatureDisabledBanner({ featureKey }: FeatureDisabledBannerProps) {
  const { enabled, loading } = useIsFeatureEnabled(featureKey)
  const router = useRouter()

  if (loading || enabled) return null

  return (
    <View
      className="mx-5 mt-4 rounded-xl p-4 flex-row items-start gap-3"
      style={{
        backgroundColor: 'rgba(245,158,11,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(245,158,11,0.3)',
      }}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mt-0.5"
        style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}
      >
        <AlertTriangle size={16} color="#f59e0b" />
      </View>
      <View className="flex-1 gap-2">
        <Text className="text-sm font-semibold" style={{ color: '#fbbf24' }}>
          Feature Disabled
        </Text>
        <Text className="text-xs leading-5" style={{ color: '#8889a0' }}>
          This feature is not enabled for your channel. Enable it in Settings to start using it.
        </Text>
        <Button
          variant="secondary"
          size="sm"
          label="Enable in Features"
          onPress={() => router.push('/(dashboard)/features' as any)}
          className="self-start mt-1"
        />
      </View>
    </View>
  )
}
