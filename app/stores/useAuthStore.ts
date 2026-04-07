import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { appStorage } from '@/lib/storage'
import { apiClient, setAuthToken } from '@/lib/api/client'
import { setSignalRTokenGetter, destroyAllConnections } from '@/lib/signalr/connection'
import { API_BASE_URL } from '@/lib/utils/apiUrl'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { Platform } from 'react-native'
import type { User } from '@/types/auth'

WebBrowser.maybeCompleteAuthSession()

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshTokenValue: string | null
  expiresAt: number | null
  isLoading: boolean
  isRefreshing: boolean
  isAuthenticated: boolean
  onboardingComplete: boolean
  grantedScopes: string[]
  pendingScopeUpgrade: string[] | null
  /** True once the persist middleware has finished reading from storage.
   *  Always false on first synchronous render — use this to avoid redirecting
   *  to login before persisted auth state has been restored. */
  _hasHydrated: boolean
  setHasHydrated: (value: boolean) => void

  init: () => Promise<void>
  login: () => Promise<void>
  logout: () => Promise<void>
  handleCallback: (params: {
    access_token?: string
    refresh_token?: string
    expires_in?: string
    code?: string
    state?: string
    token?: string
    scopes?: string
  }) => Promise<boolean>
  completeOnboarding: () => void
  setAuth: (data: { user: User; accessToken: string; refreshToken: string; expiresIn: number; scopes?: string[] }) => void
  refreshToken: () => Promise<void>
  setLoading: (loading: boolean) => void
  requestScopeUpgrade: (scopes: string[]) => Promise<void>
  dismissScopeUpgrade: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      init: async () => {
        const { accessToken, expiresAt } = get()
        if (!accessToken) return

        // Register token for API calls and SignalR
        setAuthToken(accessToken)
        setSignalRTokenGetter(() => useAuthStore.getState().accessToken ?? '')

        // Proactively refresh if expiring within 5 minutes
        if (expiresAt && Date.now() > expiresAt - 5 * 60 * 1000) {
          await get().refreshToken()
        }

        // Validate token with server — if DB was wiped, token is invalid
        try {
          await apiClient.get('/v1/auth/me')
        } catch {
          // Token is invalid — clear session
          get().logout()
        }
      },

      login: async () => {
        if (Platform.OS === 'web') {
          const webCallback = `${window.location.origin}/callback`
          window.location.href = `${API_BASE_URL}/api/v1/auth/twitch?redirect_uri=${encodeURIComponent(webCallback)}`
          return
        }

        // Native: open the backend's OAuth endpoint in a Chrome Custom Tab.
        // Twitch requires HTTPS redirect URIs — custom schemes aren't allowed — so the
        // flow goes:  App → Backend → Twitch → Backend (HTTPS) → nomercybot://callback
        //
        // For Android development, EXPO_PUBLIC_API_URL must point to a tunnel (ngrok,
        // cloudflare) or the machine's LAN IP so the Chrome Custom Tab can reach the
        // backend. The emulator auto-rewrite (localhost → 10.0.2.2) handles the app's
        // own API calls, but Twitch redirects to the backend's configured RedirectUri
        // which also must be reachable from the browser.
        const redirectUri = makeRedirectUri({ scheme: 'nomercybot', path: 'callback' })
        const authUrl = `${API_BASE_URL}/api/v1/auth/twitch?redirect_uri=${encodeURIComponent(redirectUri)}`
        await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)
        // Backend processes OAuth, then redirects to nomercybot://callback?access_token=...
      },

      handleCallback: async ({ access_token, refresh_token, expires_in, code, state: oauthState, token, scopes }) => {
        set({ isLoading: true })
        try {
          // Reset stale channel data from previous sessions
          const { useChannelStore } = await import('@/stores/useChannelStore')
          useChannelStore.getState().reset()

          // Fresh login always starts onboarding
          set({ onboardingComplete: false })

          // Primary path: backend redirected with tokens in the deep-link URL
          if (access_token && refresh_token) {
            const expiresIn = parseInt(expires_in ?? '3600', 10)

            // Store tokens first so the /me call is authenticated
            setAuthToken(access_token)
            setSignalRTokenGetter(() => useAuthStore.getState().accessToken ?? '')

            // Fetch user profile
            const meRes = await apiClient.get<{ data: User }>('/v1/auth/me')

            get().setAuth({
              user: meRes.data.data,
              accessToken: access_token,
              refreshToken: refresh_token,
              expiresIn,
              scopes: scopes ? scopes.split(' ') : [],
            })
            return true
          }

          // Code flow: exchange authorization code for tokens via backend POST
          if (code) {
            const redirectUri = makeRedirectUri({ scheme: 'nomercybot', path: 'callback' })
            const res = await apiClient.post<{
              data: { accessToken: string; refreshToken: string; expiresIn: number; user: User }
            }>('/v1/auth/twitch/callback', { code, state: oauthState, redirectUri })

            const { accessToken, refreshToken, expiresIn, user } = res.data.data
            get().setAuth({
              user,
              accessToken,
              refreshToken,
              expiresIn,
              scopes: scopes ? scopes.split(' ') : [],
            })
            return true
          }

          return false
        } catch {
          return false
        } finally {
          set({ isLoading: false })
        }
      },

      completeOnboarding: () => set({ onboardingComplete: true }),

      setAuth: ({ user, accessToken, refreshToken, expiresIn, scopes }) => {
        set({
          user,
          accessToken,
          refreshTokenValue: refreshToken,
          expiresAt: Date.now() + expiresIn * 1000,
          isAuthenticated: true,
          grantedScopes: scopes ?? get().grantedScopes,
          pendingScopeUpgrade: null,
        })
        setAuthToken(accessToken)
        setSignalRTokenGetter(() => useAuthStore.getState().accessToken ?? '')
      },

      refreshToken: async () => {
        const { refreshTokenValue } = get()
        if (!refreshTokenValue) return

        set({ isRefreshing: true })
        try {
          const res = await apiClient.post<{
            data: { accessToken: string; refreshToken: string; expiresIn: number }
          }>('/v1/auth/refresh', { refreshToken: refreshTokenValue })

          set({
            accessToken: res.data.data.accessToken,
            refreshTokenValue: res.data.data.refreshToken,
            expiresAt: Date.now() + res.data.data.expiresIn * 1000,
          })
          setAuthToken(res.data.data.accessToken)
        } catch {
          await get().logout()
        } finally {
          set({ isRefreshing: false })
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/v1/auth/logout')
        } catch {
          // Best-effort — clear local state regardless
        }
        setAuthToken(null)
        await destroyAllConnections()
        set({
          user: null,
          accessToken: null,
          refreshTokenValue: null,
          expiresAt: null,
          isAuthenticated: false,
          grantedScopes: [],
          pendingScopeUpgrade: null,
        })
      },

      setLoading: (loading) => set({ isLoading: loading }),

      requestScopeUpgrade: async (scopes: string[]) => {
        const { grantedScopes } = get()
        const missing = scopes.filter((s) => !grantedScopes.includes(s))
        if (missing.length === 0) return
        set({ pendingScopeUpgrade: missing })
      },

      dismissScopeUpgrade: () => set({ pendingScopeUpgrade: null }),
    }),
    {
      name: 'nomercybot-auth',
      storage: createJSONStorage(() => appStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshTokenValue: state.refreshTokenValue,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
        onboardingComplete: state.onboardingComplete,
        grantedScopes: state.grantedScopes,
        // _hasHydrated intentionally excluded — it resets to false on every cold start
      }),
      // Use the state-method pattern (zustand recommended) to avoid potential
      // circular-reference issues with useAuthStore.setState during module init.
      // Always set _hasHydrated=true — even on error — so the app never gets
      // stuck on a blank screen due to a failed storage read.
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
