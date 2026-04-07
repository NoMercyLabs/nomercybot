import { renderHook, act } from '@testing-library/react-native'
import { useToast } from '@/hooks/useToast'
import { useNotificationStore } from '@/stores/useNotificationStore'

beforeEach(() => {
  useNotificationStore.setState({ toasts: [] })
})

describe('useToast', () => {
  it('success adds a success toast', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.success('Saved!') })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].message).toBe('Saved!')
  })

  it('error adds an error toast', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.error('Something went wrong') })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts[0].type).toBe('error')
    expect(toasts[0].message).toBe('Something went wrong')
  })

  it('warning adds a warning toast', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.warning('Be careful') })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts[0].type).toBe('warning')
  })

  it('info adds an info toast', () => {
    const { result } = renderHook(() => useToast())
    act(() => { result.current.info('Did you know?') })
    const toasts = useNotificationStore.getState().toasts
    expect(toasts[0].type).toBe('info')
  })

  it('returns stable callbacks across re-renders', () => {
    const { result, rerender } = renderHook(() => useToast())
    const firstSuccess = result.current.success
    rerender({})
    expect(result.current.success).toBe(firstSuccess)
  })
})
