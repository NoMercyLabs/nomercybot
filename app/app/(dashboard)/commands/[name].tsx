import { useState } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useApiQuery, useApiMutation } from '@/hooks/useApi'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { CommandForm } from '@/features/commands/components/CommandForm'
import { usePipelines } from '@/features/pipelines/hooks/usePipelines'
import type { Command, CommandCreate, CommandUpdate } from '@/features/commands/types'

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function CommandEditScreen() {
  const router = useRouter()
  const { name } = useLocalSearchParams<{ name: string }>()
  const addToast = useNotificationStore((s) => s.addToast)
  const isNew = name === 'new'

  const [deleteVisible, setDeleteVisible] = useState(false)

  // Fetch command data (skip for new)
  const { data: command, isLoading } = useApiQuery<Command>(
    `commands/${name}`,
    `/commands/${name}`,
    { enabled: !isNew },
  )

  // Fetch pipelines for selector
  const { pipelines } = usePipelines()

  // Create mutation
  const createMutation = useApiMutation<Command, CommandCreate>('/commands', 'post', {
    invalidateKeys: ['commands'],
    onSuccess: (created) => {
      addToast('success', `Command !${created.name} created`)
      router.push('/(dashboard)/commands' as any)
    },
    onError: () => {
      addToast('error', 'Failed to create command')
    },
  })

  // Update mutation — always use the route param (original name) as the URL key
  const updateMutation = useApiMutation<Command, CommandUpdate>(
    `/commands/${name}`,
    'put',
    {
      invalidateKeys: ['commands', `commands/${name}`],
      onSuccess: () => {
        addToast('success', 'Command saved')
      },
      onError: () => {
        addToast('error', 'Failed to save command')
      },
    },
  )

  // Delete mutation
  const deleteMutation = useApiMutation<void, void>(
    `/commands/${command?.name ?? name}`,
    'delete',
    {
      invalidateKeys: ['commands'],
      onSuccess: () => {
        addToast('success', `Command !${name} deleted`)
        router.push('/(dashboard)/commands' as any)
      },
      onError: () => {
        addToast('error', 'Failed to delete command')
      },
    },
  )

  async function handleSubmit(data: CommandCreate | CommandUpdate) {
    if (isNew) {
      await createMutation.mutateAsync(data as CommandCreate)
    } else {
      await updateMutation.mutateAsync(data as CommandUpdate)
    }
  }

  async function handleDelete() {
    setDeleteVisible(false)
    await deleteMutation.mutateAsync()
  }

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title={isNew ? 'New Command' : `Edit !${name}`}
          backHref="/(dashboard)/commands"
          rightContent={
            !isNew ? (
              <Pressable
                onPress={() => setDeleteVisible(true)}
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                disabled={isSubmitting || isLoading}
              >
                <Trash2 size={18} color="#fca5a5" />
              </Pressable>
            ) : undefined
          }
        />

        {/* Error state for failed fetch — shown exclusively, no form */}
        {!isLoading && !isNew && !command ? (
          <View className="items-center px-6 py-10 gap-3">
            <Text className="text-center" style={{ color: '#8889a0' }}>
              Could not load command. It may not exist.
            </Text>
            <Pressable
              onPress={() => router.push('/(dashboard)/commands' as any)}
              className="px-4 py-2 rounded-xl"
              style={{ borderWidth: 1, borderColor: '#2a2b3a' }}
            >
              <Text className="font-medium text-white">Back to Commands</Text>
            </Pressable>
          </View>
        ) : (
          <View className="px-5 py-4">
            {isLoading ? (
              /* ── Skeleton Loading ── */
              <View className="gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </View>
            ) : (
              /* ── Form ── */
              <CommandForm
                command={isNew ? undefined : command}
                pipelines={pipelines.map((p) => ({ id: String(p.id), name: p.name }))}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        visible={deleteVisible}
        title="Delete Command"
        message={`Are you sure you want to delete !${name}? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </>
  )
}
