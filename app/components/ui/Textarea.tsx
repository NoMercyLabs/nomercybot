import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { cn } from '@/lib/utils/cn'

interface TextareaProps extends TextInputProps {
  label?: string
  error?: string
  rows?: number
  className?: string
}

export function Textarea({ label, error, rows = 4, className, ...props }: TextareaProps) {
  return (
    <View className="gap-1.5">
      {label && <Text className="text-sm font-medium" style={{ color: '#d1d5db' }}>{label}</Text>}
      <TextInput
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        className={cn(
          'rounded-lg px-4 py-3',
          error ? 'border-red-500' : 'border-[#2a2b3a]',
          'border',
          className,
        )}
        style={{ backgroundColor: '#16171f', color: '#f4f5fa', outlineStyle: 'none' } as any}
        placeholderTextColor="#3a3b4f"
        {...props}
      />
      {error && <Text className="text-xs text-red-400">{error}</Text>}
    </View>
  )
}
