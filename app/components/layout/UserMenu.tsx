import { View, Text, Pressable } from 'react-native'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { LogOut } from 'lucide-react-native'

export function UserMenu() {
  const { user, logout } = useAuth()

  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3"
      style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a' }}
    >
      <Avatar src={user?.profileImageUrl ?? undefined} name={user?.displayName} size="sm" />
      <View className="flex-1">
        <Text className="text-sm font-medium" style={{ color: '#e5e7eb' }}>{user?.displayName}</Text>
        <Text className="text-xs" style={{ color: '#6b7280' }}>@{user?.username}</Text>
      </View>
      <Pressable onPress={logout} className="p-2">
        <LogOut size={16} color="#9ca3af" />
      </Pressable>
    </View>
  )
}
