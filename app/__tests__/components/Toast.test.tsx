import React from 'react'
import { Pressable } from 'react-native'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Toast } from '@/components/ui/Toast'
import type { Toast as ToastType } from '@/stores/useNotificationStore'

// Mock lucide icons — they import SVG and fail in Jest environments
jest.mock('lucide-react-native', () => ({
  CheckCircle: 'CheckCircle',
  XCircle: 'XCircle',
  AlertTriangle: 'AlertTriangle',
  Info: 'Info',
  X: 'X',
}))

const makeToast = (overrides?: Partial<ToastType>): ToastType => ({
  id: 'toast-1',
  type: 'success',
  message: 'Operation successful',
  duration: 5000,
  ...overrides,
})

describe('Toast', () => {
  it('renders the toast message', () => {
    render(<Toast toast={makeToast()} onDismiss={jest.fn()} />)
    expect(screen.getByText('Operation successful')).toBeTruthy()
  })

  it('calls onDismiss with toast id when dismiss is pressed', () => {
    const onDismiss = jest.fn()
    const { UNSAFE_getAllByType } = render(
      <Toast toast={makeToast({ id: 'toast-42' })} onDismiss={onDismiss} />,
    )
    // The dismiss Pressable is the last Pressable in the component tree
    const pressables = UNSAFE_getAllByType(Pressable)
    fireEvent.press(pressables[pressables.length - 1])
    expect(onDismiss).toHaveBeenCalledWith('toast-42')
  })

  it('renders success toast', () => {
    render(<Toast toast={makeToast({ type: 'success' })} onDismiss={jest.fn()} />)
    expect(screen.getByText('Operation successful')).toBeTruthy()
  })

  it('renders error toast', () => {
    render(<Toast toast={makeToast({ type: 'error', message: 'Error occurred' })} onDismiss={jest.fn()} />)
    expect(screen.getByText('Error occurred')).toBeTruthy()
  })

  it('renders warning toast', () => {
    render(<Toast toast={makeToast({ type: 'warning', message: 'Watch out' })} onDismiss={jest.fn()} />)
    expect(screen.getByText('Watch out')).toBeTruthy()
  })

  it('renders info toast', () => {
    render(<Toast toast={makeToast({ type: 'info', message: 'FYI' })} onDismiss={jest.fn()} />)
    expect(screen.getByText('FYI')).toBeTruthy()
  })
})
