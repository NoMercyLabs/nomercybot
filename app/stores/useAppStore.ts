import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { appStorage } from '@/lib/storage'

interface AppState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean

  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      commandPaletteOpen: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: 'nomercybot-app',
      storage: createJSONStorage(() => appStorage),
      partialize: (state: AppState) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)
