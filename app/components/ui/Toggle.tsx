import { Pressable, View, Text, Platform } from 'react-native'
import { Switch } from 'react-native'

interface ToggleProps {
  value: boolean
  onValueChange: (value: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

/** Web-friendly toggle — RN Switch renders double-circle on web */
function WebToggle({ value, onValueChange, disabled }: Pick<ToggleProps, 'value' | 'onValueChange' | 'disabled'>) {
  const handleClick = () => {
    if (!disabled) onValueChange(!value)
  }

  return (
    <div
      onClick={handleClick}
      role="switch"
      aria-checked={value}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: value ? 'rgb(109, 40, 217)' : 'rgb(55, 65, 81)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 2,
        paddingRight: 2,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: value ? 'rgb(167, 139, 250)' : 'rgb(156, 163, 175)',
          marginLeft: value ? 'auto' : 0,
          transition: 'all 0.2s ease',
        }}
      />
    </div>
  )
}

export function Toggle({ value, onValueChange, label, description, disabled }: ToggleProps) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      {(label || description) && (
        <View className="flex-1 gap-0.5">
          {label && <Text className="text-gray-200 font-medium">{label}</Text>}
          {description && <Text className="text-sm text-gray-500">{description}</Text>}
        </View>
      )}
      {Platform.OS === 'web' ? (
        <WebToggle value={value} onValueChange={onValueChange} disabled={disabled} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: 'rgb(55, 65, 81)', true: 'rgb(109, 40, 217)' }}
          thumbColor={value ? 'rgb(167, 139, 250)' : 'rgb(156, 163, 175)'}
        />
      )}
    </View>
  )
}
