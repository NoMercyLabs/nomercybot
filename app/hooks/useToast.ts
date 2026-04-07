import { useCallback } from 'react'
import { useNotificationStore } from '@/stores/useNotificationStore'

export function useToast() {
  const addToast = useNotificationStore((s) => s.addToast)

  return {
    success: useCallback((message: string) => addToast('success', message), [addToast]),
    error: useCallback((message: string) => addToast('error', message), [addToast]),
    warning: useCallback((message: string) => addToast('warning', message), [addToast]),
    info: useCallback((message: string) => addToast('info', message), [addToast]),
  }
}
