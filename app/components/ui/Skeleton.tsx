import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 700, useNativeDriver: false }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: false }),
      ]),
    ).start()
  }, [opacity])

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={{ opacity, backgroundColor: '#1e1f2a' }}
          className={cn('rounded-lg', className)}
        />
      ))}
    </>
  )
}
