import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus, Platform } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'

export function useAppState(options?: {
  onForeground?: () => void
  onBackground?: () => void
}) {
  const queryClient = useQueryClient()
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    if (Platform.OS === 'web') return

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        queryClient.invalidateQueries()
        options?.onForeground?.()
      }

      if (nextState.match(/inactive|background/)) {
        options?.onBackground?.()
      }

      appState.current = nextState
    })

    return () => subscription.remove()
  }, [queryClient, options])
}
