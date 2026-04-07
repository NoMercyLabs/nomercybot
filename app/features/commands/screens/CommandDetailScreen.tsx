import { View, ScrollView, Text } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/lib/api/client'
import { useChannelStore } from '@/stores/useChannelStore'
import { useFeatureTranslation } from '@/hooks/useFeatureTranslation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'

const commandSchema = z.object({
  name: z.string().min(1).startsWith('!'),
  response: z.string().min(1),
  cooldown: z.number().min(0).max(86400),
  userCooldown: z.number().min(0).max(86400),
  permission: z.enum(['everyone', 'subscriber', 'vip', 'moderator', 'broadcaster']),
  enabled: z.boolean(),
})

type CommandForm = z.infer<typeof commandSchema>

export function CommandDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>()
  const { t } = useFeatureTranslation('commands')
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const qc = useQueryClient()
  const isNew = name === 'new'

  const { data, isLoading } = useQuery({
    queryKey: ['commands', channelId, name],
    queryFn: () => apiClient.get(`/v1/channels/${channelId}/commands/${name}`).then((r) => r.data),
    enabled: !!channelId && !isNew,
  })

  const { control, handleSubmit, formState: { errors } } = useForm<CommandForm>({
    resolver: zodResolver(commandSchema),
    defaultValues: data ?? {
      name: '',
      response: '',
      cooldown: 0,
      userCooldown: 0,
      permission: 'everyone',
      enabled: true,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (values: CommandForm) =>
      isNew
        ? apiClient.post(`/v1/channels/${channelId}/commands`, values)
        : apiClient.put(`/v1/channels/${channelId}/commands/${name}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commands', channelId] })
      router.back()
    },
  })

  return (
    <ErrorBoundary>
    <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <PageHeader
        title={isNew ? 'New Command' : name}
        showBack
        rightContent={
          <Button
            size="sm"
            loading={saveMutation.isPending}
            onPress={handleSubmit((v) => saveMutation.mutate(v))}
          >
            {t('form.save')}
          </Button>
        }
      />

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Input
            label={t('form.name')}
            placeholder={t('form.namePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.name?.message}
            autoCapitalize="none"
          />
        )}
      />

      <Controller
        control={control}
        name="response"
        render={({ field }) => (
          <Input
            label={t('form.response')}
            placeholder={t('form.responsePlaceholder')}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.response?.message}
            multiline
            numberOfLines={3}
          />
        )}
      />

      <Controller
        control={control}
        name="permission"
        render={({ field }) => (
          <Select
            label={t('form.permission')}
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { label: t('permissions.everyone'), value: 'everyone' },
              { label: t('permissions.subscriber'), value: 'subscriber' },
              { label: t('permissions.vip'), value: 'vip' },
              { label: t('permissions.moderator'), value: 'moderator' },
              { label: t('permissions.broadcaster'), value: 'broadcaster' },
            ]}
          />
        )}
      />

      <View
        className="flex-row items-center justify-between rounded-lg px-4 py-3"
        style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
      >
        <Text className="text-sm" style={{ color: '#cdcede' }}>{t('form.enabled')}</Text>
        <Controller
          control={control}
          name="enabled"
          render={({ field }) => (
            <Toggle value={field.value} onValueChange={field.onChange} />
          )}
        />
      </View>
    </ScrollView>
    </ErrorBoundary>
  )
}
