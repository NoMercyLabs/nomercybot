import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { appStorage } from '@/lib/storage'
import { apiClient } from '@/lib/api/client'
import type { Channel } from '@/types/channel'

interface ChannelState {
  currentChannel: Channel | null
  channels: Channel[]
  loading: boolean
  error: string | null
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void

  channelId: () => string | null
  channelName: () => string
  isLive: () => boolean

  fetchChannels: () => Promise<void>
  selectChannel: (idOrLogin: string) => Promise<void>
  updateFromRealtime: (patch: Partial<Channel>) => void
  reset: () => void
}

export const useChannelStore = create<ChannelState>()(
  persist(
    (set, get) => ({
      currentChannel: null,
      channels: [],
      loading: false,
      error: null,
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      channelId: () => get().currentChannel?.id ?? null,
      channelName: () => get().currentChannel?.displayName ?? '',
      isLive: () => get().currentChannel?.isLive ?? false,

      fetchChannels: async () => {
        set({ loading: true, error: null })
        try {
          const [ownedRes, moderatedRes] = await Promise.allSettled([
            apiClient.get<{ data: Channel[] }>('/v1/channels'),
            apiClient.get<{ data: { id: string; login: string; displayName: string; isOnboarded: boolean }[] }>('/v1/channels/moderated'),
          ])

          const owned: Channel[] = ownedRes.status === 'fulfilled' ? (ownedRes.value.data.data ?? []) : []

          const ownedIds = new Set(owned.map(c => c.id))

          // Include moderated channels not already in the owned list
          const moderated: Channel[] = moderatedRes.status === 'fulfilled'
            ? (moderatedRes.value.data.data ?? [])
                .filter(m => !ownedIds.has(m.id))
                .map(m => ({
                  id: m.id,
                  login: m.login,
                  displayName: m.displayName,
                  isLive: false,
                  role: 'moderator',
                  isOnboarded: m.isOnboarded,
                }))
            : []

          const channels = [...owned, ...moderated]
          set({ channels })
          const { currentChannel } = get()
          if (!currentChannel && channels.length > 0) {
            set({ currentChannel: channels[0] })
          }
        } catch (e) {
          set({ error: (e as Error).message })
        } finally {
          set({ loading: false })
        }
      },

      selectChannel: async (idOrLogin: string) => {
        set({ loading: true })
        try {
          const res = await apiClient.get<{ data: Channel }>(`/v1/channels/${idOrLogin}`)
          set({ currentChannel: res.data.data })
        } finally {
          set({ loading: false })
        }
      },

      updateFromRealtime: (patch) => {
        const { currentChannel } = get()
        if (currentChannel) {
          set({ currentChannel: { ...currentChannel, ...patch } })
        }
      },

      reset: () => set({ currentChannel: null, channels: [], loading: false, error: null }),
    }),
    {
      name: 'nomercybot-channel',
      storage: createJSONStorage(() => appStorage),
      partialize: (state: ChannelState) => ({
        currentChannel: state.currentChannel,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
