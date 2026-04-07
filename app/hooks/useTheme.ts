import { createContext, useContext } from 'react'

interface ThemeContextValue {
  isDark: boolean
  toggleDark: () => void
  accentHex: string
  setAccent: (hex: string | null) => void
  resetAccent: () => void
  accentVars: Record<string, string>
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

