import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function PublicLayout() {
  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  )
}
