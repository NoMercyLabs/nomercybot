import { View } from 'react-native'
import { Slot } from 'expo-router'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <View className="flex-1 flex-row" style={{ backgroundColor: '#0a0b0f' }}>
      <Sidebar />
      <View className="flex-1">
        <Slot />
      </View>
    </View>
  )
}
