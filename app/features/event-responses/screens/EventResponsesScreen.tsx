import { useState } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { useApiQuery } from '@/hooks/useApi'
import { useChannelStore } from '@/stores/useChannelStore'
import { useToast } from '@/hooks/useToast'
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout'
import { EventResponseCard } from '../components/EventResponseCard'
import { EventResponseModal } from '../components/EventResponseModal'
import { upsertEventResponse, fetchEventResponse } from '../api'
import { KNOWN_EVENT_TYPES, type EventResponseListItem, type EventResponseConfig, type UpdateEventResponseRequest } from '../types'

export function EventResponsesScreen() {
  const channelId = useChannelStore((s) => s.currentChannel?.id)
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading, isError, isRefetching, refetch } = useApiQuery<EventResponseListItem[]>(
    'event-responses',
    '/event-responses',
  )

  const timedOut = useLoadingTimeout(isLoading)
  const showSkeleton = isLoading && !isError && !timedOut

  const [modalEventType, setModalEventType] = useState<string | null>(null)
  const [modalConfig, setModalConfig] = useState<EventResponseConfig | null>(null)

  const configByType = new Map<string, EventResponseListItem>(
    (data ?? []).map((item) => [item.eventType, item]),
  )

  const enabledCount = (data ?? []).filter((r) => r.isEnabled).length

  async function handleConfigure(eventType: string) {
    if (!channelId) return
    try {
      const fullConfig = await fetchEventResponse(channelId, eventType)
      setModalConfig(fullConfig)
      setModalEventType(eventType)
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 404) {
        // Not yet configured — open modal with defaults
        setModalConfig({
          id: 0,
          eventType,
          isEnabled: true,
          responseType: 'none',
          message: null,
          pipelineJson: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        setModalEventType(eventType)
      } else {
        toast.error('Failed to load event response')
      }
    }
  }

  async function handleToggle(eventType: string, enabled: boolean) {
    if (!channelId) return
    try {
      await upsertEventResponse(channelId, eventType, { isEnabled: enabled })
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'event-responses'] })
    } catch {
      toast.error('Failed to update event response')
    }
  }

  async function handleSave(data: UpdateEventResponseRequest) {
    if (!channelId || !modalEventType) return
    try {
      await upsertEventResponse(channelId, modalEventType, data)
      queryClient.invalidateQueries({ queryKey: ['channel', channelId, 'event-responses'] })
      toast.success('Event response saved')
      setModalEventType(null)
      setModalConfig(null)
    } catch {
      toast.error('Failed to save event response')
    }
  }

  return (
    <ErrorBoundary>
      <View className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
        <PageHeader
          title="Event Responses"
          subtitle={`${enabledCount} active`}
        />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {showSkeleton ? (
            <View className="gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </View>
          ) : (
            KNOWN_EVENT_TYPES.map((event) => (
              <EventResponseCard
                key={event.eventType}
                eventType={event.eventType}
                config={configByType.get(event.eventType)}
                onConfigure={() => handleConfigure(event.eventType)}
                onToggle={(enabled) => handleToggle(event.eventType, enabled)}
              />
            ))
          )}
        </ScrollView>

        <EventResponseModal
          visible={modalEventType !== null}
          eventType={modalEventType ?? ''}
          config={modalConfig}
          onClose={() => { setModalEventType(null); setModalConfig(null) }}
          onSave={handleSave}
        />
      </View>
    </ErrorBoundary>
  )
}
