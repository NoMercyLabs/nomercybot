import {
  View, Text, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from 'react-native'
import { useState, useRef, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { useChannelStore } from '@/stores/useChannelStore'
import { useSignalR } from '@/hooks/useSignalR'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { apiClient } from '@/lib/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Send, X, Ban, Clock, Trash2, ChevronDown,
  Users, MessageSquare, Shield, Settings, Smile, Bot,
} from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ChatMessage } from '../components/ChatMessage'
import { fetchChatMessages } from '../api'
import type { ChatMessagePayload } from '@/types/signalr'

type ChatMsg = ChatMessagePayload & { _key: string; isDeleted?: boolean }
type ChatFilter = 'emote' | 'sub' | 'slow'

interface UserPanelProps {
  msg: ChatMsg | null
  onClose: () => void
  channelId: string
}

function UserPanel({ msg, onClose, channelId }: UserPanelProps) {
  const [timeoutDuration, setTimeoutDuration] = useState('600')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  async function doAction(action: 'ban' | 'timeout' | 'delete') {
    if (!msg) return
    setLoading(action)
    try {
      if (action === 'delete') {
        await apiClient.delete(`/v1/channels/${channelId}/chat/messages/${msg.id}`, { data: { reason } })
      } else if (action === 'ban') {
        await apiClient.post(`/v1/channels/${channelId}/chat/bans`, { userId: msg.userId, reason })
      } else {
        await apiClient.post(`/v1/channels/${channelId}/chat/timeouts`, {
          userId: msg.userId,
          duration: parseInt(timeoutDuration, 10) || 600,
          reason,
        })
      }
      onClose()
    } finally {
      setLoading(null)
    }
  }

  const roleColor: Record<string, string> = {
    broadcaster: '#f59e0b',
    moderator: '#22c55e',
    vip: '#a78bfa',
    subscriber: '#60a5fa',
    viewer: '#8889a0',
  }

  const recentMessages = msg ? [msg.message] : []

  return (
    <View className="h-full" style={{ borderLeftWidth: 1, borderLeftColor: '#2a2b3a' }}>
      {msg ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* User Header */}
          <View
            className="items-center px-4 py-6 gap-3"
            style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
          >
            <View
              className="h-14 w-14 rounded-full items-center justify-center"
              style={{ backgroundColor: '#1e1f2a' }}
            >
              <Text className="text-xl font-bold" style={{ color: '#a78bfa' }}>
                {(msg.displayName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-base font-bold text-white">{msg.displayName}</Text>
              <View
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: `${roleColor[msg.userType ?? 'viewer']}20` }}
              >
                <Text className="text-xs font-medium capitalize"
                  style={{ color: roleColor[msg.userType ?? 'viewer'] }}>
                  {msg.userType ?? 'viewer'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg"
              style={{ backgroundColor: '#1e1f2a' }}
            >
              <X size={14} color="#8889a0" />
            </Pressable>
          </View>

          {/* Stats */}
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
            {[
              { label: 'Follow Age', value: '—' },
              { label: 'Account Age', value: '—' },
              { label: 'Messages', value: '—' },
              { label: 'Watch Time', value: '—' },
              { label: 'Commands Used', value: '—' },
              { label: 'Timeouts', value: '0' },
            ].map((row, i) => (
              <View
                key={row.label}
                className="flex-row items-center justify-between px-4 py-2.5"
                style={i > 0 ? { borderTopWidth: 1, borderTopColor: '#2a2b3a' } : undefined}
              >
                <Text className="text-xs" style={{ color: '#5a5b72' }}>{row.label}</Text>
                <Text className="text-xs font-medium text-white">{row.value}</Text>
              </View>
            ))}
          </View>

          {/* Mod Actions */}
          <View className="px-4 py-3 gap-2.5" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}>
            <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3a3b4f' }}>
              Moderation
            </Text>
            <Input
              placeholder="Reason (optional)"
              value={reason}
              onChangeText={setReason}
            />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Timeout (sec)"
                  value={timeoutDuration}
                  onChangeText={setTimeoutDuration}
                  keyboardType="numeric"
                />
              </View>
              <Button
                variant="secondary"
                size="sm"
                loading={loading === 'timeout'}
                onPress={() => doAction('timeout')}
                leftIcon={<Clock size={13} color="#f59e0b" />}
                label="Timeout"
              />
            </View>
            <Pressable
              onPress={() => doAction('ban')}
              className="flex-row items-center justify-center gap-2 rounded-lg py-2.5"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <Ban size={14} color="#ef4444" />
              <Text className="text-sm font-medium" style={{ color: '#ef4444' }}>
                {loading === 'ban' ? 'Banning...' : 'Ban User'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => doAction('delete')}
              className="flex-row items-center justify-center gap-2 rounded-lg py-2.5"
              style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
            >
              <Trash2 size={14} color="#8889a0" />
              <Text className="text-sm font-medium" style={{ color: '#8889a0' }}>
                {loading === 'delete' ? 'Deleting...' : 'Delete Message'}
              </Text>
            </Pressable>
          </View>

          {/* Recent Messages */}
          <View className="px-4 py-3 gap-2">
            <Text className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#3a3b4f' }}>
              Recent Messages
            </Text>
            <View
              className="rounded-lg p-3"
              style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
            >
              <Text className="text-sm text-white">{msg.message}</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center gap-2 px-4">
          <MessageSquare size={32} color="#2a2b3a" />
          <Text className="text-sm text-center" style={{ color: '#3a3b4f' }}>
            Click a message to view user details
          </Text>
        </View>
      )}
    </View>
  )
}

export function ChatScreen() {
  const { t } = useFeatureTranslation('chat')
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const viewerCount = useChannelStore((s) => s.currentChannel?.viewerCount ?? 0)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [selectedMsg, setSelectedMsg] = useState<ChatMsg | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Set<ChatFilter>>(new Set())
  const [chattersPerMin, setChattersPerMin] = useState(0)
  const listRef = useRef<FlatList>(null)
  const { on, off, connect, invoke, status } = useSignalR()
  const { isDesktop } = useBreakpoint()

  // Fetch recent chat history so the page isn't empty on load
  useEffect(() => {
    if (!channelId) return
    let cancelled = false
    fetchChatMessages(channelId, 50)
      .then((history) => {
        if (cancelled || history.length === 0) return
        setMessages((prev) => {
          // Only seed when we have no messages yet (avoid duplicating on re-render)
          if (prev.length > 0) return prev
          return history.map((m) => ({
            ...m,
            _key: m.id ?? `${m.userId}-${m.timestamp}`,
          }))
        })
      })
      .catch(() => {
        // API may 404 if the endpoint isn't deployed yet — silently degrade
      })
    return () => { cancelled = true }
  }, [channelId])

  useEffect(() => {
    connect()
  }, [connect])

  useEffect(() => {
    if (status !== 'connected' || !channelId) return
    invoke('JoinChannel', channelId).catch(() => {})
    return () => {
      invoke('LeaveChannel', channelId).catch(() => {})
    }
  }, [status, channelId, invoke])

  useEffect(() => {
    on('ChatMessage', (msg) => {
      if (!isPaused) {
        setMessages((prev) => [
          ...prev.slice(-299),
          { ...msg, _key: msg.id ?? `${msg.userId}-${msg.timestamp}` },
        ])
      }
    })
    on('MessageDeleted', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true } : m)),
      )
    })
    on('UserBanned', ({ userId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, isDeleted: true } : m)),
      )
    })
    return () => {
      off('ChatMessage')
      off('MessageDeleted')
      off('UserBanned')
    }
  }, [on, off, isPaused])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || !channelId) return
    setInput('')
    try {
      await invoke('SendChatMessage', channelId, text)
    } catch {}
  }, [input, channelId, invoke])

  const scrollToBottom = () => {
    listRef.current?.scrollToEnd({ animated: true })
    setShowScrollBtn(false)
    setIsPaused(false)
  }

  function toggleFilter(f: ChatFilter) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(f)) next.delete(f)
      else next.add(f)
      return next
    })
  }

  // Track messages per minute
  const messageTimestamps = useRef<number[]>([])
  useEffect(() => {
    if (messages.length === 0) return
    const now = Date.now()
    messageTimestamps.current.push(now)
    // Keep only last 60 seconds
    messageTimestamps.current = messageTimestamps.current.filter(t => now - t < 60_000)
    setChattersPerMin(messageTimestamps.current.length)
  }, [messages])

  const isConnected = status === 'connected'

  const chatPanel = (
    <KeyboardAvoidingView
      className="flex-1 flex-col"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Viewers Bar */}
      <View
        className="flex-row items-center justify-between px-4 py-2"
        style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
      >
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isConnected ? '#22c55e' : '#ef4444' }} />
            <Text className="text-xs font-semibold" style={{ color: isConnected ? '#22c55e' : '#ef4444' }}>
              {isConnected ? 'Live' : 'Offline'}
            </Text>
          </View>
          <Text className="text-xs" style={{ color: '#3a3b4f' }}>·</Text>
          <Text className="text-xs font-medium" style={{ color: '#8889a0' }}>
            {viewerCount.toLocaleString()} viewers
          </Text>
          <Text className="text-xs" style={{ color: '#3a3b4f' }}>·</Text>
          <Text className="text-xs font-medium" style={{ color: '#8889a0' }}>
            {chattersPerMin} chatters/min
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {/* Filter pills */}
          {([
            { key: 'emote' as ChatFilter, label: 'Emote Only' },
            { key: 'sub' as ChatFilter, label: 'Sub Only' },
            { key: 'slow' as ChatFilter, label: 'Slow Mode' },
          ] as const).map(({ key, label }) => {
            const active = activeFilters.has(key)
            return (
              <Pressable
                key={key}
                onPress={() => toggleFilter(key)}
                className="px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: active ? 'rgba(124,58,237,0.25)' : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? '#7C3AED' : '#2a2b3a',
                }}
              >
                <Text className="text-xs" style={{ color: active ? '#a78bfa' : '#5a5b72' }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
          <Pressable onPress={() => router.push('/(dashboard)/chat/settings' as any)}>
            <Settings size={14} color="#5a5b72" />
          </Pressable>
        </View>
      </View>

      {/* Connection status — only when not connected */}
      {status !== 'connected' && (
        <View
          className="flex-row items-center justify-center gap-2 py-1.5"
          style={{
            backgroundColor: status === 'connecting' || status === 'reconnecting'
              ? 'rgba(245,158,11,0.15)'
              : 'rgba(239,68,68,0.15)',
          }}
        >
          <View
            className="w-1.5 h-1.5 rounded-full"
            style={{
              backgroundColor: status === 'connecting' || status === 'reconnecting'
                ? '#f59e0b'
                : '#ef4444',
            }}
          />
          <Text
            className="text-xs"
            style={{
              color: status === 'connecting' || status === 'reconnecting'
                ? '#f59e0b'
                : '#ef4444',
            }}
          >
            {status === 'connecting'
              ? 'Connecting…'
              : status === 'reconnecting'
                ? 'Reconnecting…'
                : 'Disconnected'}
          </Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m._key}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 8 }}
        onScrollBeginDrag={() => setIsPaused(true)}
        onEndReached={() => {
          setShowScrollBtn(false)
          setIsPaused(false)
        }}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-sm" style={{ color: '#3a3b4f' }}>{t('empty') as string}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.isDeleted && setSelectedMsg(item)}
            onLongPress={() => !item.isDeleted && setSelectedMsg(item)}
          >
            <ChatMessage message={item} isDeleted={item.isDeleted} />
          </Pressable>
        )}
      />

      {showScrollBtn && (
        <Pressable
          onPress={scrollToBottom}
          className="absolute bottom-16 right-4 flex-row items-center gap-1 rounded-full px-3 py-1.5"
          style={{ backgroundColor: '#7C3AED' }}
        >
          <ChevronDown size={14} color="white" />
          <Text className="text-xs font-medium text-white">New messages</Text>
        </Pressable>
      )}

      {/* Input bar */}
      <View
        className="px-4 pt-2 pb-3"
        style={{ borderTopWidth: 1, borderTopColor: '#2a2b3a', backgroundColor: '#16171f' }}
      >
        {/* Toolbar buttons */}
        <View className="flex-row gap-1 mb-2">
          <Pressable
            className="w-7 h-7 rounded items-center justify-center"
            style={{ backgroundColor: 'transparent' }}
            accessibilityLabel="Emotes"
          >
            <Smile size={16} color="#5a5b72" />
          </Pressable>
          <Pressable
            className="flex-row items-center gap-1.5 px-2 h-7 rounded"
            style={{ backgroundColor: '#1e1f2a', borderWidth: 1, borderColor: '#2a2b3a' }}
            accessibilityLabel="Chat as Bot"
          >
            <Bot size={13} color="#5a5b72" />
            <Text className="text-xs" style={{ color: '#5a5b72' }}>Chat as Bot</Text>
          </Pressable>
        </View>
        {/* Text input row */}
        <View className="flex-row items-center gap-2.5">
          <TextInput
            className="flex-1 rounded-lg px-3 py-2.5 text-sm text-white"
            style={{
              backgroundColor: '#1e1f2a',
              borderWidth: 1,
              borderColor: '#2a2b3a',
              outlineStyle: 'none',
            } as any}
            placeholder={t('placeholder') as string}
            placeholderTextColor="#3a3b4f"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            className="rounded-lg p-2.5 items-center justify-center"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Send size={16} color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title={t('title') as string}
          subtitle="Live chat view"
        />

        {isDesktop ? (
          // Desktop: 2-panel layout
          <View className="flex-1 flex-row">
            {/* Chat panel */}
            <View className="flex-1 flex-col">
              {chatPanel}
            </View>
            {/* User panel */}
            <View style={{ width: 320, backgroundColor: '#111218' }}>
              <UserPanel
                msg={selectedMsg}
                onClose={() => setSelectedMsg(null)}
                channelId={channelId ?? ''}
              />
            </View>
          </View>
        ) : (
          // Mobile: chat only, modal for user card
          <>
            {chatPanel}
            <Modal
              visible={!!selectedMsg}
              transparent
              animationType="fade"
              onRequestClose={() => setSelectedMsg(null)}
            >
              <Pressable
                className="flex-1 items-center justify-center px-4"
                style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                onPress={() => setSelectedMsg(null)}
              >
                <Pressable
                  onPress={(e) => e.stopPropagation()}
                  className="w-full rounded-2xl overflow-hidden"
                  style={{ maxWidth: 360, backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  {selectedMsg && (
                    <UserPanel
                      msg={selectedMsg}
                      onClose={() => setSelectedMsg(null)}
                      channelId={channelId ?? ''}
                    />
                  )}
                </Pressable>
              </Pressable>
            </Modal>
          </>
        )}
      </View>
    </ErrorBoundary>
  )
}
