import { View, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { Trash2 } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { TimerForm } from '../components/TimerForm'
import { useTimers, useTimer } from '../hooks/useTimers'
import { useToast } from '@/hooks/useToast'
import type { TimerCreate, TimerUpdate } from '../types'

interface TimerDetailScreenProps {
  timerId: string
}

export function TimerDetailScreen({ timerId }: TimerDetailScreenProps) {
  const isNew = timerId === 'new'
  const numericId = isNew ? 'new' : parseInt(timerId, 10)
  const { data: timer, isLoading } = useTimer(numericId)
  const { createTimer, updateTimer, deleteTimer, isCreating, isUpdating } = useTimers()
  const toast = useToast()

  async function handleSubmit(data: TimerCreate | TimerUpdate) {
    try {
      if (isNew) {
        await createTimer(data as TimerCreate)
        toast.success('Timer created')
      } else {
        await updateTimer(numericId as number, data as TimerUpdate)
        toast.success('Timer saved')
      }
      router.back()
    } catch {
      toast.error('Failed to save timer')
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete Timer',
      'Are you sure you want to delete this timer? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTimer(numericId as number)
              toast.success('Timer deleted')
              router.back()
            } catch {
              toast.error('Failed to delete timer')
            }
          },
        },
      ],
    )
  }

  return (
    <ErrorBoundary>
    <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <PageHeader
        title={isNew ? 'New Timer' : 'Edit Timer'}
        showBack
        rightContent={
          !isNew && (
            <Button
              variant="ghost"
              size="sm"
              onPress={confirmDelete}
              leftIcon={<Trash2 size={14} color="#ef4444" />}
              label="Delete"
            />
          )
        }
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        {!isNew && isLoading ? (
          <View className="gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </View>
        ) : (
          <TimerForm
            timer={timer}
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        )}
      </ScrollView>
    </View>
    </ErrorBoundary>
  )
}
