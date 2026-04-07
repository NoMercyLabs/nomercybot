import { View, Text, ScrollView, TextInput, RefreshControl } from 'react-native'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Search, Users } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface AdminUser {
  id: string
  displayName: string
  login: string
  email: string | null
  role: 'user' | 'moderator' | 'admin'
  channelCount: number
  createdAt: string
  lastActive: string | null
}

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('')

  const { data: users, isLoading, isRefetching, refetch } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AdminUser[] }>('/v1/admin/users')
      return res.data.data
    },
  })

  const filtered = users?.filter((u) =>
    !search || u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.login.toLowerCase().includes(search.toLowerCase()),
  ) ?? []

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <PageHeader
          title="Users"
          subtitle={!isLoading ? `${users?.length ?? 0} total` : undefined}
        />

        <View className="px-5 pt-4 gap-3">
          {/* Search */}
          <View
            className="flex-row items-center gap-2.5 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
          >
            <Search size={14} color="#5a5b72" />
            <TextInput
              className="flex-1 text-sm text-white"
              placeholder="Search by name or username…"
              placeholderTextColor="#3a3b4f"
              value={search}
              onChangeText={setSearch}
              style={{ outlineStyle: 'none' } as any}
            />
          </View>

          {isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </View>
          ) : !filtered.length ? (
            <EmptyState
              icon={<Users size={40} color="#3a3b4f" />}
              title={search ? 'No users match your search' : 'No users found'}
            />
          ) : (
            filtered.map((user, i) => (
              <View
                key={user.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <Text className="text-sm font-semibold text-white">{user.displayName}</Text>
                      {user.role !== 'user' && (
                        <Badge
                          variant={user.role === 'admin' ? 'warning' : 'info'}
                          label={user.role}
                        />
                      )}
                    </View>
                    <Text className="text-xs" style={{ color: '#5a5b72' }}>@{user.login}</Text>
                    {user.email && <Text className="text-xs" style={{ color: '#3a3b4f' }}>{user.email}</Text>}
                    <View className="flex-row items-center gap-3 mt-0.5">
                      <Text className="text-xs" style={{ color: '#3a3b4f' }}>
                        {user.channelCount} channel{user.channelCount !== 1 ? 's' : ''}
                      </Text>
                      <Text className="text-xs" style={{ color: '#3a3b4f' }}>
                        Joined {formatDate(user.createdAt)}
                      </Text>
                    </View>
                  </View>
                  {user.lastActive && (
                    <Text className="text-xs shrink-0" style={{ color: '#3a3b4f' }}>
                      {formatDate(user.lastActive)}
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ErrorBoundary>
  )
}
