import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

export function useConfirm() {
  const [state, setState] = useState<{
    isOpen: boolean
    options: ConfirmOptions | null
    resolve: ((confirmed: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState({ isOpen: false, options: null, resolve: null })
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState({ isOpen: false, options: null, resolve: null })
  }, [state.resolve])

  return {
    isOpen: state.isOpen,
    options: state.options,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
