import { View, Text, Pressable, ScrollView } from 'react-native'
import { Nav, Aside, Footer } from '@/components/semantic'
import { useRouter, usePathname } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAppStore } from '@/stores/useAppStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useChannelStore } from '@/stores/useChannelStore'
import { apiClient } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'
import { useFeatureGate, NAV_HREF_TO_FEATURE_KEY } from '@/hooks/useFeatureGate'
import {
  LayoutDashboard, Terminal, Gift, Key,
  MessageSquare, Shield, Radio, Users,
  Music, Layers, Link, Timer, Workflow, Sparkles,
  Zap, CreditCard, Database, Settings,
  ChevronLeft, ChevronRight, ShieldCheck, LogOut,
  type LucideIcon,
} from 'lucide-react-native'

interface NavItem {
  label: string
  href: string
  Icon: LucideIcon
  badge?: string | number
  isLive?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'BOT',
    items: [
      { label: 'Dashboard', href: '/(dashboard)', Icon: LayoutDashboard, isLive: true },
      { label: 'Commands', href: '/(dashboard)/commands', Icon: Terminal },
      { label: 'Timers', href: '/(dashboard)/timers', Icon: Timer },
      { label: 'Rewards', href: '/(dashboard)/rewards', Icon: Gift },
      { label: 'Event Responses', href: '/(dashboard)/event-responses', Icon: Sparkles },
      { label: 'Pipelines', href: '/(dashboard)/pipelines', Icon: Workflow },
      { label: 'Permissions', href: '/(dashboard)/permissions', Icon: Key },
    ],
  },
  {
    title: 'CHANNEL',
    items: [
      { label: 'Chat', href: '/(dashboard)/chat', Icon: MessageSquare },
      { label: 'Chat Settings', href: '/(dashboard)/chat/settings' as any, Icon: Settings },
      { label: 'Moderation', href: '/(dashboard)/moderation', Icon: Shield },
      { label: 'Stream Info', href: '/(dashboard)/stream', Icon: Radio },
      { label: 'Community', href: '/(dashboard)/community', Icon: Users },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'Music', href: '/(dashboard)/music', Icon: Music },
      { label: 'Widgets', href: '/(dashboard)/widgets', Icon: Layers },
      { label: 'Integrations', href: '/(dashboard)/integrations', Icon: Link },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Features', href: '/(dashboard)/features' as any, Icon: Zap },
      { label: 'Billing', href: '/(dashboard)/billing', Icon: CreditCard },
      { label: 'Settings', href: '/(dashboard)/settings', Icon: Settings },
      { label: 'My Data', href: '/(dashboard)/my-data', Icon: Database },
    ],
  },
]

const ADMIN_SECTION: NavSection = {
  title: 'ADMIN',
  items: [
    { label: 'Admin Panel', href: '/admin', Icon: ShieldCheck },
  ],
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const isAdmin = useAuthStore((s) => s.user?.isAdmin)
  const logout = useAuthStore((s) => s.logout)
  const currentChannel = useChannelStore((s) => s.currentChannel)
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { features, loading: featuresLoading } = useFeatureGate()

  const { data: commandsData } = useQuery<{ data: unknown[] } | unknown[]>({
    queryKey: ['sidebar', 'commands-count', channelId],
    queryFn: () => apiClient.get(`/v1/channels/${channelId}/commands`).then((r) => r.data),
    enabled: !!channelId,
    staleTime: 60_000,
  })
  const commandCount = Array.isArray(commandsData) ? commandsData.length
    : Array.isArray((commandsData as any)?.data) ? (commandsData as any).data.length
    : undefined

  const { data: rewardsData } = useQuery<{ data: unknown[] } | unknown[]>({
    queryKey: ['sidebar', 'rewards-count', channelId],
    queryFn: () => apiClient.get(`/v1/channels/${channelId}/rewards`).then((r) => r.data),
    enabled: !!channelId,
    staleTime: 60_000,
  })
  const rewardCount = Array.isArray(rewardsData) ? rewardsData.length
    : Array.isArray((rewardsData as any)?.data) ? (rewardsData as any).data.length
    : undefined

  return (
    <Aside
      className={cn(
        'h-full flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-[240px]',
      )}
      style={{ backgroundColor: '#111218', borderRightWidth: 1, borderRightColor: '#2a2b3a' }}
    >
      {/* Channel avatar + info */}
      {!sidebarCollapsed && (
        <View className="px-3 pt-4 pb-3 gap-1" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 rounded-full items-center justify-center"
              style={{ backgroundColor: '#7C3AED' }}>
              <Text className="text-xs font-bold text-white">
                {(currentChannel?.displayName ?? 'N').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                {currentChannel?.displayName ?? 'NomNomzBot'}
              </Text>
              {currentChannel?.isLive ? (
                <Text className="text-xs" style={{ color: '#22c55e' }}>
                  {(currentChannel.viewerCount ?? 0).toLocaleString()} viewers
                </Text>
              ) : (
                <Text className="text-xs" style={{ color: '#5a5b72' }}>Offline</Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Nav sections */}
      <Nav style={{ flex: 1 }}>
      <ScrollView className="flex-1 py-2" showsVerticalScrollIndicator={false}>
        {[...NAV_SECTIONS, ...(isAdmin ? [ADMIN_SECTION] : [])].map((section, sectionIndex) => (
          <View key={section.title} className={cn(sectionIndex > 0 && 'mt-3')}>
            {!sidebarCollapsed && (
              <Text
                className="text-xs font-semibold uppercase tracking-widest px-4 py-1.5"
                style={{ color: '#5a5b72' }}
              >
                {section.title}
              </Text>
            )}
            {section.items.map((item) => {
              const badge = item.href === '/(dashboard)/commands' ? commandCount
                : item.href === '/(dashboard)/rewards' ? rewardCount
                : item.badge
              const isActive =
                pathname === item.href ||
                (item.href !== '/(dashboard)' && pathname.startsWith(item.href + '/')) ||
                (item.href === '/(dashboard)' && (pathname === '/(dashboard)' || pathname === '/'))

              // Feature gating: check if this nav item's feature is disabled
              const featureKey = NAV_HREF_TO_FEATURE_KEY[item.href]
              const isFeatureDisabled = featureKey != null && !featuresLoading && features[featureKey] === false

              return (
                <Pressable
                  key={`${section.title}-${item.href}-${item.label}`}
                  onPress={() => router.push(item.href as any)}
                  className={cn(
                    'flex-row items-center gap-2.5 mx-2 px-2.5 py-2 rounded-lg',
                    sidebarCollapsed && 'justify-center',
                  )}
                  style={[
                    isActive ? { backgroundColor: 'rgba(124,58,237,0.2)' } : undefined,
                    isFeatureDisabled ? { opacity: 0.45 } : undefined,
                  ]}
                >
                  <item.Icon
                    size={16}
                    color={isActive ? '#8b5cf6' : '#5a5b72'}
                  />
                  {!sidebarCollapsed && (
                    <View className="flex-1 flex-row items-center justify-between">
                      <Text
                        className="text-sm"
                        style={{
                          color: isActive ? '#a78bfa' : '#8889a0',
                          fontWeight: isActive ? '600' : '400',
                        }}
                      >
                        {item.label}
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        {isFeatureDisabled && (
                          <View
                            className="px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'rgba(90,82,128,0.2)' }}
                          >
                            <Text style={{ color: '#5a5b72', fontSize: 9, fontWeight: '600' }}>OFF</Text>
                          </View>
                        )}
                        {item.isLive && currentChannel?.isLive && (
                          <View
                            className="px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: '#22c55e' }}
                          >
                            <Text className="text-xs font-bold text-white" style={{ fontSize: 9 }}>LIVE</Text>
                          </View>
                        )}
                        {badge != null && (
                          <View
                            className="px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'rgba(124,58,237,0.25)' }}
                          >
                            <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '600' }}>
                              {badge}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>
      </Nav>

      {/* Bottom user + collapse toggle */}
      <Footer style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a' }}>
        {!sidebarCollapsed && (
          <View className="flex-row items-center gap-2 px-3 py-3">
            <View
              className="h-7 w-7 rounded-full items-center justify-center"
              style={{ backgroundColor: '#2a2b3a' }}
            >
              <Text className="text-xs font-bold" style={{ color: '#8b5cf6' }}>
                {(currentChannel?.displayName ?? 'S').charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="flex-1 text-xs font-medium" style={{ color: '#8889a0' }} numberOfLines={1}>
              {currentChannel?.displayName ?? 'Stoney_Eagle'}
            </Text>
            <Pressable onPress={logout} className="p-1 rounded-md" accessibilityLabel="Sign out">
              <LogOut size={14} color="#5a5b72" />
            </Pressable>
            <Pressable onPress={toggleSidebar} className="p-1 rounded-md">
              <ChevronLeft size={14} color="#5a5b72" />
            </Pressable>
          </View>
        )}
        {sidebarCollapsed && (
          <View className="items-center py-2 gap-2">
            <Pressable onPress={logout} className="p-1.5 rounded-md" accessibilityLabel="Sign out">
              <LogOut size={15} color="#5a5b72" />
            </Pressable>
            <Pressable onPress={toggleSidebar} className="p-1.5 rounded-md">
              <ChevronRight size={15} color="#5a5b72" />
            </Pressable>
          </View>
        )}
      </Footer>
    </Aside>
  )
}
