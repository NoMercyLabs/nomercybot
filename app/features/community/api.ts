import { apiClient } from '@/lib/api/client'
import type {
  CommunityUser,
  UserDetail,
  BannedUser,
  TrustLevel,
  GetUsersParams,
  GetBansParams,
} from './types'

export interface PaginatedCommunityResponse<T> {
  data: T[]
  nextPage?: number
  nextCursor?: string
  hasMore: boolean
  total?: number
}

export const communityApi = {
  getUsers: (channelId: string, params?: GetUsersParams) =>
    apiClient
      .get<PaginatedCommunityResponse<CommunityUser>>(
        `/v1/channels/${channelId}/community`,
        { params },
      )
      .then((r) => r.data),

  getUser: (channelId: string, userId: string) =>
    apiClient
      .get<UserDetail>(`/v1/channels/${channelId}/community/${userId}`)
      .then((r) => r.data),

  setTrustLevel: (channelId: string, userId: string, level: TrustLevel) =>
    apiClient
      .put<UserDetail>(`/v1/channels/${channelId}/community/${userId}/trust`, { level })
      .then((r) => r.data),

  banUser: (channelId: string, userId: string, reason: string) =>
    apiClient
      .post<void>(`/v1/channels/${channelId}/community/${userId}/ban`, { reason })
      .then((r) => r.data),

  unbanUser: (channelId: string, userId: string) =>
    apiClient
      .delete<void>(`/v1/channels/${channelId}/community/${userId}/ban`)
      .then((r) => r.data),

  getBans: (channelId: string, params?: GetBansParams) =>
    apiClient
      .get<PaginatedCommunityResponse<BannedUser>>(
        `/v1/channels/${channelId}/community/bans`,
        { params },
      )
      .then((r) => r.data),
}
