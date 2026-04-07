import { Pressable, Text, ActivityIndicator } from 'react-native'
import { Tv } from 'lucide-react-native'

interface TwitchLoginButtonProps {
  onPress: () => void
  isLoading?: boolean
}

export function TwitchLoginButton({ onPress, isLoading = false }: TwitchLoginButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className="w-full flex-row items-center justify-center gap-3 rounded-xl bg-[#9147ff] py-4 px-6 active:opacity-80 disabled:opacity-50"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Tv size={20} color="white" strokeWidth={2} />
      )}
      <Text className="text-white font-semibold text-base">
        {isLoading ? 'Connecting...' : 'Continue with Twitch'}
      </Text>
    </Pressable>
  )
}
