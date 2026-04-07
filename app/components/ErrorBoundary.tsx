import { Component, type ReactNode } from 'react'
import { View, Text, Pressable } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    }
  }

  reset = () => {
    this.setState({ hasError: false, message: '' })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <View
          className="flex-1 items-center justify-center px-8 gap-4"
          style={{ backgroundColor: '#0a0b0f' }}
        >
          <View
            className="h-14 w-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
          >
            <AlertTriangle size={28} color="#ef4444" />
          </View>
          <Text className="text-lg font-bold" style={{ color: '#f4f5fa' }}>Something went wrong</Text>
          <Text className="text-sm text-center leading-5" style={{ color: '#6b7280' }}>{this.state.message}</Text>
          <Pressable
            onPress={this.reset}
            className="mt-2 rounded-xl px-6 py-3"
            style={{ backgroundColor: '#7C3AED' }}
          >
            <Text className="text-white font-semibold">Try again</Text>
          </Pressable>
        </View>
      )
    }

    return this.props.children
  }
}
