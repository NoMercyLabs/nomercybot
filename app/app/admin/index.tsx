import { View, Text, ScrollView } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import {
  Users, Hash, Activity, Server,
  CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface AdminStats {
  totalChannels: number
  activeChannels: number
  totalUsers: number
  systemStatus: 'healthy' | 'degraded' | 'down'
  botUptimeSeconds: number
  eventsProcessedToday: number
}

interface ServiceHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
}

interface PlatformEvent {
  message: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
}

function StatCard({ label, value, icon, accentColor }: {
  label: string
  value: string | number
  icon: React.ReactNode
  accentColor: string
}) {
  return (
    <View
      className="flex-1 rounded-xl px-4 py-4 gap-2"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: '#2a2b3a',
        borderLeftWidth: 3,
        borderLeftColor: accentColor,
        minWidth: '42%',
      }}
    >
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-xs uppercase tracking-wider" style={{ color: '#5a5b72' }}>{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-white">{value}</Text>
    </View>
  )
}

const statusConfig = {
  healthy:  { color: '#22c55e', Icon: CheckCircle },
  degraded: { color: '#f59e0b', Icon: AlertTriangle },
  down:     { color: '#ef4444', Icon: XCircle },
}

const eventColors = {
  info:    '#60a5fa',
  success: '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
}

export default function AdminDashboardScreen() {
  const { isDesktop } = useBreakpoint()

  const { data, isLoading, isError, refetch } = useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AdminStats }>('/v1/admin/stats')
      return res.data.data
    },
    refetchInterval: 30_000,
  })

  const { data: healthServices = [] } = useQuery<ServiceHealth[]>({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ServiceHealth[] }>('/v1/admin/health')
      return res.data.data
    },
    refetchInterval: 30_000,
  })

  const { data: platformEvents = [] } = useQuery<PlatformEvent[]>({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PlatformEvent[] }>('/v1/admin/events')
      return res.data.data
    },
    refetchInterval: 60_000,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut
  const overallStatus = data?.systemStatus ?? 'healthy'
  const { color: statusColor, Icon: StatusIcon } = statusConfig[overallStatus]

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title="Admin Panel"
          subtitle="System overview"
          rightContent={
            data ? (
              <View className="flex-row items-center gap-1.5">
                <StatusIcon size={14} color={statusColor} />
                <Text className="text-xs font-medium" style={{ color: statusColor }}>
                  {overallStatus === 'healthy' ? 'All Systems OK' : overallStatus}
                </Text>
              </View>
            ) : undefined
          }
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          <View className="px-5 pt-4 gap-5">
            {isError || timedOut ? (
              <ErrorState title="Unable to load admin stats" onRetry={refetch} />
            ) : showSkeleton ? (
              <Skeleton className="h-24 w-full" count={3} />
            ) : (
              <>
                {/* Stat cards */}
                <View className="flex-row flex-wrap gap-3">
                  <StatCard
                    label="Total Channels"
                    value={data?.totalChannels ?? 0}
                    icon={<Hash size={14} color="#a78bfa" />}
                    accentColor="#7C3AED"
                  />
                  <StatCard
                    label="Active Users"
                    value={data?.totalUsers ?? 0}
                    icon={<Users size={14} color="#4ade80" />}
                    accentColor="#22c55e"
                  />
                  <StatCard
                    label="Events/min"
                    value={(data?.eventsProcessedToday ?? 0).toLocaleString()}
                    icon={<Server size={14} color="#fbbf24" />}
                    accentColor="#f59e0b"
                  />
                  <StatCard
                    label="CPU"
                    value={(data as any)?.cpuUsage != null ? `${(data as any).cpuUsage}%` : '—'}
                    icon={<Activity size={14} color="#60a5fa" />}
                    accentColor="#3b82f6"
                  />
                  <StatCard
                    label="Memory"
                    value={(data as any)?.memoryUsage != null ? `${(data as any).memoryUsage}%` : '—'}
                    icon={<Activity size={14} color="#a78bfa" />}
                    accentColor="#7C3AED"
                  />
                </View>

                {isDesktop ? (
                  <View className="flex-row gap-5" style={{ alignItems: 'flex-start' }}>
                    {/* System health */}
                    <View className="flex-1 gap-3">
                      <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>System Health</Text>
                      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
                        {healthServices.length === 0 ? (
                          <View className="items-center py-8">
                            <Text className="text-sm" style={{ color: '#3a3b4f' }}>No service data</Text>
                          </View>
                        ) : healthServices.map((service, i) => {
                          const { color } = statusConfig[service.status] ?? statusConfig.healthy
                          return (
                            <View
                              key={service.name}
                              className="flex-row items-center justify-between px-4 py-3"
                              style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                            >
                              <Text className="text-sm text-white">{service.name}</Text>
                              <View className="flex-row items-center gap-1.5">
                                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <Text className="text-xs font-medium capitalize" style={{ color }}>{service.status}</Text>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    </View>

                    {/* Platform events */}
                    <View className="flex-1 gap-3">
                      <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>Platform Events</Text>
                      <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
                        {platformEvents.length === 0 ? (
                          <View className="items-center py-8">
                            <Text className="text-sm" style={{ color: '#3a3b4f' }}>No recent events</Text>
                          </View>
                        ) : platformEvents.map((event, i) => {
                          const color = eventColors[event.type as keyof typeof eventColors] ?? '#8889a0'
                          return (
                            <View
                              key={i}
                              className="flex-row items-center gap-3 px-4 py-3"
                              style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                            >
                              <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                              <Text className="flex-1 text-sm" style={{ color: '#cdcede' }}>{event.message}</Text>
                              <Text className="text-xs" style={{ color: '#3a3b4f' }}>{event.time}</Text>
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  </View>
                ) : (
                  <>
                    {healthServices.length > 0 && (
                      <View className="gap-3">
                        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>System Health</Text>
                        <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
                          {healthServices.map((service, i) => {
                            const { color } = statusConfig[service.status] ?? statusConfig.healthy
                            return (
                              <View
                                key={service.name}
                                className="flex-row items-center justify-between px-4 py-3"
                                style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                              >
                                <Text className="text-sm text-white">{service.name}</Text>
                                <View className="flex-row items-center gap-1.5">
                                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                  <Text className="text-xs font-medium capitalize" style={{ color }}>{service.status}</Text>
                                </View>
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    )}
                    {platformEvents.length > 0 && (
                      <View className="gap-3">
                        <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>Platform Events</Text>
                        <View className="rounded-xl overflow-hidden" style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}>
                          {platformEvents.map((event, i) => {
                            const color = eventColors[event.type as keyof typeof eventColors] ?? '#8889a0'
                            return (
                              <View
                                key={i}
                                className="flex-row items-center gap-3 px-4 py-3"
                                style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                              >
                                <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                                <Text className="flex-1 text-sm" style={{ color: '#cdcede' }}>{event.message}</Text>
                                <Text className="text-xs" style={{ color: '#3a3b4f' }}>{event.time}</Text>
                              </View>
                            )
                          })}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </ErrorBoundary>
  )
}
