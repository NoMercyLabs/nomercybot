import React from 'react'
import { render } from '@testing-library/react-native'
import { Skeleton } from '@/components/ui/Skeleton'

// Mock Animated to prevent native driver warnings in tests
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native')
  RN.Animated.loop = jest.fn().mockReturnValue({ start: jest.fn(), stop: jest.fn() })
  RN.Animated.sequence = jest.fn().mockReturnValue({})
  RN.Animated.timing = jest.fn().mockReturnValue({})
  return RN
})

describe('Skeleton', () => {
  it('renders without crashing with default props', () => {
    expect(() => render(<Skeleton />)).not.toThrow()
  })

  it('renders without crashing with count=3', () => {
    expect(() => render(<Skeleton count={3} />)).not.toThrow()
  })

  it('renders without crashing with a className', () => {
    expect(() => render(<Skeleton className="h-4 w-full" count={2} />)).not.toThrow()
  })
})
