import { useLocalSearchParams } from 'expo-router'
import { TimerDetailScreen } from '@/features/timers/screens/TimerDetailScreen'

export default function TimerDetailRoute() {
  const { timerId } = useLocalSearchParams<{ timerId: string }>()
  return <TimerDetailScreen timerId={timerId} />
}
