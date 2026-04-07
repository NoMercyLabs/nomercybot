import { useEffect } from 'react'
import { Platform } from 'react-native'

interface KeyCombo {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  alt?: boolean
}

export function useKeyboardShortcut(
  combo: KeyCombo,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlMatch = combo.ctrl ? (e.ctrlKey || e.metaKey) : true
      const shiftMatch = combo.shift ? e.shiftKey : !e.shiftKey
      const altMatch = combo.alt ? e.altKey : !e.altKey

      if (
        e.key.toLowerCase() === combo.key.toLowerCase() &&
        ctrlMatch &&
        shiftMatch &&
        altMatch
      ) {
        e.preventDefault()
        handler()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [combo, handler, enabled])
}
