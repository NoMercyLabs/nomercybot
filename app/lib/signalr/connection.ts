import {
  HubConnectionBuilder,
  HubConnection,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { API_BASE_URL } from '@/lib/utils/apiUrl'

// Dynamic token getter — updated by useSignalR after auth changes.
// Using a getter avoids stale tokens on refresh without recreating the connection.
// Returns a Promise so it can trigger a token refresh if the current one is expired.
let _getToken: (() => string) | null = null
let _refreshToken: (() => Promise<void>) | null = null

export function setSignalRTokenGetter(getter: () => string): void {
  _getToken = getter
}

export function setSignalRTokenRefresher(refresher: () => Promise<void>): void {
  _refreshToken = refresher
}

async function getValidToken(): Promise<string> {
  const token = _getToken?.() ?? ''
  if (!token) return ''

  // Check if token is expired by decoding the JWT payload
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresAt = payload.exp * 1000
    if (Date.now() > expiresAt - 30_000) {
      // Token expires within 30s — refresh first
      await _refreshToken?.()
      return _getToken?.() ?? ''
    }
  } catch {
    // If we can't decode, just return it and let the server reject it
  }
  return token
}

function makeBaseUrl(hubPath: string): string {
  return `${API_BASE_URL}${hubPath}`
}

function buildConnection(hubPath: string): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(makeBaseUrl(hubPath), {
      accessTokenFactory: () => getValidToken(),
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        if (retryContext.elapsedMilliseconds > 120_000) return null
        return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30_000)
      },
    })
    .configureLogging(__DEV__ ? LogLevel.Warning : LogLevel.Error)
    .build()
}

// ── DashboardHub (/hubs/dashboard) ───────────────────────────────────────────

let dashboardConnection: HubConnection | null = null
let dashboardRefCount = 0

export function getDashboardConnection(): HubConnection {
  if (!dashboardConnection) {
    dashboardConnection = buildConnection('/hubs/dashboard')
  }
  return dashboardConnection
}

/** Returns the current connection without creating one. Used to detect orphaned refs. */
export function peekDashboardConnection(): HubConnection | null {
  return dashboardConnection
}

export function incrementDashboardRefCount(): void {
  dashboardRefCount++
}

export function decrementDashboardRefCount(): void {
  dashboardRefCount = Math.max(0, dashboardRefCount - 1)
}

export function getDashboardRefCount(): number {
  return dashboardRefCount
}

export async function destroyDashboardConnection(): Promise<void> {
  if (dashboardConnection) {
    await dashboardConnection.stop()
    dashboardConnection = null
    dashboardRefCount = 0
  }
}

// ── OverlayHub (/hubs/overlay) ────────────────────────────────────────────────

let overlayConnection: HubConnection | null = null
let overlayRefCount = 0

export function getOverlayConnection(): HubConnection {
  if (!overlayConnection) {
    overlayConnection = buildConnection('/hubs/overlay')
  }
  return overlayConnection
}

export function incrementOverlayRefCount(): void {
  overlayRefCount++
}

export function decrementOverlayRefCount(): void {
  overlayRefCount = Math.max(0, overlayRefCount - 1)
}

export function getOverlayRefCount(): number {
  return overlayRefCount
}

export async function destroyOverlayConnection(): Promise<void> {
  if (overlayConnection) {
    await overlayConnection.stop()
    overlayConnection = null
    overlayRefCount = 0
  }
}

// ── OBSRelayHub (/hubs/obs) ──────────────────────────────────────────────────

let obsConnection: HubConnection | null = null
let obsRefCount = 0

export function getOBSConnection(): HubConnection {
  if (!obsConnection) {
    obsConnection = buildConnection('/hubs/obs')
  }
  return obsConnection
}

export function incrementOBSRefCount(): void {
  obsRefCount++
}

export function decrementOBSRefCount(): void {
  obsRefCount = Math.max(0, obsRefCount - 1)
}

export function getOBSRefCount(): number {
  return obsRefCount
}

export async function destroyOBSConnection(): Promise<void> {
  if (obsConnection) {
    await obsConnection.stop()
    obsConnection = null
    obsRefCount = 0
  }
}

// ── Shared utilities ──────────────────────────────────────────────────────────

/** Destroy all hub connections (called on logout). */
export async function destroyAllConnections(): Promise<void> {
  await Promise.allSettled([
    destroyDashboardConnection(),
    destroyOverlayConnection(),
    destroyOBSConnection(),
  ])
}

export function getConnectionState(connection: HubConnection | null): HubConnectionState {
  return connection?.state ?? HubConnectionState.Disconnected
}

// ── Backwards-compat aliases (used by existing useSignalR hook) ───────────────

/** @deprecated Use getDashboardConnection() */
export function getSignalRConnection(_token?: string): HubConnection {
  return getDashboardConnection()
}

/** @deprecated Use incrementDashboardRefCount() */
export const incrementRefCount = incrementDashboardRefCount

/** @deprecated Use decrementDashboardRefCount() */
export const decrementRefCount = decrementDashboardRefCount

/** @deprecated Use getDashboardRefCount() */
export const getRefCount = getDashboardRefCount

/** @deprecated Use destroyDashboardConnection() */
export const destroyConnection = destroyDashboardConnection
