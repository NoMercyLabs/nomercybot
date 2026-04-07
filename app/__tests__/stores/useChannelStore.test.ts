import { useChannelStore } from '@/stores/useChannelStore'
import type { Channel } from '@/types/channel'

jest.mock('@/lib/storage', () => ({
  appStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const { apiClient } = require('@/lib/api/client')

const mockChannel: Channel = {
  id: 'ch-1',
  broadcasterId: 'b-1',
  twitchId: 'twitch-1',
  displayName: 'StreamerOne',
  login: 'streamerone',
  isLive: false,
  profileImageUrl: 'https://example.com/img.png',
  viewerCount: 0,
  overlayToken: 'tok-1',
  botEnabled: true,
  createdAt: '2024-01-01T00:00:00Z',
}

const mockChannel2: Channel = {
  id: 'ch-2',
  broadcasterId: 'b-2',
  twitchId: 'twitch-2',
  displayName: 'StreamerTwo',
  login: 'streamertwo',
  isLive: true,
  profileImageUrl: 'https://example.com/img2.png',
  viewerCount: 500,
  overlayToken: 'tok-2',
  botEnabled: true,
  createdAt: '2024-01-02T00:00:00Z',
}

beforeEach(() => {
  useChannelStore.setState({
    currentChannel: null,
    channels: [],
    loading: false,
    error: null,
  })
  jest.clearAllMocks()
})

describe('useChannelStore', () => {
  describe('computed getters', () => {
    it('channelId returns null when no channel selected', () => {
      expect(useChannelStore.getState().channelId()).toBeNull()
    })

    it('channelId returns channel id when a channel is selected', () => {
      useChannelStore.setState({ currentChannel: mockChannel })
      expect(useChannelStore.getState().channelId()).toBe('ch-1')
    })

    it('channelName returns empty string when no channel selected', () => {
      expect(useChannelStore.getState().channelName()).toBe('')
    })

    it('channelName returns displayName of current channel', () => {
      useChannelStore.setState({ currentChannel: mockChannel })
      expect(useChannelStore.getState().channelName()).toBe('StreamerOne')
    })

    it('isLive returns false when no channel selected', () => {
      expect(useChannelStore.getState().isLive()).toBe(false)
    })

    it('isLive returns channel live status', () => {
      useChannelStore.setState({ currentChannel: mockChannel2 })
      expect(useChannelStore.getState().isLive()).toBe(true)
    })
  })

  describe('fetchChannels', () => {
    it('sets loading true then false on success', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [mockChannel] })
      const fetchPromise = useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().loading).toBe(true)
      await fetchPromise
      expect(useChannelStore.getState().loading).toBe(false)
    })

    it('populates channels list on success', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [mockChannel, mockChannel2] })
      await useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().channels).toHaveLength(2)
    })

    it('auto-selects first channel when none is selected', async () => {
      apiClient.get.mockResolvedValueOnce({ data: [mockChannel, mockChannel2] })
      await useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().currentChannel?.id).toBe('ch-1')
    })

    it('does not replace an already-selected channel', async () => {
      useChannelStore.setState({ currentChannel: mockChannel2 })
      apiClient.get.mockResolvedValueOnce({ data: [mockChannel, mockChannel2] })
      await useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().currentChannel?.id).toBe('ch-2')
    })

    it('sets error on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('Network error'))
      await useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().error).toBe('Network error')
    })

    it('sets loading false even on failure', async () => {
      apiClient.get.mockRejectedValueOnce(new Error('fail'))
      await useChannelStore.getState().fetchChannels()
      expect(useChannelStore.getState().loading).toBe(false)
    })
  })

  describe('selectChannel', () => {
    it('fetches and sets the selected channel', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockChannel2 })
      await useChannelStore.getState().selectChannel('ch-2')
      expect(useChannelStore.getState().currentChannel?.id).toBe('ch-2')
    })

    it('sets loading during fetch', async () => {
      apiClient.get.mockResolvedValueOnce({ data: mockChannel })
      const promise = useChannelStore.getState().selectChannel('ch-1')
      expect(useChannelStore.getState().loading).toBe(true)
      await promise
      expect(useChannelStore.getState().loading).toBe(false)
    })
  })

  describe('updateFromRealtime', () => {
    it('patches the current channel with provided fields', () => {
      useChannelStore.setState({ currentChannel: mockChannel })
      useChannelStore.getState().updateFromRealtime({ isLive: true })
      expect(useChannelStore.getState().currentChannel?.isLive).toBe(true)
    })

    it('preserves unpatched fields', () => {
      useChannelStore.setState({ currentChannel: mockChannel })
      useChannelStore.getState().updateFromRealtime({ isLive: true })
      expect(useChannelStore.getState().currentChannel?.displayName).toBe('StreamerOne')
    })

    it('does nothing when no channel is selected', () => {
      useChannelStore.getState().updateFromRealtime({ isLive: true })
      expect(useChannelStore.getState().currentChannel).toBeNull()
    })
  })

  describe('reset', () => {
    it('clears all channel state', () => {
      useChannelStore.setState({
        currentChannel: mockChannel,
        channels: [mockChannel, mockChannel2],
        loading: true,
        error: 'some error',
      })
      useChannelStore.getState().reset()
      const state = useChannelStore.getState()
      expect(state.currentChannel).toBeNull()
      expect(state.channels).toHaveLength(0)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
