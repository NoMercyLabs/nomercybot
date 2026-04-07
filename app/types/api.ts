export interface ApiResponse<T> {
  status: 'ok' | 'error'
  data: T
  message?: string
  args?: unknown[]
}

export interface PaginatedResponse<T> {
  data: T[]
  nextPage?: number
  hasMore: boolean
}

export interface ApiError {
  status: 'error'
  message: string
  args?: unknown[]
}
