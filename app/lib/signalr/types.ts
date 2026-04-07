export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface SignalRConfig {
  hubUrl: string
  accessToken: string
}
