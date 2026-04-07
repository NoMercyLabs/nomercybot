import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/utils/cn'
import type { Toast as ToastType } from '@/stores/useNotificationStore'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native'

interface ToastProps {
  toast: ToastType
  onDismiss: (id: string) => void
}

const config = {
  success: { container: 'bg-green-900 border-green-700', icon: <CheckCircle size={16} color="rgb(134,239,172)" /> },
  error: { container: 'bg-red-900 border-red-700', icon: <XCircle size={16} color="rgb(252,165,165)" /> },
  warning: { container: 'bg-amber-900 border-amber-700', icon: <AlertTriangle size={16} color="rgb(252,211,77)" /> },
  info: { container: 'bg-blue-900 border-blue-700', icon: <Info size={16} color="rgb(147,197,253)" /> },
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const c = config[toast.type]
  return (
    <View
      className={cn('flex-row items-center gap-3 rounded-xl border p-4', c.container)}
      style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' } as any}
    >
      {c.icon}
      <Text className="flex-1 text-gray-100 text-sm">{toast.message}</Text>
      <Pressable onPress={() => onDismiss(toast.id)} className="p-0.5">
        <X size={14} color="rgb(156,163,175)" />
      </Pressable>
    </View>
  )
}
