import { View, Text, ScrollView, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Activity } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'up' | 'degraded' | 'down'
  latencyMs: number | null
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down'
  services: ServiceHealth[]
  botVersion: string
  memoryUsageMb: number | null
  cpuPercent: number | null
}

function ServiceRow({ service, last }: { service: ServiceHealth; last: boolean }) {
  const isUp = service.status === 'up' || service.status === 'healthy'
  const variant = isUp ? 'success' : service.status === 'degraded' ? 'warning' : 'danger'
  const label = isUp ? 'Healthy' : service.status === 'degraded' ? 'Degraded' : 'Down'

  return (
    <View
      className="flex-row items-center justify-between py-3"
      style={last ? undefined : { borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-medium text-white">{service.name}</Text>
        {service.latencyMs != null && (
          <Text className="text-xs" style={{ color: '#5a5b72' }}>{service.latencyMs}ms latency</Text>
        )}
      </View>
      <Badge variant={variant} label={label} />
    </View>
  )
}

export default function AdminSystemScreen() {
  const { data, isLoading, refetch, isFetching } = useQuery<SystemHealth>({
    queryKey: ['admin', 'system'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SystemHealth }>('/v1/admin/system')
      return res.data.data
    },
    refetchInterval: 30_000,
  })

  const overallVariant = data?.overall === 'healthy' ? 'success'
    : data?.overall === 'degraded' ? 'warning'
    : 'danger'

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="System Health"
          rightContent={
            <Button
              size="sm"
              variant="ghost"
              label={isFetching ? 'Refreshing…' : 'Refresh'}
              onPress={() => refetch()}
            />
          }
        />

        <View className="px-5 pt-4 gap-4">
          {isLoading ? (
            <View className="gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </View>
          ) : (
            <>
              {/* Overall status */}
              <View
                className="rounded-xl p-4 flex-row items-center gap-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <Activity size={24} color="#8b5cf6" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-semibold text-white">Overall Status</Text>
                  {data?.botVersion && (
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>v{data.botVersion}</Text>
                  )}
                </View>
                {data && <Badge variant={overallVariant} label={data.overall} />}
              </View>

              {/* Resource usage */}
              {(data?.memoryUsageMb != null || data?.cpuPercent != null) && (
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <View
                    className="px-4 py-3"
                    style={{ backgroundColor: '#1e1f2a', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
                  >
                    <Text className="text-sm font-semibold text-white">Resource Usage</Text>
                  </View>
                  <View className="px-4">
                    {data!.memoryUsageMb != null && (
                      <View
                        className="flex-row justify-between py-3"
                        style={data!.cpuPercent != null ? { borderBottomWidth: 1, borderBottomColor: '#2a2b3a' } : undefined}
                      >
                        <Text className="text-sm" style={{ color: '#8889a0' }}>Memory</Text>
                        <Text className="text-sm text-white">{data!.memoryUsageMb.toFixed(0)} MB</Text>
                      </View>
                    )}
                    {data!.cpuPercent != null && (
                      <View className="flex-row justify-between py-3">
                        <Text className="text-sm" style={{ color: '#8889a0' }}>CPU</Text>
                        <Text className="text-sm text-white">{data!.cpuPercent.toFixed(1)}%</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Services */}
              {data?.services && data.services.length > 0 && (
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <View
                    className="px-4 py-3"
                    style={{ backgroundColor: '#1e1f2a', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
                  >
                    <Text className="text-sm font-semibold text-white">Services</Text>
                  </View>
                  <View className="px-4">
                    {data.services.map((s, i) => (
                      <ServiceRow key={s.name} service={s} last={i === data.services.length - 1} />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
