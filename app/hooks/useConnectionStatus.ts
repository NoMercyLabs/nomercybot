import { useSignalR } from './useSignalR'

export function useConnectionStatus() {
  const { status, error } = useSignalR()

  return {
    status,
    error,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isReconnecting: status === 'reconnecting',
    isDisconnected: status === 'disconnected',
  }
}
