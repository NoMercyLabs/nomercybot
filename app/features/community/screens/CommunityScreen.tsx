import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  RefreshControl,
  ScrollView,
} from 'react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Ban, Search, Star, Shield, Crown, ChevronLeft, ChevronRight } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { useChannelStore } from '@/stores/useChannelStore'
import { apiClient } from '@/lib/api/client'
import { getInitials } from '@/lib/utils/string'
import { formatRelativeTime } from '@/lib/utils/format'
import { communityApi } from '../api'
import { TrustBadge } from '../components/TrustBadge'
import type { CommunityUser, BannedUser } from '../types'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'

interface CommunityStats {
  followers: number
  subscribers: number
  vips: number
  moderators: number
}

type Tab = 'Followers' | 'Subscribers' | 'VIPs' | 'Moderators' | 'Bans'

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <View
      className="flex-1 rounded-xl px-4 py-3 gap-1.5"
      style={{
        backgroundColor: '#16171f',
        borderWidth: 1,
        borderColor: '#2a2b3a',
        borderLeftWidth: 3,
        borderLeftColor: color,
        minWidth: 100,
      }}
    >
      {icon}
      <Text className="text-xl font-bold text-white">{value.toLocaleString()}</Text>
      <Text className="text-xs" style={{ color: '#5a5b72' }}>{label}</Text>
    </View>
  )
}

interface UserRowProps {
  user: CommunityUser
  onPress: () => void
  channelId: string
}

function UserRow({ user, onPress, channelId }: UserRowProps) {
  const queryClient = useQueryClient()
  const addVipMutation = useMutation({
    mutationFn: () => apiClient.post(`/v1/channels/${channelId}/community/vips`, { userId: user.id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community'] }),
  })
  const removeVipMutation = useMutation({
    mutationFn: () => apiClient.delete(`/v1/channels/${channelId}/community/vips/${user.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community'] }),
  })
  const removeModMutation = useMutation({
    mutationFn: () => apiClient.delete(`/v1/channels/${channelId}/community/moderators/${user.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community'] }),
  })

  const isVip = user.trustLevel === 'vip'
  const isMod = user.trustLevel === 'moderator'

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-2.5"
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      {/* USER col (flex: 3) */}
      <View style={{ flex: 3 }} className="flex-row items-center gap-2.5">
        <View
          className="h-7 w-7 rounded-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#1e1f2a' }}
        >
          {user.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} contentFit="cover" style={{ width: 28, height: 28, borderRadius: 14 }} />
          ) : (
            <Text className="text-xs font-bold" style={{ color: '#a78bfa' }}>
              {getInitials(user.displayName || user.username)}
            </Text>
          )}
        </View>
        <Text className="text-sm font-medium text-white" numberOfLines={1}>
          {user.displayName || user.username}
        </Text>
      </View>
      {/* ROLE col (flex: 1) */}
      <View style={{ flex: 1 }}>
        <TrustBadge level={user.trustLevel} />
      </View>
      {/* MSGS col (flex: 1) */}
      <View style={{ flex: 1 }}>
        <Text className="text-xs" style={{ color: '#8889a0' }}>{user.messageCount.toLocaleString()}</Text>
      </View>
      {/* WATCH col (flex: 1) */}
      <View style={{ flex: 1 }}>
        <Text className="text-xs" style={{ color: '#8889a0' }}>{user.watchHours}h</Text>
      </View>
      {/* ACTIONS col (flex: 1.5) */}
      <View style={{ flex: 1.5 }} className="flex-row gap-1">
        {isMod && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); removeModMutation.mutate() }}
            className="px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '500' }}>Remove Mod</Text>
          </Pressable>
        )}
        {isVip && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); removeVipMutation.mutate() }}
            className="px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}
          >
            <Text style={{ color: '#f87171', fontSize: 11, fontWeight: '500' }}>Remove VIP</Text>
          </Pressable>
        )}
        {!isVip && !isMod && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); addVipMutation.mutate() }}
            className="px-2 py-1 rounded"
            style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' }}
          >
            <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '500' }}>Add VIP</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  )
}

function UserRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-5 py-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <View className="flex-1 gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </View>
    </View>
  )
}

function BanRow({ ban, onUnban, unbanning }: { ban: BannedUser; onUnban: () => void; unbanning: boolean }) {
  return (
    <View
      className="px-5 py-3 gap-1"
      style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-white">{ban.displayName || ban.username}</Text>
        <Button label="Unban" variant="outline" size="sm" loading={unbanning} onPress={onUnban} />
      </View>
      <Text className="text-xs" style={{ color: '#8889a0' }}>Reason: {ban.reason || 'No reason provided'}</Text>
      <Text className="text-xs" style={{ color: '#5a5b72' }}>
        Banned by {ban.bannedBy} · {formatRelativeTime(ban.bannedAt)}
      </Text>
    </View>
  )
}

const TAB_ROLE_MAP: Record<Tab, 'follower' | 'subscriber' | 'vip' | 'moderator' | undefined> = {
  Followers: 'follower',
  Subscribers: 'subscriber',
  VIPs: 'vip',
  Moderators: 'moderator',
  Bans: undefined,
}

type SortOption = 'newest' | 'oldest' | 'messages' | 'alpha'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'messages', label: 'Most Messages' },
  { value: 'alpha', label: 'Alphabetical' },
]

function UsersTab({ channelId, role }: { channelId: string; role?: 'follower' | 'subscriber' | 'vip' | 'moderator' }) {
  const isFollowers = role === 'follower'
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [sortOpen, setSortOpen] = useState(false)
  const [page, setPage] = useState(1)
  // Cursor stack for followers tab: index = page - 1, value = cursor to use for that page
  const [cursorStack, setCursorStack] = useState<string[]>([])
  const PAGE_SIZE = 25

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search); setPage(1); setCursorStack([]) }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => { setPage(1); setCursorStack([]) }, [sort, role])

  const currentCursor = isFollowers ? cursorStack[page - 1] : undefined

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['channel', channelId, 'community', 'users', debouncedSearch, role, sort, page, currentCursor],
    queryFn: () => communityApi.getUsers(channelId, {
      search: debouncedSearch || undefined,
      page: isFollowers ? 1 : page,
      take: PAGE_SIZE,
      role,
      sort,
      cursor: currentCursor,
    }),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const users = data?.data ?? []
  const totalCount = data?.total ?? users.length
  const hasMore = data?.hasMore ?? false
  const nextCursor = data?.nextCursor
  const totalPages = isFollowers
    ? (hasMore ? page + 1 : page)
    : Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleNextPage = () => {
    if (isFollowers && nextCursor) {
      setCursorStack(s => { const copy = [...s]; copy[page] = nextCursor; return copy })
    }
    setPage(p => p + 1)
  }

  const handlePrevPage = () => {
    setPage(p => Math.max(1, p - 1))
  }

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? 'Newest First'

  return (
    <View className="flex-1">
      {/* Toolbar: search + sort */}
      <View
        className="px-5 py-3 flex-row gap-2.5"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        <View
          className="flex-1 flex-row items-center gap-2.5 rounded-lg px-3 py-2.5"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
        >
          <Search size={14} color="#5a5b72" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search users..."
            placeholderTextColor="#3a3b4f"
            className="flex-1 text-sm text-white"
            style={{ outlineStyle: 'none' } as any}
          />
        </View>
        {/* Sort dropdown */}
        <View style={{ position: 'relative' }}>
          <Pressable
            onPress={() => setSortOpen(o => !o)}
            className="flex-row items-center gap-1.5 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a', minWidth: 140 }}
          >
            <Text className="text-sm flex-1" style={{ color: '#8889a0' }}>Sort: {currentSortLabel}</Text>
          </Pressable>
          {sortOpen && (
            <View
              className="absolute rounded-lg overflow-hidden"
              style={{ top: 40, right: 0, zIndex: 10, backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a', minWidth: 160 }}
            >
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => { setSort(opt.value); setSortOpen(false) }}
                  className="px-4 py-2.5"
                  style={{ backgroundColor: sort === opt.value ? 'rgba(124,58,237,0.15)' : 'transparent' }}
                >
                  <Text className="text-sm" style={{ color: sort === opt.value ? '#a78bfa' : '#8889a0' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Table header */}
      <View
        className="flex-row items-center px-5 py-2.5"
        style={{ backgroundColor: '#16171f', borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        {[
          { label: 'USER', flex: 3 },
          { label: 'ROLE', flex: 1 },
          { label: 'MSGS', flex: 1 },
          { label: 'WATCH', flex: 1 },
          { label: 'ACTIONS', flex: 1.5 },
        ].map((col) => (
          <View key={col.label} style={{ flex: col.flex }}>
            <Text className="text-xs font-semibold tracking-wider" style={{ color: '#3a3b4f' }}>
              {col.label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />}>
        {showSkeleton ? (
          <View>
            {Array.from({ length: 5 }).map((_, i) => <UserRowSkeleton key={i} />)}
          </View>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users size={40} color="#3a3b4f" />}
            title="No users found"
            message={debouncedSearch ? `No users match "${debouncedSearch}"` : 'No users in this channel yet.'}
          />
        ) : (
          <>
            {users.map((item) => (
              <UserRow
                key={item.id}
                user={item}
                channelId={channelId}
                onPress={() => router.push(`/(dashboard)/community/${item.id}` as any)}
              />
            ))}
            {data && users.length > 0 && (
              <View
                className="px-5 py-3 flex-row items-center justify-between"
                style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a' }}
              >
                <Text className="text-xs" style={{ color: '#5a5b72' }}>
                  {isFollowers
                    ? `Page ${page} · ${totalCount.toLocaleString()} total`
                    : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, totalCount)} of ${totalCount.toLocaleString()}`}
                </Text>
                {(totalPages > 1 || hasMore) && (
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      onPress={handlePrevPage}
                      disabled={page === 1}
                      className="w-7 h-7 rounded items-center justify-center"
                      style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a', opacity: page === 1 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={12} color="#8889a0" />
                    </Pressable>
                    {!isFollowers && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = i + Math.max(1, Math.min(page - 2, totalPages - 4))
                      return (
                        <Pressable
                          key={p}
                        onPress={() => setPage(p)}
                        className="w-7 h-7 rounded items-center justify-center"
                        style={{
                          backgroundColor: p === page ? 'rgba(124,58,237,0.25)' : '#1e1f2a',
                          borderWidth: 1,
                          borderColor: p === page ? '#7C3AED' : '#2a2b3a',
                        }}
                      >
                        <Text className="text-xs font-medium" style={{ color: p === page ? '#a78bfa' : '#8889a0' }}>{p}</Text>
                      </Pressable>
                    )
                  })}
                  {isFollowers && (
                    <View className="w-7 h-7 rounded items-center justify-center" style={{ backgroundColor: 'rgba(124,58,237,0.25)', borderWidth: 1, borderColor: '#7C3AED' }}>
                      <Text className="text-xs font-medium" style={{ color: '#a78bfa' }}>{page}</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={handleNextPage}
                    disabled={!hasMore && page >= totalPages}
                    className="w-7 h-7 rounded items-center justify-center"
                    style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a', opacity: (!hasMore && page >= totalPages) ? 0.4 : 1 }}
                  >
                    <ChevronRight size={12} color="#8889a0" />
                  </Pressable>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function BansTab({ channelId }: { channelId: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['channel', channelId, 'community', 'bans'],
    queryFn: () => communityApi.getBans(channelId, { page: 1, take: 25 }),
    enabled: !!channelId,
  })

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const { mutate: unban, variables: unbanningId, isPending: isUnbanning } = useMutation({
    mutationFn: (userId: string) => communityApi.unbanUser(channelId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'community', 'bans'] }),
  })

  const bans = data?.data ?? []

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />}>
      {showSkeleton ? (
        <View className="px-5 py-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} className="gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </View>
          ))}
        </View>
      ) : bans.length === 0 && !isRefetching && data !== undefined ? (
        <EmptyState icon={<Ban size={40} color="#3a3b4f" />} title="No bans" message="No banned users in this channel." />
      ) : (
        bans.map((item) => (
          <BanRow key={item.id} ban={item} onUnban={() => unban(item.id)} unbanning={isUnbanning && unbanningId === item.id} />
        ))
      )}
    </ScrollView>
  )
}

export function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Followers')
  const channelId = useChannelStore((s) => s.currentChannel?.id) ?? ''

  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ['channel', channelId, 'community', 'stats'],
    queryFn: () =>
      apiClient
        .get<{ data: CommunityStats }>(`/v1/channels/${channelId}/community/stats`)
        .then((r) => r.data.data),
    enabled: !!channelId,
  })

  const TABS: Tab[] = ['Followers', 'Subscribers', 'VIPs', 'Moderators', 'Bans']

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Community" subtitle="Followers, subscribers, VIPs, and moderators" />

        {/* Stat cards */}
        <View className="flex-row flex-wrap gap-3 px-5 py-3">
          <StatCard label="Followers" value={stats?.followers ?? 0} color="#3b82f6" icon={<Users size={14} color="#60a5fa" />} />
          <StatCard label="Subscribers" value={stats?.subscribers ?? 0} color="#a78bfa" icon={<Star size={14} color="#a78bfa" />} />
          <StatCard label="VIPs" value={stats?.vips ?? 0} color="#f59e0b" icon={<Crown size={14} color="#fbbf24" />} />
          <StatCard label="Moderators" value={stats?.moderators ?? 0} color="#22c55e" icon={<Shield size={14} color="#4ade80" />} />
        </View>

        {/* Tab + search bar */}
        <View
          className="px-5 py-2 gap-3"
          style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {TABS.map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: activeTab === tab ? 'rgba(124,58,237,0.25)' : '#16171f',
                    borderWidth: 1,
                    borderColor: activeTab === tab ? '#7C3AED' : '#2a2b3a',
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: activeTab === tab ? '#a78bfa' : '#5a5b72' }}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {activeTab === 'Bans' ? (
          <BansTab channelId={channelId} />
        ) : (
          <UsersTab channelId={channelId} role={TAB_ROLE_MAP[activeTab]} />
        )}
      </View>
    </ErrorBoundary>
  )
}
