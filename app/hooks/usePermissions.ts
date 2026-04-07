import { useAuth } from './useAuth'
import { useChannel } from './useChannel'
import type { Permission } from '@/types/auth'

export function usePermissions() {
  const { user } = useAuth()
  const { currentChannel } = useChannel()

  function hasPermission(permission: Permission): boolean {
    if (!user || !currentChannel) return false
    // Broadcaster owns the channel → full permissions
    if (user.id === currentChannel.twitchId) return true
    // TODO: role-based permissions once backend supports it
    return false
  }

  function requirePermission(permission: Permission): void {
    if (!hasPermission(permission)) {
      throw new Error(`Missing permission: ${permission}`)
    }
  }

  return { hasPermission, requirePermission }
}
