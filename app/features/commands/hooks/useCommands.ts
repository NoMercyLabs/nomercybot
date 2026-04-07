import { useApiQuery, useApiMutation } from '@/hooks/useApi'
import type { Command, CommandCreate, CommandUpdate } from '../types'

export function useCommands() {
  const query = useApiQuery<Command[]>('commands', '/commands')

  const createMutation = useApiMutation<Command, CommandCreate>('/commands', 'post', {
    invalidateKeys: ['commands'],
    successMessage: 'Command created',
  })

  const updateMutation = useApiMutation<Command, CommandUpdate & { id: string }>('/commands', 'put', {
    invalidateKeys: ['commands'],
    successMessage: 'Command updated',
  })

  const deleteMutation = useApiMutation<void, string>('/commands', 'delete', {
    invalidateKeys: ['commands'],
    successMessage: 'Command deleted',
  })

  return {
    commands: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createCommand: createMutation.mutateAsync,
    updateCommand: updateMutation.mutateAsync,
    deleteCommand: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
