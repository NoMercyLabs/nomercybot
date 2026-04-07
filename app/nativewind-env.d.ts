/// <reference types="nativewind/types" />

// Augment React Native props to include NativeWind v5 className props
import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }
  interface TextProps {
    className?: string
  }
  interface ImageProps {
    className?: string
  }
  interface ScrollViewProps {
    className?: string
    contentContainerClassName?: string
  }
  interface FlatListProps<ItemT> {
    className?: string
    contentContainerClassName?: string
  }
  interface TextInputProps {
    className?: string
  }
  interface PressableProps {
    className?: string
  }
  interface TouchableOpacityProps {
    className?: string
  }
}
