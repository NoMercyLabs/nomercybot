import { useState, useCallback } from 'react'
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native'
import { cn } from '@/lib/utils/cn'

const PRESET_COLORS = [
  '#9146FF', // Twitch purple
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ffffff', // White
  '#94a3b8', // Slate
  '#6b7280', // Gray
]

interface ColorPickerProps {
  value: string
  onValueChange: (color: string) => void
  label?: string
  className?: string
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}

export function ColorPicker({ value, onValueChange, label, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)
  const hsl = hexToHsl(value)

  const handleInputChange = useCallback((text: string) => {
    setInputValue(text)
    const normalized = text.startsWith('#') ? text : `#${text}`
    if (isValidHex(normalized)) {
      onValueChange(normalized)
    }
  }, [onValueChange])

  const handlePresetPress = useCallback((color: string) => {
    setInputValue(color)
    onValueChange(color)
  }, [onValueChange])

  return (
    <View className={cn('gap-2', className)}>
      {label && <Text className="text-sm font-medium" style={{ color: '#d1d5db' }}>{label}</Text>}

      {/* Current color preview */}
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 rounded-lg"
          style={{
            backgroundColor: isValidHex(value) ? value : '#9146FF',
            borderWidth: 1,
            borderColor: '#2a2b3a',
          }}
        />
        <TextInput
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="#9146FF"
          placeholderTextColor="#5a5b72"
          autoCapitalize="characters"
          maxLength={7}
          className="h-10 flex-1 rounded-md px-3 font-mono text-sm"
          style={{
            backgroundColor: '#16171f',
            borderWidth: 1,
            borderColor: '#2a2b3a',
            color: '#e5e7eb',
            outlineStyle: 'none',
          } as any}
        />
        {hsl && (
          <Text className="text-xs" style={{ color: '#6b7280' }}>
            {hsl.h}° {hsl.s}% {hsl.l}%
          </Text>
        )}
      </View>

      {/* Preset swatches */}
      <View className="flex-row flex-wrap gap-2">
        {PRESET_COLORS.map((color) => (
          <Pressable
            key={color}
            onPress={() => handlePresetPress(color)}
            className={cn(
              'h-8 w-8 rounded-md border-2',
              value.toLowerCase() === color.toLowerCase()
                ? 'border-white'
                : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
            accessibilityLabel={color}
          />
        ))}
      </View>
    </View>
  )
}
