import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { apiClient } from '@/lib/api/client'

type SystemState = 'loading' | 'needs-setup' | 'ready'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const [systemState, setSystemState] = useState<SystemState>('loading')

  useEffect(() => {
    let cancelled = false
    async function checkSystem() {
      try {
        const res = await apiClient.get<{ data: { ready: boolean } }>('/v1/system/status')
        if (cancelled) return
        setSystemState(res.data?.data?.ready ? 'ready' : 'needs-setup')
      } catch {
        // If the endpoint doesn't exist or network error, assume ready (backwards compat)
        if (!cancelled) setSystemState('ready')
      }
    }
    checkSystem()
    return () => { cancelled = true }
  }, [])

  if (systemState === 'loading' || isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0a0b0f' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    )
  }

  if (systemState === 'needs-setup') {
    return <Redirect href="/(setup)" />
  }

  if (isAuthenticated) {
    return <Redirect href="/(dashboard)" />
  }

  return <Redirect href="/(auth)/login" />
}
