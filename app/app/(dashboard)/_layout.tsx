import { useEffect } from 'react'
import { Platform } from 'react-native'
import { Redirect, Tabs, Slot } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'
import { useChannel } from '@/hooks/useChannel'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useRealtimeChannel } from '@/hooks/useRealtimeChannel'
import { useAppStore } from '@/stores/useAppStore'
import { useChannelStore } from '@/stores/useChannelStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChannelSwitcher } from '@/components/layout/ChannelSwitcher'
import { ConnectionStatus } from '@/components/layout/ConnectionStatus'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { View } from 'react-native'
import { Main, Header } from '@/components/semantic'
import {
  LayoutDashboard,
  Terminal,
  MessageSquare,
  Music,
  Settings,
} from 'lucide-react-native'

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, isHydrated } = useAuth()
  const { currentChannel } = useChannel()
  const channelHydrated = useChannelStore((s) => s._hasHydrated)
  const { isDesktop, isTablet } = useBreakpoint()
  const { setSidebarCollapsed } = useAppStore()

  useRealtimeChannel()

  // Spec: tablet sidebar starts collapsed on mount
  useEffect(() => {
    if (isTablet && !isDesktop) {
      setSidebarCollapsed(true)
    }
  }, [isTablet, isDesktop, setSidebarCollapsed])

  if (isLoading || !isHydrated || !channelHydrated) return null

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />
  if (!currentChannel) return <Redirect href="/(auth)/onboarding" />

  // Web: full sidebar dashboard
  // Tablet: collapsible sidebar (no bottom tabs)
  if (isDesktop || isTablet) {
    return (
      <View className="flex-1 flex-row" style={{ backgroundColor: '#0a0b0f' }}>
        <Sidebar />
        <Main
          className="flex-1"
          style={{
            backgroundColor: '#0a0b0f',
            minWidth: 0,
            ...(Platform.OS === 'web' ? { overflowX: 'hidden' } as any : {}),
          }}
        >
          <Header
            className="flex-row items-center justify-between px-6 py-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
          >
            <ChannelSwitcher />
            <ConnectionStatus />
          </Header>
          <ErrorBoundary>
            <Slot />
          </ErrorBoundary>
        </Main>
      </View>
    )
  }

  // Phone: bottom tabs — exactly 5 visible, everything else hidden
  // href: null is the correct Expo Router v5 way to hide tabs; tabBarButton suppression is v4-only
  const HIDDEN_TAB = { href: null as any }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111218',
          borderTopColor: '#2a2b3a',
          borderTopWidth: 1,
          paddingTop: 4,
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#5a5b72',
        tabBarLabelStyle: {
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <LayoutDashboard color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="commands"
        options={{ title: 'Commands', tabBarIcon: ({ color }) => <Terminal color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: ({ color }) => <MessageSquare color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="music"
        options={{ title: 'Music', tabBarIcon: ({ color }) => <Music color={color} size={20} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'More', tabBarIcon: ({ color }) => <Settings color={color} size={20} /> }}
      />
      <Tabs.Screen name="rewards" options={HIDDEN_TAB} />
      <Tabs.Screen name="moderation" options={HIDDEN_TAB} />
      <Tabs.Screen name="widgets" options={HIDDEN_TAB} />
      <Tabs.Screen name="stream" options={HIDDEN_TAB} />
      <Tabs.Screen name="community" options={HIDDEN_TAB} />
      <Tabs.Screen name="pipelines" options={HIDDEN_TAB} />
      <Tabs.Screen name="integrations" options={HIDDEN_TAB} />
      <Tabs.Screen name="permissions" options={HIDDEN_TAB} />
      <Tabs.Screen name="billing" options={HIDDEN_TAB} />
      <Tabs.Screen name="features" options={HIDDEN_TAB} />
      <Tabs.Screen name="timers" options={HIDDEN_TAB} />
      <Tabs.Screen name="my-data" options={HIDDEN_TAB} />
      <Tabs.Screen name="event-responses" options={HIDDEN_TAB} />
{/* admin is a standalone route at /admin */}
    </Tabs>
  )
}
