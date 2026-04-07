import { Stack } from 'expo-router'
import { View } from 'react-native'

export default function AuthLayout() {
  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
    </View>
  )
}
