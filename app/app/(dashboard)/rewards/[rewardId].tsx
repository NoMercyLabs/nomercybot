import { useEffect } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2, AlertTriangle } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useChannelStore } from '@/stores/useChannelStore'
import { useToast } from '@/hooks/useToast'
import { apiClient } from '@/lib/api/client'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  cost: z.number().min(1),
  prompt: z.string().optional(),
  isEnabled: z.boolean(),
  requiresInput: z.boolean(),
  maxRedemptions: z.number().min(0).optional(),
  cooldownSeconds: z.number().min(0).optional(),
})

type FormData = z.infer<typeof schema>

interface Reward {
  id: string
  name: string
  cost: number
  prompt?: string
  isEnabled: boolean
  requiresInput: boolean
  maxRedemptions?: number
  cooldownSeconds?: number
  backgroundColor?: string
  isPaused: boolean
}

export default function RewardDetailScreen() {
  const { rewardId } = useLocalSearchParams<{ rewardId: string }>()
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const toast = useToast()
  const qc = useQueryClient()

  const { data: reward, isLoading, isError, refetch } = useQuery<Reward>({
    queryKey: ['rewards', channelId, rewardId],
    queryFn: () =>
      apiClient.get(`/v1/channels/${channelId}/rewards/${rewardId}`).then((r) => r.data),
    enabled: !!channelId && !!rewardId,
  })

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      cost: 100,
      prompt: '',
      isEnabled: true,
      requiresInput: false,
      maxRedemptions: undefined,
      cooldownSeconds: undefined,
    },
  })

  useEffect(() => {
    if (reward) {
      reset({
        name: reward.name,
        cost: reward.cost,
        prompt: reward.prompt ?? '',
        isEnabled: reward.isEnabled,
        requiresInput: reward.requiresInput,
        maxRedemptions: reward.maxRedemptions,
        cooldownSeconds: reward.cooldownSeconds,
      })
    }
  }, [reward, reset])

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.patch(`/v1/channels/${channelId}/rewards/${rewardId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards', channelId] })
      toast.success('Reward saved')
      router.back()
    },
    onError: () => toast.error('Failed to save reward'),
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiClient.delete(`/v1/channels/${channelId}/rewards/${rewardId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rewards', channelId] })
      toast.success('Reward deleted')
      router.back()
    },
    onError: () => toast.error('Failed to delete reward'),
  })

  function confirmDelete() {
    Alert.alert('Delete Reward', `Delete "${reward?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ])
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Reward" showBack />
        <View className="p-4 gap-3">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </View>
      </View>
    )
  }

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b0f' }}>
        <PageHeader title="Reward" showBack />
        <EmptyState
          icon={<AlertTriangle size={32} color="#ef4444" />}
          title="Failed to load reward"
          message="Could not fetch reward details."
          actionLabel="Retry"
          onAction={refetch}
        />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0b0f' }} contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 16 }}>
      <PageHeader
        title={reward?.name ?? 'Reward'}
        showBack
        rightContent={
          <View className="flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={confirmDelete}
              loading={deleteMutation.isPending}
              leftIcon={<Trash2 size={14} color="#ef4444" />}
              label="Delete"
            />
            <Button
              size="sm"
              onPress={handleSubmit((v) => saveMutation.mutate(v))}
              loading={saveMutation.isPending}
              label="Save"
            />
          </View>
        }
      />

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Reward Name"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="cost"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Cost (Channel Points)"
            value={String(value)}
            onChangeText={(v) => onChange(parseInt(v, 10) || 100)}
            keyboardType="numeric"
            error={errors.cost?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="prompt"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Prompt (optional)"
            value={value ?? ''}
            onChangeText={onChange}
            placeholder="What should viewers enter when redeeming?"
            multiline
            numberOfLines={2}
          />
        )}
      />

      <Card className="gap-4">
        <Controller
          control={control}
          name="isEnabled"
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Enabled"
              description="Reward is available for redemption"
              value={value}
              onValueChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="requiresInput"
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Requires User Input"
              description="Viewer must enter text when redeeming"
              value={value}
              onValueChange={onChange}
            />
          )}
        />
      </Card>

      <Card className="gap-4">
        <Text className="text-sm font-semibold text-white">Limits</Text>
        <Controller
          control={control}
          name="maxRedemptions"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Max redemptions (0 = unlimited)"
              value={value != null ? String(value) : ''}
              onChangeText={(v) => onChange(v ? parseInt(v, 10) || 0 : undefined)}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={control}
          name="cooldownSeconds"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Cooldown (seconds, 0 = none)"
              value={value != null ? String(value) : ''}
              onChangeText={(v) => onChange(v ? parseInt(v, 10) || 0 : undefined)}
              keyboardType="numeric"
            />
          )}
        />
      </Card>
    </ScrollView>
  )
}
