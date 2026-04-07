import { useState, useEffect } from 'react'
import { Dimensions, Platform } from 'react-native'
import * as Device from 'expo-device'

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  return 'sm'
}

function getWindowWidth(): number {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.innerWidth
  }
  return Dimensions.get('window').width
}

export function useBreakpoint() {
  const [width, setWidth] = useState(getWindowWidth)
  const breakpoint = getBreakpoint(width)

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResize = () => setWidth(window.innerWidth)
      window.addEventListener('resize', handleResize)
      // Sync in case width changed between first render and effect
      handleResize()
      return () => window.removeEventListener('resize', handleResize)
    }
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWidth(window.width)
    })
    return () => subscription.remove()
  }, [])

  // Breakpoints are width-based across all platforms.
  // isDesktop must NOT default to true on web — a 360px Android browser is not a desktop.
  const isTablet =
    (Device.deviceType === Device.DeviceType.TABLET) ||
    (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg)

  const isDesktop = width >= BREAKPOINTS.lg

  const isPhone = !isTablet && !isDesktop

  return {
    width,
    breakpoint,
    isPhone,
    isTablet,
    isDesktop,
    isAtLeast: (bp: Breakpoint) => width >= BREAKPOINTS[bp],
  }
}
