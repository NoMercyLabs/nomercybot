import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface NotificationState {
  toasts: Toast[]
  addToast: (type: ToastType, message: string, duration?: number) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 5000) => {
    const id = crypto.randomUUID()
    set((s) => ({
      toasts: [...s.toasts, { id, type, message, duration }],
    }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  clearAll: () => set({ toasts: [] }),
}))
