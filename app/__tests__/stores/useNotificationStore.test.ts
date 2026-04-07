import { act } from '@testing-library/react-native'
import { useNotificationStore } from '@/stores/useNotificationStore'

beforeEach(() => {
  // Merge-reset: only clears state values, preserves action functions
  useNotificationStore.setState({ toasts: [] })
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useNotificationStore', () => {
  describe('addToast', () => {
    it('adds a toast with correct type and message', () => {
      useNotificationStore.getState().addToast('success', 'Saved!')
      const { toasts } = useNotificationStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0].type).toBe('success')
      expect(toasts[0].message).toBe('Saved!')
    })

    it('assigns a unique id to each toast', () => {
      useNotificationStore.getState().addToast('info', 'First')
      useNotificationStore.getState().addToast('info', 'Second')
      const { toasts } = useNotificationStore.getState()
      expect(toasts[0].id).not.toBe(toasts[1].id)
    })

    it('uses 5000ms default duration', () => {
      useNotificationStore.getState().addToast('error', 'Oops')
      const { toasts } = useNotificationStore.getState()
      expect(toasts[0].duration).toBe(5000)
    })

    it('accepts a custom duration', () => {
      useNotificationStore.getState().addToast('warning', 'Watch out', 3000)
      const { toasts } = useNotificationStore.getState()
      expect(toasts[0].duration).toBe(3000)
    })

    it('auto-removes toast after duration', () => {
      useNotificationStore.getState().addToast('success', 'Auto-remove', 1000)
      expect(useNotificationStore.getState().toasts).toHaveLength(1)
      act(() => { jest.advanceTimersByTime(1000) })
      expect(useNotificationStore.getState().toasts).toHaveLength(0)
    })

    it('stacks multiple toasts', () => {
      useNotificationStore.getState().addToast('success', 'First')
      useNotificationStore.getState().addToast('error', 'Second')
      useNotificationStore.getState().addToast('info', 'Third')
      expect(useNotificationStore.getState().toasts).toHaveLength(3)
    })

    it('supports all four toast types', () => {
      useNotificationStore.getState().addToast('success', 'a')
      useNotificationStore.getState().addToast('error', 'b')
      useNotificationStore.getState().addToast('warning', 'c')
      useNotificationStore.getState().addToast('info', 'd')
      const types = useNotificationStore.getState().toasts.map((t) => t.type)
      expect(types).toEqual(['success', 'error', 'warning', 'info'])
    })
  })

  describe('removeToast', () => {
    it('removes toast by id', () => {
      useNotificationStore.getState().addToast('success', 'Hello')
      const id = useNotificationStore.getState().toasts[0].id
      useNotificationStore.getState().removeToast(id)
      expect(useNotificationStore.getState().toasts).toHaveLength(0)
    })

    it('only removes the matching toast when multiple exist', () => {
      useNotificationStore.getState().addToast('success', 'First')
      useNotificationStore.getState().addToast('error', 'Second')
      const firstId = useNotificationStore.getState().toasts[0].id
      useNotificationStore.getState().removeToast(firstId)
      const { toasts } = useNotificationStore.getState()
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Second')
    })

    it('does nothing when id does not exist', () => {
      useNotificationStore.getState().addToast('info', 'Keep me')
      useNotificationStore.getState().removeToast('non-existent-id')
      expect(useNotificationStore.getState().toasts).toHaveLength(1)
    })
  })

  describe('clearAll', () => {
    it('removes all toasts', () => {
      useNotificationStore.getState().addToast('success', 'First')
      useNotificationStore.getState().addToast('error', 'Second')
      useNotificationStore.getState().clearAll()
      expect(useNotificationStore.getState().toasts).toHaveLength(0)
    })

    it('is a no-op when no toasts exist', () => {
      useNotificationStore.getState().clearAll()
      expect(useNotificationStore.getState().toasts).toHaveLength(0)
    })
  })
})
