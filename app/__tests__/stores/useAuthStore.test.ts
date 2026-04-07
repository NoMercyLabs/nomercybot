import { useAuthStore } from '@/stores/useAuthStore'
import type { User } from '@/types/auth'

jest.mock('@/lib/storage', () => ({
  appStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('@/lib/api/client', () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
  setAuthToken: jest.fn(),
}))

jest.mock('@/lib/signalr/connection', () => ({
  setSignalRTokenGetter: jest.fn(),
  destroyAllConnections: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'success' }),
}))

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'nomercybot://callback'),
}))

const { apiClient } = require('@/lib/api/client')
const { setAuthToken } = require('@/lib/api/client')
const { destroyAllConnections } = require('@/lib/signalr/connection')

const mockUser: User = {
  id: 'twitch-1',
  username: 'testuser',
  displayName: 'TestUser',
  profileImageUrl: 'https://example.com/avatar.png',
  color: '#9146FF',
  broadcasterType: '',
  createdAt: '2024-01-01T00:00:00Z',
  isAdmin: false,
}

const resetState = () => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshTokenValue: null,
    expiresAt: null,
    isLoading: false,
    isRefreshing: false,
    isAuthenticated: false,
    onboardingComplete: false,
    grantedScopes: [],
    pendingScopeUpgrade: null,
  })
}

beforeEach(() => {
  resetState()
  jest.clearAllMocks()
})

describe('useAuthStore', () => {
  describe('initial state', () => {
    it('starts unauthenticated', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('has no user', () => {
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('has no tokens', () => {
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(useAuthStore.getState().refreshTokenValue).toBeNull()
    })
  })

  describe('setAuth', () => {
    it('sets user, tokens, and isAuthenticated on login', () => {
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresIn: 3600,
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe('access-123')
      expect(state.refreshTokenValue).toBe('refresh-456')
    })

    it('sets expiresAt to now + expiresIn seconds', () => {
      const before = Date.now()
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresIn: 3600,
      })
      const after = Date.now()
      const { expiresAt } = useAuthStore.getState()
      expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000)
      expect(expiresAt).toBeLessThanOrEqual(after + 3600 * 1000)
    })

    it('calls setAuthToken with the new access token', () => {
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'my-token',
        refreshToken: 'ref',
        expiresIn: 3600,
      })
      expect(setAuthToken).toHaveBeenCalledWith('my-token')
    })

    it('stores provided scopes', () => {
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresIn: 3600,
        scopes: ['chat:read', 'channel:manage:broadcast'],
      })
      expect(useAuthStore.getState().grantedScopes).toEqual([
        'chat:read',
        'channel:manage:broadcast',
      ])
    })

    it('clears pendingScopeUpgrade after setAuth', () => {
      useAuthStore.setState({ pendingScopeUpgrade: ['missing:scope'] })
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresIn: 3600,
      })
      expect(useAuthStore.getState().pendingScopeUpgrade).toBeNull()
    })
  })

  describe('logout', () => {
    it('clears all auth state', async () => {
      useAuthStore.getState().setAuth({
        user: mockUser,
        accessToken: 'tok',
        refreshToken: 'ref',
        expiresIn: 3600,
      })
      await useAuthStore.getState().logout()
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.refreshTokenValue).toBeNull()
    })

    it('calls setAuthToken(null) on logout', async () => {
      await useAuthStore.getState().logout()
      expect(setAuthToken).toHaveBeenCalledWith(null)
    })

    it('calls destroyAllConnections on logout', async () => {
      await useAuthStore.getState().logout()
      expect(destroyAllConnections).toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('does nothing when no refresh token exists', async () => {
      await useAuthStore.getState().refreshToken()
      expect(apiClient.post).not.toHaveBeenCalled()
    })

    it('updates tokens on successful refresh', async () => {
      useAuthStore.setState({ refreshTokenValue: 'old-refresh' })
      apiClient.post.mockResolvedValueOnce({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          expiresIn: 3600,
        },
      })

      await useAuthStore.getState().refreshToken()

      expect(useAuthStore.getState().accessToken).toBe('new-access')
      expect(useAuthStore.getState().refreshTokenValue).toBe('new-refresh')
    })

    it('sets isRefreshing to true then false', async () => {
      useAuthStore.setState({ refreshTokenValue: 'refresh' })
      apiClient.post.mockResolvedValueOnce({
        data: { accessToken: 'tok', refreshToken: 'ref', expiresIn: 3600 },
      })

      const promise = useAuthStore.getState().refreshToken()
      expect(useAuthStore.getState().isRefreshing).toBe(true)
      await promise
      expect(useAuthStore.getState().isRefreshing).toBe(false)
    })

    it('logs out when refresh fails', async () => {
      useAuthStore.setState({ refreshTokenValue: 'expired-refresh' })
      apiClient.post.mockRejectedValueOnce(new Error('Invalid refresh token'))

      await useAuthStore.getState().refreshToken()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('requestScopeUpgrade', () => {
    it('sets pendingScopeUpgrade to missing scopes', async () => {
      useAuthStore.setState({ grantedScopes: ['chat:read'] })
      await useAuthStore.getState().requestScopeUpgrade(['chat:read', 'channel:manage:broadcast'])
      expect(useAuthStore.getState().pendingScopeUpgrade).toEqual(['channel:manage:broadcast'])
    })

    it('does nothing when all scopes already granted', async () => {
      useAuthStore.setState({ grantedScopes: ['chat:read', 'channel:manage:broadcast'] })
      await useAuthStore.getState().requestScopeUpgrade(['chat:read'])
      expect(useAuthStore.getState().pendingScopeUpgrade).toBeNull()
    })
  })

  describe('dismissScopeUpgrade', () => {
    it('clears pendingScopeUpgrade', () => {
      useAuthStore.setState({ pendingScopeUpgrade: ['some:scope'] })
      useAuthStore.getState().dismissScopeUpgrade()
      expect(useAuthStore.getState().pendingScopeUpgrade).toBeNull()
    })
  })

  describe('completeOnboarding', () => {
    it('sets onboardingComplete to true', () => {
      useAuthStore.getState().completeOnboarding()
      expect(useAuthStore.getState().onboardingComplete).toBe(true)
    })
  })

  describe('setLoading', () => {
    it('sets isLoading flag', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('handleCallback', () => {
    it('returns false when neither code nor token provided', async () => {
      const result = await useAuthStore.getState().handleCallback({})
      expect(result).toBe(false)
    })

    it('calls /auth/exchange when token provided', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresIn: 3600,
          scopes: ['chat:read'],
        },
      })
      const result = await useAuthStore.getState().handleCallback({ token: 'oauth-token' })
      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith('/auth/exchange', { token: 'oauth-token' })
    })

    it('calls /auth/twitch/callback when code provided', async () => {
      apiClient.post.mockResolvedValueOnce({
        data: {
          user: mockUser,
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresIn: 3600,
        },
      })
      const result = await useAuthStore.getState().handleCallback({
        code: 'auth-code',
        state: 'csrf-state',
      })
      expect(result).toBe(true)
      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/twitch/callback',
        expect.objectContaining({ code: 'auth-code', state: 'csrf-state' }),
      )
    })

    it('returns false and clears loading on API error', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('API error'))
      const result = await useAuthStore.getState().handleCallback({ token: 'bad-token' })
      expect(result).toBe(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
