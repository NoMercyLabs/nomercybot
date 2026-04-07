import { View } from 'react-native'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { Toast } from '@/components/ui/Toast'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toasts, removeToast } = useNotificationStore()
  const insets = useSafeAreaInsets()

  return (
    <View className="flex-1">
      {children}
      <View
        className="absolute left-4 right-4 gap-2 z-50"
        style={{ bottom: insets.bottom + 16, pointerEvents: 'box-none' }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </View>
    </View>
  )
}
