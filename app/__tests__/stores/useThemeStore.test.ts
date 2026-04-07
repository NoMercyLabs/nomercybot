import { useThemeStore } from '@/stores/useThemeStore'

// Mock the persist storage so tests don't touch localStorage
jest.mock('@/lib/storage', () => ({
  appStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

beforeEach(() => {
  useThemeStore.setState({ isDark: true, accentOverride: null })
})

describe('useThemeStore', () => {
  describe('initial state', () => {
    it('starts in dark mode', () => {
      expect(useThemeStore.getState().isDark).toBe(true)
    })

    it('starts with no accent override', () => {
      expect(useThemeStore.getState().accentOverride).toBeNull()
    })
  })

  describe('toggleDark', () => {
    it('toggles dark mode off when dark', () => {
      useThemeStore.getState().toggleDark()
      expect(useThemeStore.getState().isDark).toBe(false)
    })

    it('toggles dark mode on when light', () => {
      useThemeStore.setState({ isDark: false })
      useThemeStore.getState().toggleDark()
      expect(useThemeStore.getState().isDark).toBe(true)
    })

    it('toggles multiple times correctly', () => {
      useThemeStore.getState().toggleDark() // false
      useThemeStore.getState().toggleDark() // true
      useThemeStore.getState().toggleDark() // false
      expect(useThemeStore.getState().isDark).toBe(false)
    })
  })

  describe('toggleTheme (alias)', () => {
    it('toggles dark mode like toggleDark', () => {
      useThemeStore.getState().toggleTheme()
      expect(useThemeStore.getState().isDark).toBe(false)
    })
  })

  describe('setAccent', () => {
    it('sets a hex accent color', () => {
      useThemeStore.getState().setAccent('#6366f1')
      expect(useThemeStore.getState().accentOverride).toBe('#6366f1')
    })

    it('can be set to null', () => {
      useThemeStore.getState().setAccent('#6366f1')
      useThemeStore.getState().setAccent(null)
      expect(useThemeStore.getState().accentOverride).toBeNull()
    })

    it('replaces a previous accent', () => {
      useThemeStore.getState().setAccent('#6366f1')
      useThemeStore.getState().setAccent('#ef4444')
      expect(useThemeStore.getState().accentOverride).toBe('#ef4444')
    })
  })

  describe('resetAccent', () => {
    it('clears accent override', () => {
      useThemeStore.getState().setAccent('#6366f1')
      useThemeStore.getState().resetAccent()
      expect(useThemeStore.getState().accentOverride).toBeNull()
    })

    it('is a no-op when accent is already null', () => {
      useThemeStore.getState().resetAccent()
      expect(useThemeStore.getState().accentOverride).toBeNull()
    })
  })
})
