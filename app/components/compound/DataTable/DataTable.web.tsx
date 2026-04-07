import { View, Text, Pressable, ScrollView, type ViewStyle } from 'react-native'
import { cn } from '@/lib/utils/cn'
import { Skeleton } from '@/components/ui/Skeleton'
import type { DataTableProps } from './types'

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  isLoading,
  emptyMessage = 'No results found',
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <View className="gap-2">
        <Skeleton className="h-10 w-full" count={5} />
      </View>
    )
  }

  return (
    <ScrollView horizontal className={cn('', className)}>
      <View className="min-w-full">
        {/* Header */}
        <View className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: '#2a2b3a', backgroundColor: '#1e1f2a' }}>
          {columns.map((col) => (
            <View
              key={col.key}
              className="px-4 py-3"
              style={col.width != null ? ({ width: col.width } as ViewStyle) : { flex: 1 }}
            >
              <Text className="text-xs font-semibold uppercase tracking-wide text-gray-500">{col.title}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {data.length === 0 ? (
          <View className="py-12 items-center">
            <Text className="text-gray-500">{emptyMessage}</Text>
          </View>
        ) : (
          data.map((row) => (
            <Pressable
              key={keyExtractor(row)}
              onPress={() => onRowPress?.(row)}
              className="flex-row border-b border-gray-800/50 hover:bg-gray-800/30 active:bg-gray-800/50"
            >
              {columns.map((col) => {
                const value = (row as any)[col.key]
                return (
                  <View
                    key={col.key}
                    className="px-4 py-3.5"
                    style={col.width != null ? ({ width: col.width } as ViewStyle) : { flex: 1 }}
                  >
                    {col.render ? (
                      col.render(value, row)
                    ) : (
                      <Text className="text-sm text-gray-200">{String(value ?? '')}</Text>
                    )}
                  </View>
                )
              })}
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  )
}
