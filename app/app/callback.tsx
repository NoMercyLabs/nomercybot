/**
 * Shallow redirect to handle flat deep-link URLs.
 *
 * When Twitch (or the backend) redirects to the web origin /callback or to the
 * native deep-link nomercybot://callback, expo-router resolves this file first.
 * We forward all query params to the auth callback screen inside the (auth) group.
 *
 * IMPORTANT: React Navigation reserves the `state` query param for navigation
 * state rehydration. Passing an OAuth `state` value through it causes
 * getRehydratedState() to crash (it tries to call .filter() on a JWT string).
 * We rename `state` → `oauth_state` before forwarding so React Navigation never
 * sees it, and the (auth)/callback screen reads `oauth_state` instead.
 *
 * We use <Redirect> rendered conditionally (not router.replace in useEffect)
 * to guarantee the navigation container is mounted before the navigation attempt.
 */
import { useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, Redirect } from 'expo-router'

export default function CallbackRedirect() {
  const params = useLocalSearchParams<Record<string, string | string[]>>()
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    // Rename `state` → `oauth_state` to avoid colliding with React Navigation's
    // reserved `state` param used for navigation-state rehydration.
    const safe: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string') {
        safe[k === 'state' ? 'oauth_state' : k] = v
      } else if (Array.isArray(v) && v.length > 0) {
        safe[k === 'state' ? 'oauth_state' : k] = v[0]
      }
    }
    const query = new URLSearchParams(safe).toString()
    setTarget(query ? `/(auth)/callback?${query}` : '/(auth)/callback')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once — params are stable after mount

  if (!target) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    )
  }

  return <Redirect href={target as any} />
}
