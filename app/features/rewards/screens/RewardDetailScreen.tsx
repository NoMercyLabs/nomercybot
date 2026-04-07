import { useState } from 'react'
import { View, Text, ScrollView, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useApiMutation } from '@/hooks/useApi'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Trash2, Save } from 'lucide-react-native'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

interface RewardDetail {
  id: string
  title: string
  cost: number
  enabled: boolean
  isPaused: boolean
  prompt: string | null
  cooldown: number | null
  maxPerStream: number | null
  maxPerUserPerStream: number | null
  redemptionCount: number
  backgroundColor: string | null
  userInputRequired: boolean
}

export function RewardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const channelId = useChannelStore((s) => s.currentChannel?.id)

  const { data, isLoading } = useQuery<RewardDetail>({
    queryKey: ['reward', channelId, id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: RewardDetail }>(
        `/v1/channels/${channelId}/rewards/${id}`,
      )
      return res.data.data
    },
    enabled: !!channelId && !!id,
  })

  const [title, setTitle] = useState('')
  const [cost, setCost] = useState('')
  const [prompt, setPrompt] = useState('')
  const [cooldown, setCooldown] = useState('')
  const [maxPerStream, setMaxPerStream] = useState('')
  const [maxPerUser, setMaxPerUser] = useState('')
  const [initialized, setInitialized] = useState(false)

  if (data && !initialized) {
    setTitle(data.title)
    setCost(String(data.cost))
    setPrompt(data.prompt ?? '')
    setCooldown(data.cooldown != null ? String(data.cooldown) : '')
    setMaxPerStream(data.maxPerStream != null ? String(data.maxPerStream) : '')
    setMaxPerUser(data.maxPerUserPerStream != null ? String(data.maxPerUserPerStream) : '')
    setInitialized(true)
  }

  const updateMutation = useApiMutation<RewardDetail, Partial<RewardDetail>>(
    `/rewards/${id}`,
    'patch',
    {
      invalidateKeys: ['rewards', `reward-${id}`],
      successMessage: 'Reward updated',
    },
  )

  const deleteMutation = useApiMutation<void, void>(
    `/rewards/${id}`,
    'delete',
    {
      invalidateKeys: ['rewards'],
      successMessage: 'Reward deleted',
      onSuccess: () => router.back(),
    },
  )

  function handleSave() {
    const costNum = parseInt(cost, 10)
    if (!title.trim() || isNaN(costNum) || costNum < 1) {
      Alert.alert('Validation', 'Title and a valid cost (min 1) are required.')
      return
    }

    updateMutation.mutate({
      title: title.trim(),
      cost: costNum,
      prompt: prompt.trim() || null,
      cooldown: cooldown ? parseInt(cooldown, 10) : null,
      maxPerStream: maxPerStream ? parseInt(maxPerStream, 10) : null,
      maxPerUserPerStream: maxPerUser ? parseInt(maxPerUser, 10) : null,
    })
  }

  function handleDelete() {
    Alert.alert(
      'Delete Reward',
      `Are you sure you want to delete "${data?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(),
        },
      ],
    )
  }

  return (
    <ErrorBoundary>
    <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <PageHeader title="Edit Reward" showBack />

      <View className="px-4 pt-4 gap-4">
        {isLoading ? (
          <Skeleton className="h-32 w-full" count={3} />
        ) : data ? (
          <>
            {/* Status */}
            <View className="flex-row gap-2">
              <Badge
                variant={data.enabled && !data.isPaused ? 'success' : 'muted'}
                label={data.isPaused ? 'Paused' : data.enabled ? 'Active' : 'Disabled'}
              />
              <Badge variant="secondary" label={`${data.redemptionCount.toLocaleString()} redeemed`} />
            </View>

            {/* Basic Info */}
            <Card>
              <CardHeader title="Reward Details" />
              <View className="px-4 py-4 gap-4">
                <Input
                  label="Title"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Reward title"
                  maxLength={45}
                />
                <Input
                  label="Cost (channel points)"
                  value={cost}
                  onChangeText={setCost}
                  placeholder="1"
                  keyboardType="numeric"
                />
                <Input
                  label="Prompt (optional)"
                  value={prompt}
                  onChangeText={setPrompt}
                  placeholder="Instructions for viewers"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </Card>

            {/* Limits */}
            <Card>
              <CardHeader title="Limits & Cooldowns" />
              <View className="px-4 py-4 gap-4">
                <Input
                  label="Cooldown (seconds, 0 = none)"
                  value={cooldown}
                  onChangeText={setCooldown}
                  placeholder="0"
                  keyboardType="numeric"
                />
                <Input
                  label="Max per stream (0 = unlimited)"
                  value={maxPerStream}
                  onChangeText={setMaxPerStream}
                  placeholder="0"
                  keyboardType="numeric"
                />
                <Input
                  label="Max per user per stream (0 = unlimited)"
                  value={maxPerUser}
                  onChangeText={setMaxPerUser}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </Card>

            {/* Actions */}
            <Button
              label="Save Changes"
              leftIcon={<Save size={16} color="white" />}
              loading={updateMutation.isPending}
              onPress={handleSave}
            />

            <Button
              label="Delete Reward"
              variant="danger"
              leftIcon={<Trash2 size={16} color="white" />}
              loading={deleteMutation.isPending}
              onPress={handleDelete}
            />
          </>
        ) : (
          <View className="py-8 items-center">
            <Text style={{ color: '#5a5b72' }}>Reward not found.</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </ErrorBoundary>
  )
}
