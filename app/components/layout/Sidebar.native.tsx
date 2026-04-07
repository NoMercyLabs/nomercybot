import { View, Text, Pressable, ScrollView } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useAppStore } from '@/stores/useAppStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useFeatureGate, NAV_HREF_TO_FEATURE_KEY } from '@/hooks/useFeatureGate'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard, Terminal, MessageSquare, Music, Clock,
  Users, Shield, Gift, Layers, Radio,
  Puzzle, Link, Key, Settings,
  CreditCard, Database, Zap, ShieldCheck,
  ChevronLeft, ChevronRight,
  type LucideIcon,
} from 'lucide-react-native'

interface NavItem {
  label: string
  href: string
  Icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Main',
    items: [
      { label: 'Dashboard', href: '/(dashboard)', Icon: LayoutDashboard },
      { label: 'Commands', href: '/(dashboard)/commands', Icon: Terminal },
      { label: 'Chat', href: '/(dashboard)/chat', Icon: MessageSquare },
      { label: 'Music', href: '/(dashboard)/music', Icon: Music },
      { label: 'Timers', href: '/(dashboard)/timers', Icon: Clock },
    ],
  },
  {
    title: 'Manage',
    items: [
      { label: 'Community', href: '/(dashboard)/community', Icon: Users },
      { label: 'Moderation', href: '/(dashboard)/moderation', Icon: Shield },
      { label: 'Rewards', href: '/(dashboard)/rewards', Icon: Gift },
      { label: 'Widgets', href: '/(dashboard)/widgets', Icon: Layers },
      { label: 'Stream', href: '/(dashboard)/stream', Icon: Radio },
    ],
  },
  {
    title: 'Config',
    items: [
      { label: 'Pipelines', href: '/(dashboard)/pipelines', Icon: Puzzle },
      { label: 'Event Responses', href: '/(dashboard)/event-responses', Icon: Zap },
      { label: 'Integrations', href: '/(dashboard)/integrations', Icon: Link },
      { label: 'Permissions', href: '/(dashboard)/permissions', Icon: Key },
      { label: 'Settings', href: '/(dashboard)/settings', Icon: Settings },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Billing', href: '/(dashboard)/billing', Icon: CreditCard },
      { label: 'My Data', href: '/(dashboard)/my-data', Icon: Database },
    ],
  },
]

const ADMIN_SECTION: NavSection = {
  title: 'Admin',
  items: [
    { label: 'Admin Panel', href: '/admin', Icon: ShieldCheck },
  ],
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const isAdmin = useAuthStore((s) => s.user?.isAdmin)
  const { features, loading: featuresLoading } = useFeatureGate()

  const sections = [...NAV_SECTIONS, ...(isAdmin ? [ADMIN_SECTION] : [])]

  return (
    <View
      className={cn('h-full flex flex-col', sidebarCollapsed ? 'w-16' : 'w-64')}
      style={{ backgroundColor: '#111218', borderRightWidth: 1, borderRightColor: '#2a2b3a' }}
    >
      {/* Header with collapse toggle */}
      <View
        className="flex-row items-center justify-between px-4 py-4"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        {!sidebarCollapsed && (
          <Text className="font-bold text-sm" style={{ color: '#f4f5fa' }}>NomNomzBot</Text>
        )}
        <Pressable
          onPress={toggleSidebar}
          className="p-1 rounded-lg ml-auto"
          style={{ backgroundColor: 'transparent' }}
        >
          {sidebarCollapsed
            ? <ChevronRight size={16} color="#5a5b72" />
            : <ChevronLeft size={16} color="#5a5b72" />
          }
        </Pressable>
      </View>

      <ScrollView className="flex-1 py-2">
        {sections.map((section, sectionIndex) => (
          <View key={section.title} className={cn(sectionIndex > 0 && 'mt-2')}>
            {!sidebarCollapsed && (
              <Text
                className="text-xs font-semibold uppercase tracking-wider px-5 py-1"
                style={{ color: '#5a5b72' }}
              >
                {section.title}
              </Text>
            )}
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/(dashboard)' && pathname.startsWith(item.href + '/')) ||
                (item.href === '/(dashboard)' && (pathname === '/(dashboard)' || pathname === '/'))

              const featureKey = NAV_HREF_TO_FEATURE_KEY[item.href]
              const isFeatureDisabled = featureKey != null && !featuresLoading && features[featureKey] === false

              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as any)}
                  className={cn(
                    'flex-row items-center gap-3 mx-2 px-3 py-2.5 rounded-lg',
                    sidebarCollapsed && 'justify-center',
                  )}
                  style={[
                    isActive ? { backgroundColor: 'rgba(124,58,237,0.15)' } : undefined,
                    isFeatureDisabled ? { opacity: 0.45 } : undefined,
                  ]}
                >
                  <item.Icon
                    size={18}
                    color={isActive ? '#a78bfa' : '#5a5b72'}
                  />
                  {!sidebarCollapsed && (
                    <View className="flex-1 flex-row items-center justify-between">
                      <Text
                        className="text-sm font-medium"
                        style={{ color: isActive ? '#a78bfa' : '#8889a0' }}
                      >
                        {item.label}
                      </Text>
                      {isFeatureDisabled && (
                        <View
                          className="px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(90,82,128,0.2)' }}
                        >
                          <Text style={{ color: '#5a5b72', fontSize: 9, fontWeight: '600' }}>OFF</Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
