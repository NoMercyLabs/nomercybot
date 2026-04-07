import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useApiQuery } from '@/hooks/useApi'
import type { PipelineListItem } from '@/types/pipeline'
import { KNOWN_EVENT_TYPES, type EventResponseConfig, type EventResponseType, type UpdateEventResponseRequest } from '../types'

interface EventResponseModalProps {
  visible: boolean
  eventType: string
  config: EventResponseConfig | null
  onClose: () => void
  onSave: (data: UpdateEventResponseRequest) => Promise<void>
}

const RESPONSE_TYPE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Chat Message', value: 'chat_message' },
  { label: 'Pipeline', value: 'pipeline' },
  { label: 'Overlay', value: 'overlay' },
]

export function EventResponseModal({ visible, eventType, config, onClose, onSave }: EventResponseModalProps) {
  const known = KNOWN_EVENT_TYPES.find((e) => e.eventType === eventType)
  const label = known?.label ?? eventType

  const [responseType, setResponseType] = useState<EventResponseType>(config?.responseType ?? 'none')
  const [message, setMessage] = useState(config?.message ?? '')
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const { data: pipelinesData, isLoading: pipelinesLoading } = useApiQuery<PipelineListItem[]>(
    'pipelines',
    '/pipelines',
    { enabled: visible && responseType === 'pipeline' },
  )

  // Sync state when config/eventType changes (modal re-opened for a different event)
  useEffect(() => {
    setResponseType(config?.responseType ?? 'none')
    setMessage(config?.message ?? '')

    if (config?.pipelineJson) {
      try {
        const parsed = JSON.parse(config.pipelineJson) as { id?: number }
        setSelectedPipelineId(parsed.id != null ? String(parsed.id) : '')
      } catch {
        setSelectedPipelineId('')
      }
    } else {
      setSelectedPipelineId('')
    }
  }, [config, eventType])

  const pipelineOptions = (pipelinesData ?? []).map((p) => ({
    label: p.name,
    value: String(p.id),
  }))

  async function handleSave() {
    const payload: UpdateEventResponseRequest = { responseType }

    if (responseType === 'chat_message') {
      payload.message = message
    }

    if (responseType === 'pipeline' && selectedPipelineId) {
      payload.pipelineJson = JSON.stringify({ id: Number(selectedPipelineId) })
    }

    setIsSaving(true)
    try {
      await onSave(payload)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal visible={visible} title={`Configure: ${label}`} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
        <View className="gap-4">
          <Select
            label="Response Type"
            value={responseType}
            onValueChange={(v) => setResponseType(v as EventResponseType)}
            options={RESPONSE_TYPE_OPTIONS}
          />

          {responseType === 'chat_message' && (
            <View className="gap-2">
              <Input
                label="Message"
                value={message}
                onChangeText={setMessage}
                placeholder="Hello {user}, welcome to {channel}!"
                multiline
                numberOfLines={3}
              />
              <Text className="text-xs" style={{ color: '#8889a0' }}>
                Available variables: {'{user}'}, {'{channel}'}, {'{count}'}
              </Text>
            </View>
          )}

          {responseType === 'pipeline' && (
            pipelinesLoading ? (
              <View className="flex-row items-center gap-2 py-2">
                <ActivityIndicator size="small" color="rgb(156,163,175)" />
                <Text className="text-sm" style={{ color: '#8889a0' }}>Loading pipelines...</Text>
              </View>
            ) : (
              <Select
                label="Pipeline"
                value={selectedPipelineId}
                onValueChange={setSelectedPipelineId}
                options={pipelineOptions}
                placeholder="Select a pipeline..."
              />
            )
          )}

          {responseType === 'none' && (
            <Text className="text-sm" style={{ color: '#8889a0' }}>
              No response will be sent for this event.
            </Text>
          )}

          {responseType === 'overlay' && (
            <Text className="text-sm" style={{ color: '#8889a0' }}>
              Overlay response will use the default overlay configuration.
            </Text>
          )}

          <View className="flex-row gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={onClose}
              className="flex-1"
              label="Cancel"
            />
            <Button
              variant="primary"
              size="sm"
              onPress={handleSave}
              loading={isSaving}
              className="flex-1"
              label="Save"
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  )
}
