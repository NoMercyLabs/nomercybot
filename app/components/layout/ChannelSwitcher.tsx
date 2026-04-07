import { View, Text, Pressable, Modal, FlatList } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useChannel } from '@/hooks/useChannel'
import { useChannelStore } from '@/stores/useChannelStore'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ChevronDown, X, Check, Plus } from 'lucide-react-native'
import type { Channel } from '@/types/channel'

function ChannelRow({
  channel,
  isSelected,
  onSelect,
}: {
  channel: Channel
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Pressable
      onPress={onSelect}
      className="flex-row items-center gap-3 px-4 py-3"
      style={isSelected ? { backgroundColor: 'rgba(124,58,237,0.15)' } : undefined}
    >
      <Avatar
        src={channel.profileImageUrl ?? undefined}
        name={channel.displayName}
        size="md"
      />
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>{channel.displayName}</Text>
          {channel.isLive && (
            <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
          )}
        </View>
        <Text className="text-xs" style={{ color: '#6b7280' }}>@{channel.login}</Text>
        {channel.isLive && channel.gameName && (
          <Text className="text-xs" style={{ color: '#5a5b72' }}>{channel.gameName}</Text>
        )}
      </View>
      <View className="items-end gap-1">
        {channel.isLive && (
          <Badge variant="danger" label="LIVE" />
        )}
        {channel.isOnboarded === false && (
          <Badge variant="muted" label="Not added" />
        )}
        {channel.botEnabled === false && channel.isOnboarded !== false && (
          <Badge variant="muted" label="Bot Off" />
        )}
        {isSelected && channel.isOnboarded !== false && <Check size={16} color="#a78bfa" />}
        {channel.isOnboarded === false && <Plus size={14} color="#5a5b72" />}
      </View>
    </Pressable>
  )
}

export function ChannelSwitcher() {
  const { currentChannel, channels, selectChannel, fetchChannels } = useChannel()
  const loading = useChannelStore((s) => s.loading)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open && channels.length === 0) {
      fetchChannels()
    }
  }, [open, channels.length, fetchChannels])

  async function handleSelect(channel: Channel) {
    setOpen(false)
    if (channel.isOnboarded === false) {
      router.push(`/(auth)/onboarding?channelId=${channel.id}` as any)
      return
    }
    if (channel.id !== currentChannel?.id) {
      await selectChannel(channel.login)
    }
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-lg px-3 py-1.5"
      >
        <Avatar
          src={currentChannel?.profileImageUrl ?? undefined}
          name={currentChannel?.displayName}
          size="sm"
        />
        <View className="gap-0.5">
          <Text className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>
            {currentChannel?.displayName ?? 'Select channel'}
          </Text>
          {currentChannel?.isLive && (
            <View className="flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <Text className="text-xs text-red-400">
                {(currentChannel.viewerCount ?? 0) > 0 ? `${currentChannel.viewerCount} viewers` : 'LIVE'}
              </Text>
            </View>
          )}
        </View>
        <ChevronDown size={14} color="#9ca3af" />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setOpen(false)}
        >
          <View
            className="absolute left-4 top-16 w-72 rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#16171f',
              borderWidth: 1,
              borderColor: '#2a2b3a',
            }}
          >
            {/* Header */}
            <View
              className="flex-row items-center justify-between px-4 py-3"
              style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
            >
              <Text className="text-sm font-semibold" style={{ color: '#f4f5fa' }}>Switch Channel</Text>
              <Pressable onPress={() => setOpen(false)} className="p-1">
                <X size={16} color="#8889a0" />
              </Pressable>
            </View>

            {/* Channel list */}
            {loading ? (
              <View className="p-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </View>
            ) : channels.length === 0 ? (
              <View className="items-center py-8">
                <Text className="text-sm" style={{ color: '#6b7280' }}>No channels found</Text>
              </View>
            ) : (
              <FlatList
                data={channels}
                keyExtractor={(c) => c.id}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => (
                  <ChannelRow
                    channel={item}
                    isSelected={item.id === currentChannel?.id}
                    onSelect={() => handleSelect(item)}
                  />
                )}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: '#2a2b3a', marginHorizontal: 16 }} />
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  )
}
