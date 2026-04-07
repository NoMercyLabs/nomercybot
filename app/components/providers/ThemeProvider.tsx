import { createElement, useEffect, type ReactNode } from 'react'
import { View, Platform, useColorScheme, Appearance } from 'react-native'
import { useThemeStore } from '@/stores/useThemeStore'
import { ThemeContext } from '@/hooks/useTheme'
import { hexToRgbPalette } from '@/lib/theme/colors'

interface ThemeProviderProps {
  children: ReactNode
}

const DEFAULT_ACCENT = '#9146FF'

export function ThemeProvider({ children }: ThemeProviderProps) {
  const isDark = useThemeStore((s) => s.isDark)
  const accentOverride = useThemeStore((s) => s.accentOverride)
  const toggleDark = useThemeStore((s) => s.toggleDark)
  const setAccent = useThemeStore((s) => s.setAccent)
  const resetAccent = useThemeStore((s) => s.resetAccent)

  const accentHex = accentOverride ?? DEFAULT_ACCENT
  const accentVars = hexToRgbPalette(accentHex)

  // Apply dark class and accent CSS variables on web after render
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement
      Object.entries(accentVars).forEach(([shade, val]) => {
        root.style.setProperty(`--accent-${shade}`, val)
      })
      root.classList.toggle('dark', isDark)
    }
  }, [isDark, accentVars])

  // Sync the React Native Appearance system so NativeWind picks up the change on native
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(isDark ? 'dark' : 'light')
    }
  }, [isDark])

  return createElement(
    ThemeContext.Provider,
    { value: { isDark, toggleDark, accentHex, setAccent, resetAccent, accentVars } },
    createElement(View, { style: { flex: 1 } }, children),
  )
}
