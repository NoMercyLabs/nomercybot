import { useState } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { AlertTriangle } from 'lucide-react-native'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useAuth } from '@/hooks/useAuth'
import { useChannelStore } from '@/stores/useChannelStore'
import { useNotificationStore } from '@/stores/useNotificationStore'

export default function DangerZoneScreen() {
  const logout = useAuthStore((s) => s.logout)
  const { user } = useAuth()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const addToast = useNotificationStore((s) => s.addToast)

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const resetMutation = useMutation({
    mutationFn: () => {
      if (!channelId) throw new Error('No channel selected')
      return apiClient.post(`/v1/channels/${channelId}/reset`)
    },
    onSuccess: () => addToast('success', 'Bot configuration has been reset.'),
    onError: () => addToast('error', 'Failed to reset bot configuration.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('User not found')
      return apiClient.delete(`/v1/users/${user.id}/data`)
    },
    onSuccess: () => { logout() },
    onError: () => addToast('error', 'Failed to delete account.'),
  })

  return (
    <ErrorBoundary>
      <ScrollView
        style={{ flex: 1, backgroundColor: '#0a0b0f' }}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <PageHeader title="Danger Zone" />

        <View className="px-5 pt-4 gap-4">
          <View
            className="rounded-xl p-4 gap-4"
            style={{
              backgroundColor: 'rgba(239,68,68,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={16} color="#ef4444" />
              <Text className="text-sm font-semibold" style={{ color: '#ef4444' }}>Destructive Actions</Text>
            </View>
            <Text className="text-xs" style={{ color: '#8889a0' }}>
              These actions are irreversible. Please proceed with caution.
            </Text>

            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.2)', paddingTop: 16, gap: 12 }}>
              <View className="gap-2">
                <Text className="text-sm font-medium text-white">Reset Bot Configuration</Text>
                <Text className="text-xs" style={{ color: '#5a5b72' }}>
                  Reset all bot settings to their default values. Your commands, timers, and automations will be preserved.
                </Text>
                <Pressable
                  onPress={() => {
                    if (typeof window !== 'undefined' && window.confirm('This will reset all bot settings to defaults. Commands, timers, and responses will be preserved.\n\nAre you sure?')) {
                      resetMutation.mutate()
                    }
                  }}
                  className="rounded-xl py-3 items-center"
                  style={{ borderWidth: 1, borderColor: '#2a2b3a' }}
                >
                  <Text className="font-medium" style={{ color: '#d1d5db' }}>
                    {resetMutation.isPending ? 'Resetting...' : 'Reset Bot Configuration'}
                  </Text>
                </Pressable>
              </View>

              <View
                className="gap-2"
                style={{ borderTopWidth: 1, borderTopColor: 'rgba(239,68,68,0.2)', paddingTop: 12 }}
              >
                <Text className="text-sm font-medium" style={{ color: '#ef4444' }}>Delete Account</Text>
                <Text className="text-xs" style={{ color: '#5a5b72' }}>
                  Permanently delete your account and all associated data. This cannot be undone.
                </Text>
                <Pressable
                  onPress={() => {
                    if (typeof window !== 'undefined' && window.confirm('This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you sure?')) {
                      deleteMutation.mutate()
                    }
                  }}
                  className="rounded-xl py-3 items-center"
                  style={{ backgroundColor: '#b91c1c' }}
                >
                  <Text className="text-white font-semibold">
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Account'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showResetDialog}
        title="Reset Bot Configuration"
        message="This will reset all bot settings to defaults. Commands, timers, and responses will be preserved."
        confirmLabel="Reset"
        variant="danger"
        onConfirm={() => {
          setShowResetDialog(false)
          resetMutation.mutate()
        }}
        onCancel={() => setShowResetDialog(false)}
      />

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          setShowDeleteDialog(false)
          deleteMutation.mutate()
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </ErrorBoundary>
  )
}
