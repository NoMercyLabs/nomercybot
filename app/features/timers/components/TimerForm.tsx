import { useState } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react-native'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Timer, TimerCreate, TimerUpdate } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  intervalMinutes: z.number().min(1, 'Minimum 1 minute').max(1440, 'Maximum 24 hours'),
  minChatActivity: z.number().min(0).max(10000),
  isEnabled: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface TimerFormProps {
  timer?: Timer
  onSubmit: (data: TimerCreate | TimerUpdate) => Promise<unknown>
  isSubmitting?: boolean
}

export function TimerForm({ timer, onSubmit, isSubmitting }: TimerFormProps) {
  const [messages, setMessages] = useState<string[]>(
    timer?.messages?.length ? timer.messages : [''],
  )

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: timer?.name ?? '',
      intervalMinutes: timer?.intervalMinutes ?? 30,
      minChatActivity: timer?.minChatActivity ?? 0,
      isEnabled: timer?.isEnabled ?? true,
    },
  })

  function addMessage() {
    setMessages((prev) => [...prev, ''])
  }

  function removeMessage(index: number) {
    setMessages((prev) => prev.filter((_, i) => i !== index))
  }

  function updateMessage(index: number, value: string) {
    setMessages((prev) => prev.map((m, i) => (i === index ? value : m)))
  }

  async function handleFormSubmit(data: FormData) {
    const filtered = messages.filter((m) => m.trim().length > 0)
    if (filtered.length === 0) return
    await onSubmit({ ...data, messages: filtered })
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Timer Name"
              placeholder="e.g. Social Links"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        {/* Messages */}
        <View className="gap-2">
          <Text className="text-sm font-medium" style={{ color: '#cdcede' }}>Messages</Text>
          <Text className="text-xs" style={{ color: '#8889a0' }}>
            The bot will cycle through these messages in order.
          </Text>
          {messages.map((msg, index) => (
            <View key={index} className="flex-row items-start gap-2">
              <View className="flex-1">
                <Textarea
                  placeholder={`Message ${index + 1}...`}
                  value={msg}
                  onChangeText={(v) => updateMessage(index, v)}
                  rows={2}
                />
              </View>
              {messages.length > 1 && (
                <Pressable
                  onPress={() => removeMessage(index)}
                  className="mt-1 rounded-md p-2"
                >
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              )}
            </View>
          ))}
          {messages.filter((m) => m.trim()).length === 0 && (
            <Text className="text-xs text-red-400">Add at least one message</Text>
          )}
          <Button
            variant="ghost"
            size="sm"
            onPress={addMessage}
            leftIcon={<Plus size={14} color="#8889a0" />}
            label="Add Message"
          />
        </View>

        <Card className="gap-4">
          <Text className="text-sm font-semibold" style={{ color: '#cdcede' }}>Schedule</Text>

          <Controller
            control={control}
            name="intervalMinutes"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Interval (minutes)"
                placeholder="30"
                value={String(value)}
                onChangeText={(v) => onChange(parseInt(v, 10) || 1)}
                keyboardType="numeric"
                error={errors.intervalMinutes?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="minChatActivity"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Minimum chat lines"
                placeholder="0"
                value={String(value)}
                onChangeText={(v) => onChange(parseInt(v, 10) || 0)}
                keyboardType="numeric"
              />
            )}
          />
        </Card>

        <Controller
          control={control}
          name="isEnabled"
          render={({ field: { onChange, value } }) => (
            <Toggle
              label="Enabled"
              description="Timer will post messages automatically"
              value={value}
              onValueChange={onChange}
            />
          )}
        />

        <Button
          label={isSubmitting ? 'Saving...' : 'Save Timer'}
          onPress={handleSubmit(handleFormSubmit)}
          loading={isSubmitting}
          className="mt-2"
        />
      </View>
    </ScrollView>
  )
}
