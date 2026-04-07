import { ScrollView, View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

export default function SongRequestScreen() {
  const { channel } = useLocalSearchParams<{ channel: string }>()

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <View className="px-6 py-8 items-center gap-4">
        <Text className="text-2xl font-bold" style={{ color: '#f4f5fa' }}>Song Request</Text>
        <Text style={{ color: '#8889a0' }}>Channel: {channel}</Text>
      </View>
    </ScrollView>
  )
}
