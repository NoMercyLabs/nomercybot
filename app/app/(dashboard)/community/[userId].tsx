import { useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Modal } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { getInitials } from '@/lib/utils/string'
import { communityApi } from '@/features/community/api'
import { TrustBadge } from '@/features/community/components/TrustBadge'
import type { TrustLevel } from '@/features/community/types'

const TRUST_OPTIONS: { label: string; value: TrustLevel }[] = [
  { label: 'Viewer', value: 'viewer' },
  { label: 'Regular', value: 'regular' },
  { label: 'VIP', value: 'vip' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Broadcaster', value: 'broadcaster' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View
      className="mx-5 mb-4 rounded-xl overflow-hidden"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      <View
        className="px-4 py-3"
        style={{ backgroundColor: '#1e1f2a', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        <Text className="text-sm font-semibold text-white">{title}</Text>
      </View>
      <View className="p-4">{children}</View>
    </View>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-sm" style={{ color: '#8889a0' }}>{label}</Text>
      <Text className="text-sm text-white">{value}</Text>
    </View>
  )
}

export default function ViewerDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const channelId = useChannelStore((s) => s.currentChannel?.id) ?? ''
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((s) => s.addToast)

  const [banDialogVisible, setBanDialogVisible] = useState(false)
  const [unbanDialogVisible, setUnbanDialogVisible] = useState(false)
  const [banReason, setBanReason] = useState('')

  const { data: user, isLoading } = useQuery({
    queryKey: ['channel', channelId, 'community', 'user', userId],
    queryFn: () => communityApi.getUser(channelId, userId),
    enabled: !!channelId && !!userId,
  })

  const { mutate: setTrust, isPending: isSettingTrust } = useMutation({
    mutationFn: (level: TrustLevel) =>
      communityApi.setTrustLevel(channelId, userId, level),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['channel', channelId, 'community', 'user', userId],
      })
    },
    onError: () => addToast('error', 'Failed to update trust level'),
  })

  const { mutate: ban, isPending: isBanning } = useMutation({
    mutationFn: () => communityApi.banUser(channelId, userId, banReason),
    onSuccess: () => {
      setBanDialogVisible(false)
      setBanReason('')
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community', 'user', userId] })
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community', 'bans'] })
    },
    onError: () => addToast('error', 'Failed to ban user'),
  })

  const { mutate: unban, isPending: isUnbanning } = useMutation({
    mutationFn: () => communityApi.unbanUser(channelId, userId),
    onSuccess: () => {
      setUnbanDialogVisible(false)
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community', 'user', userId] })
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community', 'bans'] })
    },
    onError: () => addToast('error', 'Failed to unban user'),
  })

  if (isLoading) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
          <PageHeader title="Loading..." backHref="/(dashboard)/community" />
          <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 16 }}>
            <View className="items-center py-6 gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </View>
            <View className="mx-5 gap-3">
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </View>
          </ScrollView>
        </View>
      </ErrorBoundary>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
          <PageHeader title="Viewer" backHref="/(dashboard)/community" />
          <View className="flex-1 items-center justify-center">
            <Text style={{ color: '#8889a0' }}>User not found.</Text>
          </View>
        </View>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title={user.displayName || user.username}
          backHref="/(dashboard)/community"
        />

        <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}>
          {/* Avatar + name */}
          <View className="items-center py-6 gap-3">
            <View
              className="h-16 w-16 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: '#1e1f2a' }}
            >
              {user.profileImageUrl ? (
                <Image
                  source={{ uri: user.profileImageUrl }}
                  contentFit="cover"
                  style={{ width: 64, height: 64, borderRadius: 32 }}
                />
              ) : (
                <Text className="text-xl font-bold" style={{ color: '#a78bfa' }}>
                  {getInitials(user.displayName || user.username)}
                </Text>
              )}
            </View>
            <View className="items-center gap-1">
              <Text className="text-lg font-bold text-white">{user.displayName}</Text>
              <Text className="text-sm" style={{ color: '#8889a0' }}>@{user.username}</Text>
              <Text className="text-xs" style={{ color: '#5a5b72' }}>Joined {formatDate(user.firstSeen)}</Text>
            </View>
            {user.isBanned && (
              <View
                className="rounded-lg px-3 py-1.5"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
              >
                <Text className="text-xs font-semibold" style={{ color: '#f87171' }}>BANNED</Text>
              </View>
            )}
          </View>

          {/* Trust level */}
          <SectionCard title="Trust Level">
            <View className="flex-row items-center gap-3 mb-3">
              <Text className="text-sm" style={{ color: '#8889a0' }}>Current level:</Text>
              <TrustBadge level={user.trustLevel} />
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Select
                  label="Override trust level"
                  value={user.trustLevel}
                  onValueChange={(v) => setTrust(v as TrustLevel)}
                  options={TRUST_OPTIONS}
                />
              </View>
              {isSettingTrust && <ActivityIndicator size="small" color="#a855f7" />}
            </View>
          </SectionCard>

          {/* Stats */}
          <SectionCard title="Stats">
            <StatRow label="Messages sent" value={user.messageCount.toLocaleString()} />
            <View className="h-px my-1" style={{ backgroundColor: '#2a2b3a' }} />
            <StatRow label="Watch hours" value={`${user.watchHours.toLocaleString()}h`} />
            <View className="h-px my-1" style={{ backgroundColor: '#2a2b3a' }} />
            <StatRow label="Commands used" value={user.commandsUsed.toLocaleString()} />
            <View className="h-px my-1" style={{ backgroundColor: '#2a2b3a' }} />
            <StatRow label="First seen" value={formatDate(user.firstSeen)} />
            <View className="h-px my-1" style={{ backgroundColor: '#2a2b3a' }} />
            <StatRow label="Last seen" value={formatDate(user.lastSeen)} />
          </SectionCard>

          {/* Recent activity */}
          {user.recentActivity.length > 0 && (
            <SectionCard title="Recent Activity">
              {user.recentActivity.slice(0, 5).map((activity, i) => (
                <View
                  key={i}
                  className="py-2"
                  style={i < Math.min(user.recentActivity.length, 5) - 1 ? { borderBottomWidth: 1, borderBottomColor: '#2a2b3a' } : undefined}
                >
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <View
                      className="rounded px-1.5 py-0.5"
                      style={{
                        backgroundColor: activity.type === 'command'
                          ? 'rgba(59,130,246,0.2)'
                          : '#1e1f2a',
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: activity.type === 'command' ? '#60a5fa' : '#5a5b72' }}
                      >
                        {activity.type}
                      </Text>
                    </View>
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>
                      {formatDateTime(activity.timestamp)}
                    </Text>
                  </View>
                  <Text className="text-sm text-white">{activity.content}</Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Ban history */}
          {user.banHistory.length > 0 && (
            <SectionCard title="Ban History">
              {user.banHistory.map((record, i) => (
                <View
                  key={record.id}
                  className="py-2"
                  style={i < user.banHistory.length - 1 ? { borderBottomWidth: 1, borderBottomColor: '#2a2b3a' } : undefined}
                >
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="text-xs" style={{ color: '#8889a0' }}>Banned by {record.bannedBy}</Text>
                    {record.unbannedAt && (
                      <View className="rounded px-1.5 py-0.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                        <Text className="text-xs" style={{ color: '#4ade80' }}>Unbanned</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-white">{record.reason || 'No reason given'}</Text>
                  <Text className="text-xs mt-0.5" style={{ color: '#5a5b72' }}>
                    {formatDate(record.bannedAt)}
                    {record.unbannedAt ? ` → ${formatDate(record.unbannedAt)}` : ''}
                  </Text>
                </View>
              ))}
            </SectionCard>
          )}

          {/* Actions */}
          <View className="mx-5 gap-3">
            {user.isBanned ? (
              <Button
                label="Unban User"
                variant="outline"
                loading={isUnbanning}
                onPress={() => setUnbanDialogVisible(true)}
              />
            ) : (
              <Button
                label="Ban User"
                variant="danger"
                loading={isBanning}
                onPress={() => setBanDialogVisible(true)}
              />
            )}
          </View>
        </ScrollView>

        {/* Ban dialog */}
        <Modal visible={banDialogVisible} transparent animationType="fade" onRequestClose={() => setBanDialogVisible(false)}>
          <View className="flex-1 items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <View
              className="w-full max-w-sm rounded-2xl p-6 gap-4"
              style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
            >
              <View className="gap-2">
                <Text className="text-lg font-bold text-white">Ban User</Text>
                <Text style={{ color: '#8889a0' }}>
                  Are you sure you want to ban {user.displayName || user.username}? This will prevent them from chatting.
                </Text>
              </View>
              <TextInput
                value={banReason}
                onChangeText={setBanReason}
                placeholder="Reason (optional)"
                placeholderTextColor="#3a3b4f"
                className="rounded-xl px-3 py-2.5 text-sm text-white"
                style={{
                  backgroundColor: '#111218',
                  borderWidth: 1,
                  borderColor: '#2a2b3a',
                  outlineStyle: 'none',
                } as any}
                autoCapitalize="none"
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => { setBanDialogVisible(false); setBanReason('') }}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Text className="font-medium text-white">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => ban()}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <Text className="text-white font-medium">Ban</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <ConfirmDialog
          visible={unbanDialogVisible}
          title="Unban User"
          message={`Are you sure you want to unban ${user.displayName || user.username}?`}
          confirmLabel="Unban"
          variant="default"
          onConfirm={() => unban()}
          onCancel={() => setUnbanDialogVisible(false)}
        />
      </View>
    </ErrorBoundary>
  )
}
