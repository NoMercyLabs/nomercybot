import { useState } from 'react'
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ErrorState } from '@/components/ui/ErrorState'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { Shield, UserPlus, Trash2, Search } from 'lucide-react-native'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PermissionDto {
  Id: number
  SubjectType: string
  SubjectId: string
  SubjectName: string | null
  ResourceType: string
  ResourceId: string | null
  PermissionValue: string
  CreatedAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PERMISSION_OPTIONS = [
  { label: 'Use Commands', value: 'use_commands' },
  { label: 'Manage Commands', value: 'manage_commands' },
  { label: 'Use Rewards', value: 'use_rewards' },
  { label: 'Manage Rewards', value: 'manage_rewards' },
  { label: 'Use Music', value: 'use_music' },
  { label: 'Manage Music', value: 'manage_music' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Manage Timers', value: 'manage_timers' },
  { label: 'Manage Widgets', value: 'manage_widgets' },
  { label: 'Admin', value: 'admin' },
]

const PERMISSION_LABEL_MAP: Record<string, string> = Object.fromEntries(
  PERMISSION_OPTIONS.map((o) => [o.value, o.label]),
)

function getPermissionBadgeVariant(value: string) {
  if (value === 'admin') return 'danger' as const
  if (value.startsWith('manage_') || value === 'moderate') return 'warning' as const
  return 'info' as const
}

// ---------------------------------------------------------------------------
// Grant permission form
// ---------------------------------------------------------------------------

function GrantPermissionForm({ channelId }: { channelId: string }) {
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const [userId, setUserId] = useState('')
  const [permission, setPermission] = useState('')

  const grantMutation = useMutation({
    mutationFn: async () => {
      const trimmedId = userId.trim()
      if (!trimmedId || !permission) throw new Error('Missing fields')
      await apiClient.post(`/v1/channels/${channelId}/permissions`, {
        userId: trimmedId,
        permission,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'permissions'] })
      addToast('success', 'Permission granted')
      setUserId('')
      setPermission('')
    },
    onError: () => addToast('error', 'Failed to grant permission'),
  })

  const canSubmit = userId.trim().length > 0 && permission.length > 0

  return (
    <View
      className="rounded-xl p-4 gap-3"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      <View className="flex-row items-center gap-2.5">
        <UserPlus size={16} color="#a78bfa" />
        <Text className="text-sm font-semibold text-white">Grant Permission</Text>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Input
            placeholder="Username or User ID"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
        </View>
        <View className="flex-1">
          <Select
            value={permission}
            onValueChange={setPermission}
            options={PERMISSION_OPTIONS}
            placeholder="Select permission..."
          />
        </View>
      </View>

      <Button
        label="Grant Permission"
        leftIcon={<Shield size={14} color="#fff" />}
        loading={grantMutation.isPending}
        disabled={!canSubmit}
        onPress={() => grantMutation.mutate()}
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Permission card
// ---------------------------------------------------------------------------

function PermissionCard({
  entry,
  onRevoke,
  isRevoking,
}: {
  entry: PermissionDto
  onRevoke: () => void
  isRevoking: boolean
}) {
  return (
    <View
      className="rounded-xl p-4"
      style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
    >
      <View className="flex-row items-start gap-3">
        {/* Avatar placeholder */}
        <View
          className="h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}
        >
          <Shield size={16} color="#a78bfa" />
        </View>

        {/* Info */}
        <View className="flex-1 gap-1.5">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-sm font-semibold text-white">
              {entry.SubjectName ?? entry.SubjectId}
            </Text>
            <Badge
              variant={getPermissionBadgeVariant(entry.PermissionValue)}
              label={PERMISSION_LABEL_MAP[entry.PermissionValue] ?? entry.PermissionValue}
            />
          </View>

          <View className="flex-row items-center gap-3 flex-wrap">
            {entry.ResourceType && (
              <Text className="text-xs" style={{ color: '#8889a0' }}>
                {entry.ResourceType}
                {entry.ResourceId ? `: ${entry.ResourceId}` : ''}
              </Text>
            )}
            <Text className="text-xs" style={{ color: '#5a5b72' }}>
              {new Date(entry.CreatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Revoke button */}
        <Pressable
          onPress={onRevoke}
          disabled={isRevoking}
          className="p-2 rounded-lg"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
        >
          <Trash2 size={14} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function PermissionsScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [confirmRevoke, setConfirmRevoke] = useState<PermissionDto | null>(null)

  // -- Fetch permissions -------------------------------------------------------
  const { data, isLoading, isError, isRefetching, refetch } = useQuery<PermissionDto[]>({
    queryKey: ['channel', channelId, 'permissions'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PermissionDto[] }>(
        `/v1/channels/${channelId}/permissions`,
      )
      return res.data.data ?? []
    },
    enabled: !!channelId,
  })

  // -- Revoke mutation ---------------------------------------------------------
  const revokeMutation = useMutation({
    mutationFn: async (entry: PermissionDto) => {
      await apiClient.delete(
        `/v1/channels/${channelId}/permissions/${entry.SubjectId}?permission=${encodeURIComponent(entry.PermissionValue)}`,
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'permissions'] })
      addToast('success', 'Permission revoked')
      setConfirmRevoke(null)
    },
    onError: () => {
      addToast('error', 'Failed to revoke permission')
      setConfirmRevoke(null)
    },
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  // -- Filter by search -------------------------------------------------------
  const permissions = (data ?? []).filter((p) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (p.SubjectName?.toLowerCase().includes(q) ?? false) ||
      p.SubjectId.toLowerCase().includes(q) ||
      p.PermissionValue.toLowerCase().includes(q)
    )
  })

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />}
      >
        <PageHeader
          title="Permissions"
          subtitle="Manage who can access specific features"
        />

        <View className="px-5 pt-4 gap-4">
          {isError || timedOut ? (
            <ErrorState title="Unable to load permissions" onRetry={refetch} />
          ) : (
            <>
              {/* Grant form */}
              {channelId && <GrantPermissionForm channelId={channelId} />}

              {/* Search */}
              <View
                className="flex-row items-center gap-2.5 rounded-lg px-3 py-2.5"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <Search size={14} color="#5a5b72" />
                <Input
                  placeholder="Filter permissions..."
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="none"
                />
              </View>

              {/* List */}
              {showSkeleton ? (
                <View className="gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </View>
              ) : permissions.length === 0 ? (
                <EmptyState
                  icon={<Shield size={40} color="#3a3b4f" />}
                  title="No custom permissions"
                  message="Grant permissions to let users access features beyond their role."
                />
              ) : (
                <View className="gap-3">
                  {permissions.map((entry) => (
                    <PermissionCard
                      key={entry.Id}
                      entry={entry}
                      onRevoke={() => setConfirmRevoke(entry)}
                      isRevoking={revokeMutation.isPending}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Revoke confirmation */}
      <ConfirmDialog
        visible={!!confirmRevoke}
        title="Revoke Permission"
        message={`Remove "${PERMISSION_LABEL_MAP[confirmRevoke?.PermissionValue ?? ''] ?? confirmRevoke?.PermissionValue}" from ${confirmRevoke?.SubjectName ?? confirmRevoke?.SubjectId ?? 'this user'}?`}
        confirmLabel="Revoke"
        onConfirm={() => confirmRevoke && revokeMutation.mutate(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
      />
    </ErrorBoundary>
  )
}
