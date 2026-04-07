import { useAppStore } from '@/stores/useAppStore'

jest.mock('@/lib/storage', () => ({
  appStorage: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

beforeEach(() => {
  useAppStore.setState({ sidebarCollapsed: false, commandPaletteOpen: false })
})

describe('useAppStore', () => {
  describe('initial state', () => {
    it('starts with sidebar expanded', () => {
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })

    it('starts with command palette closed', () => {
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
    })
  })

  describe('toggleSidebar', () => {
    it('collapses expanded sidebar', () => {
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    })

    it('expands collapsed sidebar', () => {
      useAppStore.setState({ sidebarCollapsed: true })
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })

    it('toggles twice returns to original state', () => {
      useAppStore.getState().toggleSidebar()
      useAppStore.getState().toggleSidebar()
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('setSidebarCollapsed', () => {
    it('explicitly collapses the sidebar', () => {
      useAppStore.getState().setSidebarCollapsed(true)
      expect(useAppStore.getState().sidebarCollapsed).toBe(true)
    })

    it('explicitly expands the sidebar', () => {
      useAppStore.setState({ sidebarCollapsed: true })
      useAppStore.getState().setSidebarCollapsed(false)
      expect(useAppStore.getState().sidebarCollapsed).toBe(false)
    })
  })

  describe('setCommandPaletteOpen', () => {
    it('opens the command palette', () => {
      useAppStore.getState().setCommandPaletteOpen(true)
      expect(useAppStore.getState().commandPaletteOpen).toBe(true)
    })

    it('closes the command palette', () => {
      useAppStore.setState({ commandPaletteOpen: true })
      useAppStore.getState().setCommandPaletteOpen(false)
      expect(useAppStore.getState().commandPaletteOpen).toBe(false)
    })
  })
})
