import { useEffect, useState, useCallback, useRef } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import { AppState, Platform } from 'react-native'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  getDashboardConnection,
  peekDashboardConnection,
  incrementDashboardRefCount,
  decrementDashboardRefCount,
  getDashboardRefCount,
  destroyDashboardConnection,
  setSignalRTokenGetter,
  setSignalRTokenRefresher,
} from '@/lib/signalr/connection'
import type { SignalREventMap } from '@/types/signalr'
import type { ConnectionStatus } from '@/lib/signalr/types'

let statusListeners = new Set<(status: ConnectionStatus) => void>()

// Module-level latest status so late-mounting hooks can read the current state
// instead of starting from 'disconnected'.
let _currentStatus: ConnectionStatus = 'disconnected'

function broadcastStatus(status: ConnectionStatus) {
  _currentStatus = status
  statusListeners.forEach((fn) => fn(status))
}

// Track which connection instances already have lifecycle handlers attached so
// we don't accumulate duplicate onreconnecting/onreconnected/onclose callbacks
// across multiple connect() calls.
const _registeredConnections = new WeakSet<import('@microsoft/signalr').HubConnection>()

export function useSignalR() {
  const [status, setStatus] = useState<ConnectionStatus>(() => _currentStatus)
  const [error, setError] = useState<string | null>(null)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Track whether this hook instance called connect() so the cleanup only
  // decrements the ref count when it was actually incremented.
  const didConnectRef = useRef(false)

  // Register the dynamic token getter and refresher once (and whenever auth changes)
  useEffect(() => {
    setSignalRTokenGetter(() => useAuthStore.getState().accessToken ?? '')
    setSignalRTokenRefresher(() => useAuthStore.getState().refreshToken())
  }, [isAuthenticated])

  useEffect(() => {
    statusListeners.add(setStatus)
    return () => { statusListeners.delete(setStatus) }
  }, [])

  const connect = useCallback(async () => {
    if (!useAuthStore.getState().isAuthenticated) return

    didConnectRef.current = true
    const conn = getDashboardConnection()
    incrementDashboardRefCount()

    // Register lifecycle handlers only once per connection instance to avoid
    // accumulating duplicate callbacks when connect() is called multiple times.
    if (!_registeredConnections.has(conn)) {
      _registeredConnections.add(conn)
      conn.onreconnecting(() => broadcastStatus('reconnecting'))
      conn.onreconnected(() => broadcastStatus('connected'))
      conn.onclose(() => {
        _registeredConnections.delete(conn)
        broadcastStatus('disconnected')
      })
    }

    if (conn.state !== HubConnectionState.Disconnected) {
      if (conn.state === HubConnectionState.Connected) broadcastStatus('connected')
      return
    }

    broadcastStatus('connecting')

    // Retry start() with exponential backoff. withAutomaticReconnect() only fires
    // after a successful connection drops — it does NOT retry a failed start().
    // Retrying here allows auth init() to finish refreshing an expired token
    // before the 2nd or 3rd attempt picks up the new one.
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await conn.start()
        broadcastStatus('connected')
        return
      } catch (e) {
        const msg = (e as Error).message ?? ''
        // stop() was called mid-negotiate (e.g., logout racing with connect) — don't retry
        if (msg.includes('stopped during negotiation')) {
          broadcastStatus('disconnected')
          return
        }
        // conn is orphaned: destroyDashboardConnection() was called and set dashboardConnection=null
        if (peekDashboardConnection() !== conn) {
          return
        }
        if (attempt < 3) {
          await new Promise<void>((r) => setTimeout(r, 1000 * 2 ** attempt))
        } else {
          broadcastStatus('disconnected')
          setError(msg)
        }
      }
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (!didConnectRef.current) return
    didConnectRef.current = false
    decrementDashboardRefCount()
    if (getDashboardRefCount() <= 0) {
      await destroyDashboardConnection()
      broadcastStatus('disconnected')
    }
  }, [])

  const on = useCallback(<K extends keyof SignalREventMap>(
    event: K,
    handler: (data: SignalREventMap[K]) => void,
  ) => {
    const conn = getDashboardConnection()
    conn.on(event as string, handler)
  }, [])

  const off = useCallback(<K extends keyof SignalREventMap>(event: K) => {
    const conn = getDashboardConnection()
    conn.off(event as string)
  }, [])

  const invoke = useCallback(async <T>(method: string, ...args: unknown[]): Promise<T> => {
    if (!useAuthStore.getState().isAuthenticated) throw new Error('Not authenticated')
    const conn = getDashboardConnection()
    if (conn.state !== HubConnectionState.Connected) {
      throw new Error('SignalR not connected')
    }
    return conn.invoke<T>(method, ...args)
  }, [])

  // Re-connect when app comes back to foreground on mobile
  useEffect(() => {
    if (Platform.OS === 'web') return

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (!useAuthStore.getState().isAuthenticated) return
      const conn = getDashboardConnection()

      if (nextState === 'active' && conn.state === HubConnectionState.Disconnected) {
        broadcastStatus('connecting')
        try {
          await conn.start()
          broadcastStatus('connected')
        } catch (e) {
          setError((e as Error).message)
        }
      }
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    return () => { disconnect() }
  }, [disconnect])

  return { status, error, connect, disconnect, on, off, invoke }
}
