import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/useAuthStore'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CallbackScreen() {
  const router = useRouter()
  const { t } = useTranslation('common')
  // Expo Router can return string | string[] for any param on web; we always
  // want the first string value, so the merging logic below handles both cases.
  const queryParams = useLocalSearchParams<{
    access_token?: string | string[]
    refresh_token?: string | string[]
    expires_in?: string | string[]
    code?: string | string[]
    /** Renamed from `state` in app/callback.tsx to avoid colliding with React Navigation's reserved `state` param */
    oauth_state?: string | string[]
    token?: string | string[]
    scope?: string | string[]
    error?: string | string[]
    error_description?: string | string[]
  }>()

  const handleCallback = useAuthStore((s) => s.handleCallback)
  // NOTE: do NOT subscribe to onboardingComplete here — handleCallback mutates it
  // mid-execution, which would re-trigger the effect and cause a double-run /
  // browser crash. Read it from the store after the async call instead.

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    // Guard against React Strict Mode double-invoke in dev
    if (hasRun.current) return
    hasRun.current = true

    // Merge query params with URL hash params — some OAuth providers (and our
    // backend in certain redirect modes) put tokens in the fragment.
    const merged: Record<string, string> = {}
    for (const [k, v] of Object.entries(queryParams)) {
      if (typeof v === 'string') merged[k] = v
      else if (Array.isArray(v) && v.length > 0) merged[k] = v[0]
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
      const hashStr = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash
      new URLSearchParams(hashStr).forEach((value, key) => {
        if (value && !merged[key]) merged[key] = value
      })
    }

    async function processCallback() {
      if (merged.error) {
        const desc = merged.error_description
          ? decodeURIComponent(merged.error_description.replace(/\+/g, ' '))
          : merged.error
        setErrorMessage(desc)
        return
      }

      if (!merged.access_token && !merged.token && !merged.code) {
        setErrorMessage('No authentication data received.')
        return
      }

      const success = await handleCallback({
        access_token: merged.access_token,
        refresh_token: merged.refresh_token,
        expires_in: merged.expires_in,
        token: merged.token,
        code: merged.code,
        state: merged.oauth_state ?? merged.state,
        scopes: merged.scope,
      })

      if (success) {
        // Read fresh state — handleCallback sets onboardingComplete: false during
        // execution; the closed-over React state value would be stale here.
        const { onboardingComplete } = useAuthStore.getState()
        if (onboardingComplete) {
          router.replace('/(dashboard)')
        } else {
          router.replace('/(auth)/onboarding')
        }
      } else {
        setErrorMessage('Login failed — please try again.')
      }
    }

    processCallback().catch(() => {
      setErrorMessage('Authentication failed. Please try again.')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount — URL params are stable; store fn refs don't change

  if (errorMessage) {
    return (
      <View className="flex-1 items-center justify-center px-6 gap-6" style={{ backgroundColor: '#0a0b0f' }}>
        <View className="w-full max-w-sm items-center gap-4">
          <Text className="text-2xl font-bold" style={{ color: '#f4f5fa' }}>Login failed</Text>
          <View
            className="w-full rounded-xl px-4 py-3"
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <Text className="text-sm text-center" style={{ color: '#f87171' }}>{errorMessage}</Text>
          </View>
          <Pressable
            onPress={() => {
              hasRun.current = false
              router.replace('/(auth)/login')
            }}
            className="w-full rounded-xl py-4 items-center active:opacity-80"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Text className="font-semibold text-white">Try again</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 items-center justify-center gap-6" style={{ backgroundColor: '#0a0b0f' }}>
      <View className="gap-3 items-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-40 rounded-lg" />
      </View>
      <Text className="text-sm" style={{ color: '#8889a0' }}>{t('auth.signingIn', 'Signing you in...')}</Text>
    </View>
  )
}
