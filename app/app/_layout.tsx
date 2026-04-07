import '@/lib/web/fixRnwLayers'
import '@/lib/web/suppressRnwDeprecations'
import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/hooks/useAuth'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import * as WebBrowser from 'expo-web-browser'
import '@/lib/i18n'

// Required for expo-auth-session / OAuth web flow to close the popup correctly
WebBrowser.maybeCompleteAuthSession()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      retryDelay: 500,
      refetchOnWindowFocus: true,
      // Treat network errors as errors immediately so screens can show error states
      networkMode: 'always',
    },
  },
})

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(setup)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(dashboard)" />
                  <Stack.Screen name="admin" />
                  <Stack.Screen name="(public)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
