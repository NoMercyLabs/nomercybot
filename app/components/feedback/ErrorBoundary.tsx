import { Component, type ReactNode } from 'react'
import { View, Text, Pressable } from 'react-native'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <View
          className="flex-1 items-center justify-center p-8 gap-4"
          style={{ backgroundColor: '#0a0b0f' }}
        >
          <Text className="text-xl font-bold" style={{ color: '#f4f5fa' }}>Something went wrong</Text>
          <Text className="text-center text-sm" style={{ color: '#8889a0' }}>
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            className="rounded-lg px-6 py-3"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </Pressable>
        </View>
      )
    }
    return this.props.children
  }
}
