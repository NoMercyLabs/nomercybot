import { View, Text, Pressable, Platform } from 'react-native'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null

  const dialog = (
    <View
      className="items-center justify-center p-6"
      style={{
        position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
      }}
    >
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={onCancel}
      />
      <View
        className="w-full max-w-sm rounded-2xl p-6 gap-4"
        style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
      >
        <View className="gap-2">
          <Text className="text-lg font-bold" style={{ color: '#f4f5fa' }}>{title}</Text>
          <Text style={{ color: '#8889a0' }}>{message}</Text>
        </View>
        <View className="flex-row gap-3">
          <Pressable
            onPress={onCancel}
            className="flex-1 rounded-xl py-3 items-center"
            style={{ borderWidth: 1, borderColor: '#2a2b3a' }}
          >
            <Text className="font-medium" style={{ color: '#d1d5db' }}>{cancelLabel}</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            className="flex-1 rounded-xl py-3 items-center"
            style={{ backgroundColor: variant === 'danger' ? '#b91c1c' : '#7C3AED' }}
          >
            <Text className="text-white font-medium">{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )

  return dialog
}
