import { useState, useEffect } from 'react'

/**
 * Returns true if `isLoading` has been true for longer than `ms` (default 5 seconds).
 * Use this to bail out of skeleton states when the backend is unreachable.
 */
export function useLoadingTimeout(isLoading: boolean, ms = 5_000): boolean {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setTimedOut(false)
      return
    }
    const id = setTimeout(() => setTimedOut(true), ms)
    return () => clearTimeout(id)
  }, [isLoading, ms])

  return timedOut
}
