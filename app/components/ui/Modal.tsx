import { Modal as RNModal, View, Text, Pressable, type ModalProps as RNModalProps } from 'react-native'
import { X } from 'lucide-react-native'

interface ModalProps extends RNModalProps {
  title?: string
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, onClose, children, visible, ...props }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <View className="flex-1 items-center justify-center bg-black/60 p-4">
        <View
          className="w-full max-w-md rounded-2xl"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
        >
          {title && (
            <View
              className="flex-row items-center justify-between px-6 py-4"
              style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a' }}
            >
              <Text className="text-lg font-semibold" style={{ color: '#f4f5fa' }}>{title}</Text>
              <Pressable onPress={onClose} className="p-1">
                <X size={20} color="#9ca3af" />
              </Pressable>
            </View>
          )}
          <View className="p-6">{children}</View>
        </View>
      </View>
    </RNModal>
  )
}
