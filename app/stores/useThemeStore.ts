import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { appStorage } from '@/lib/storage'

interface ThemeState {
  isDark: boolean
  accentOverride: string | null

  toggleDark: () => void
  toggleTheme: () => void
  setAccent: (hex: string | null) => void
  resetAccent: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      accentOverride: null,

      toggleDark: () => set((s) => ({ isDark: !s.isDark })),
      toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
      setAccent: (hex) => set({ accentOverride: hex }),
      resetAccent: () => set({ accentOverride: null }),
    }),
    {
      name: 'nomercybot-theme',
      storage: createJSONStorage(() => appStorage),
    },
  ),
)
