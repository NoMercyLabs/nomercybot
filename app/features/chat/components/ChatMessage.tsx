import { View, Text, Image } from 'react-native'
import type { ChatMessagePayload } from '@/types/signalr'

const EMOTE_CDN = 'https://static-cdn.jtvnw.net/emoticons/v2'

// Twitch cheermote tier colors (tier 1-5)
const CHEER_TIER_COLORS: Record<number, string> = {
  1: '#979797',
  2: '#9c3ee8',
  3: '#1db954',
  4: '#0099fe',
  5: '#f43021',
}

function getCheermoteColor(tier: number): string {
  return CHEER_TIER_COLORS[tier] ?? CHEER_TIER_COLORS[1]
}

interface ChatMessageProps {
  message: ChatMessagePayload
  isDeleted?: boolean
}

export function ChatMessage({ message, isDeleted }: ChatMessageProps) {
  if (isDeleted) {
    return (
      <View className="flex-row py-0.5 px-2">
        <Text className="text-xs italic" style={{ color: '#5a5b72' }}>[message deleted]</Text>
      </View>
    )
  }

  // Fall back to a single text fragment if none provided
  const fragments =
    message.fragments?.length
      ? message.fragments
      : [{ type: 'text' as const, text: message.message }]

  return (
    <View className="flex-row flex-wrap py-0.5 items-center gap-0.5">
      <Text
        style={{ color: message.color || '#a855f7' }}
        className="font-semibold text-xs"
      >
        {message.displayName}
        <Text className="font-normal" style={{ color: '#8889a0' }}>: </Text>
      </Text>
      {fragments.map((frag, i) => {
        switch (frag.type) {
          case 'emote': {
            if (!frag.emote?.id) {
              return (
                <Text key={i} className="text-xs text-white">
                  {frag.text}
                </Text>
              )
            }
            const cdnFormat = frag.emote.format === 'animated' ? 'animated' : 'default'
            const scale = frag.emote.scale ?? '1.0'
            const uri = `${EMOTE_CDN}/${frag.emote.id}/${cdnFormat}/dark/${scale}`
            return (
              <Image
                key={i}
                source={{ uri }}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
                accessibilityLabel={frag.text}
              />
            )
          }

          case 'mention':
            return (
              <Text key={i} className="text-xs font-semibold" style={{ color: '#a855f7' }}>
                {frag.text}
              </Text>
            )

          case 'cheermote': {
            const color = frag.cheermote?.color ?? getCheermoteColor(frag.cheermote?.tier ?? 1)
            return (
              <Text key={i} className="text-xs font-bold" style={{ color }}>
                {frag.cheermote?.prefix}{frag.cheermote?.bits}
              </Text>
            )
          }

          default:
            return (
              <Text key={i} className="text-xs text-white">
                {frag.text}
              </Text>
            )
        }
      })}
    </View>
  )
}
