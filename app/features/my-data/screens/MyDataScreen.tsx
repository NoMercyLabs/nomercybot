import { View, Text, ScrollView, Alert, RefreshControl, Platform } from 'react-native'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import {
  MessageSquare, Clock, Hash, Terminal, Download, Trash2, Info, Shield,
} from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface MyData {
  messageCount: number
  watchHours: number
  channelsCount: number
  commandsUsed: number
  firstSeen: string | null
  lastActive: string | null
  exportAvailable: boolean
}

interface ChannelAppearance {
  channelName: string
  followDate: string
  messages: number
  watchTime: string
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View
      className="flex-1 rounded-xl p-4 items-center gap-2"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: '#2a2b3a',
        minWidth: '42%',
      }}
    >
      <View style={{ opacity: 0.8 }}>{icon}</View>
      <Text className="text-xl font-bold text-white">{value}</Text>
      <Text className="text-xs text-center" style={{ color: '#5a5b72' }}>{label}</Text>
    </View>
  )
}

export function MyDataScreen() {
  const { user } = useAuth()

  const { data, isLoading, isError, isRefetching, refetch } = useQuery<MyData>({
    queryKey: ['me', 'data'],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiClient.get<{ data: MyData }>(`/v1/users/${user!.id}/stats`)
      return res.data.data
    },
  })

  const { data: channels = [] } = useQuery<ChannelAppearance[]>({
    queryKey: ['me', 'channels'],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await apiClient.get<{ data: ChannelAppearance[] }>(`/v1/users/${user!.id}/channels`)
      return res.data.data
    },
  })

  const exportMutation = useMutation<void, Error>({
    mutationFn: async () => {
      if (Platform.OS === 'web') {
        const res = await apiClient.get(`/v1/users/${user!.id}/data-export`, { responseType: 'blob' })
        const url = URL.createObjectURL(res.data as Blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'user-data-export.json'
        a.click()
        URL.revokeObjectURL(url)
      } else {
        throw new Error('Please use the web app to download your data export.')
      }
    },
    onSuccess: () => Alert.alert('Export Started', 'Your data is downloading.'),
    onError: (e) => Alert.alert('Export', e.message || 'Export failed.'),
  })

  const deleteMutation = useMutation<void, Error>({
    mutationFn: async () => {
      await apiClient.delete(`/v1/users/${user!.id}/data`)
    },
    onSuccess: () => Alert.alert('Data Deleted', 'Your data has been deleted from our systems.'),
    onError: () => Alert.alert('Delete Failed', 'Could not delete your data. Please try again.'),
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  function handleDeleteRequest() {
    Alert.alert(
      'Delete My Data',
      'This will permanently delete all your data including message history, watch time, and preferences. This action cannot be undone.\n\nAre you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    )
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader title="My Data" subtitle="GDPR data management" />

        <View className="px-5 pt-4 gap-5">
          {/* Info banner */}
          <View
            className="flex-row items-start gap-3 rounded-xl p-4"
            style={{
              backgroundColor: 'rgba(59,130,246,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(59,130,246,0.3)',
            }}
          >
            <Info size={16} color="#60a5fa" />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-medium" style={{ color: '#60a5fa' }}>Your Privacy Rights</Text>
              <Text className="text-xs" style={{ color: '#8889a0' }}>
                Under GDPR you have the right to access, export, and delete your personal data at any time.
                We store only what's necessary to provide the service.
              </Text>
            </View>
          </View>

          {isError || timedOut ? (
            <ErrorState title="Unable to load your data" onRetry={refetch} />
          ) : showSkeleton ? (
            <Skeleton className="h-32 w-full" count={3} />
          ) : (
            <>
              {/* Stats grid */}
              <View className="gap-3">
                <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>
                  Your Activity
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  <StatCard icon={<MessageSquare size={20} color="#a78bfa" />} label="Messages Sent" value={(data?.messageCount ?? 0).toLocaleString()} />
                  <StatCard icon={<Clock size={20} color="#60a5fa" />} label="Watch Hours" value={(data?.watchHours ?? 0).toLocaleString()} />
                  <StatCard icon={<Hash size={20} color="#4ade80" />} label="Channels" value={(data?.channelsCount ?? 0).toString()} />
                  <StatCard icon={<Terminal size={20} color="#fbbf24" />} label="Commands Used" value={(data?.commandsUsed ?? 0).toLocaleString()} />
                </View>
              </View>

              {/* Channels you appear in */}
              <View className="gap-3">
                <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5a5b72' }}>
                  Channels You Appear In
                </Text>
                <View
                  className="rounded-xl overflow-hidden"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <View
                    className="flex-row px-4 py-2.5"
                    style={{ backgroundColor: '#1e1f2a' }}
                  >
                    {['CHANNEL', 'FOLLOW DATE', 'MESSAGES', 'WATCH TIME'].map((h, i) => (
                      <View key={h} style={{ flex: i === 0 ? 2 : 1 }}>
                        <Text className="text-xs font-semibold tracking-wider" style={{ color: '#3a3b4f' }}>{h}</Text>
                      </View>
                    ))}
                  </View>
                  {channels.length === 0 ? (
                    <View className="items-center py-8">
                      <Text className="text-sm" style={{ color: '#3a3b4f' }}>No channel data yet</Text>
                    </View>
                  ) : (
                    channels.map((ch, i) => (
                      <View
                        key={ch.channelName}
                        className="flex-row items-center px-4 py-3"
                        style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
                      >
                        <View style={{ flex: 2 }}>
                          <Text className="text-sm font-medium text-white">{ch.channelName}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text className="text-xs" style={{ color: '#8889a0' }}>{ch.followDate}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text className="text-xs" style={{ color: '#8889a0' }}>{ch.messages}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text className="text-xs" style={{ color: '#8889a0' }}>{ch.watchTime}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>

              {/* Account timeline */}
              {(data?.firstSeen || data?.lastActive) && (
                <View
                  className="rounded-xl px-4"
                  style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  {data.firstSeen && (
                    <View
                      className="flex-row justify-between items-center py-3"
                      style={{ borderBottomWidth: data.lastActive ? 1 : 0, borderBottomColor: '#2a2b3a' }}
                    >
                      <Text className="text-sm" style={{ color: '#8889a0' }}>First seen</Text>
                      <Text className="text-sm text-white">{formatDate(data.firstSeen)}</Text>
                    </View>
                  )}
                  {data.lastActive && (
                    <View className="flex-row justify-between items-center py-3">
                      <Text className="text-sm" style={{ color: '#8889a0' }}>Last active</Text>
                      <Text className="text-sm text-white">{formatDate(data.lastActive)}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Export + Delete side-by-side */}
              <View className="flex-row gap-3">
                {/* Export card */}
                <View
                  className="flex-1 rounded-xl p-4 gap-3"
                  style={{
                    backgroundColor: '#16171f',
                    borderWidth: 1,
                    borderColor: 'rgba(34,197,94,0.3)',
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Shield size={16} color="#22c55e" />
                    <Text className="text-sm font-semibold" style={{ color: '#22c55e' }}>Export Your Data</Text>
                  </View>
                  <Text className="text-xs flex-1" style={{ color: '#8889a0' }}>
                    Download a copy of all your data including message history and account information.
                  </Text>
                  <Button
                    label="Export Data"
                    leftIcon={<Download size={15} color="white" />}
                    loading={exportMutation.isPending}
                    onPress={() => exportMutation.mutate()}
                    style={{ backgroundColor: '#22c55e' } as any}
                  />
                </View>

                {/* Delete card */}
                <View
                  className="flex-1 rounded-xl p-4 gap-3"
                  style={{
                    backgroundColor: 'rgba(239,68,68,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Trash2 size={16} color="#ef4444" />
                    <Text className="text-sm font-semibold" style={{ color: '#ef4444' }}>Delete Your Data</Text>
                  </View>
                  <Text className="text-xs flex-1" style={{ color: '#8889a0' }}>
                    Permanently delete all your data from our systems. This action is irreversible.
                  </Text>
                  <Button
                    label="Delete Data"
                    variant="danger"
                    leftIcon={<Trash2 size={15} color="white" />}
                    loading={deleteMutation.isPending}
                    onPress={handleDeleteRequest}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
