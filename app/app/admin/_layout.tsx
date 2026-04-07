import { View, Text, ScrollView, Pressable } from 'react-native'
import { Nav, Main, Aside, Header } from '@/components/semantic'
import { Slot, Redirect, useRouter, usePathname } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import {
  LayoutDashboard, Server, Users, Radio,
  ArrowLeft, ShieldCheck, Bot,
} from 'lucide-react-native'

const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', Icon: LayoutDashboard },
  { label: 'Channels', href: '/admin/channels', Icon: Radio },
  { label: 'Users', href: '/admin/users', Icon: Users },
  { label: 'Platform Bot', href: '/admin/bot', Icon: Bot },
  { label: 'System Health', href: '/admin/system', Icon: Server },
] as const

export default function AdminLayout() {
  const { user, isHydrated, isLoading } = useAuth()
  const { isDesktop, isTablet } = useBreakpoint()
  const router = useRouter()
  const pathname = usePathname()

  if (isLoading || !isHydrated) return null
  if (!user?.isAdmin) return <Redirect href="/(dashboard)" />

  const showSidebar = isDesktop || isTablet

  return (
    <View className="flex-1 flex-row" style={{ backgroundColor: '#0a0b0f' }}>
      {showSidebar && (
        <Aside
          style={{
            width: 220,
            backgroundColor: '#111218',
            borderRightWidth: 1,
            borderRightColor: '#2a2b3a',
          }}
        >
          {/* Header */}
          <Header
            className="px-4 pt-5 pb-4 gap-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
          >
            <View className="flex-row items-center gap-2.5">
              <ShieldCheck size={20} color="#8b5cf6" />
              <Text className="text-base font-bold text-white">Admin Panel</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(dashboard)')}
              className="flex-row items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}
            >
              <ArrowLeft size={12} color="#5a5b72" />
              <Text className="text-xs" style={{ color: '#5a5b72' }}>Back to Dashboard</Text>
            </Pressable>
          </Header>

          {/* Nav */}
          <Nav style={{ flex: 1 }}>
          <ScrollView className="flex-1 py-3" showsVerticalScrollIndicator={false}>
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href + '/')) ||
                (item.href === '/admin' && pathname === '/admin')
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  className="flex-row items-center gap-2.5 mx-2 px-3 py-2.5 rounded-lg mb-0.5"
                  style={isActive ? { backgroundColor: 'rgba(124,58,237,0.2)' } : undefined}
                >
                  <item.Icon size={16} color={isActive ? '#8b5cf6' : '#5a5b72'} />
                  <Text
                    className="text-sm"
                    style={{
                      color: isActive ? '#a78bfa' : '#8889a0',
                      fontWeight: isActive ? '600' : '400',
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
          </Nav>
        </Aside>
      )}

      {/* Main content */}
      <Main className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        {!showSidebar && (
          <View
            className="flex-row items-center gap-3 px-4 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
          >
            <Pressable onPress={() => router.push('/(dashboard)')}>
              <ArrowLeft size={18} color="#8889a0" />
            </Pressable>
            <ShieldCheck size={16} color="#8b5cf6" />
            <Text className="text-sm font-semibold text-white">Admin Panel</Text>
          </View>
        )}
        <Slot />
      </Main>
    </View>
  )
}
