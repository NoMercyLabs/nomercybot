export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  nextPage: number | null
  hasMore: boolean
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, string[]>
}
