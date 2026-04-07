import { FlatList, View, Text, Pressable } from 'react-native'
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
      <View className="gap-3 px-4">
        <Skeleton className="h-20 w-full" count={4} />
      </View>
    )
  }

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      className={className}
      contentContainerClassName="gap-2 px-4"
      ListEmptyComponent={
        <View className="py-12 items-center">
          <Text className="text-gray-500">{emptyMessage}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onRowPress?.(item)}
          className="rounded-xl p-4 gap-2"
          style={{ backgroundColor: '#16171f', borderWidth: 1, borderColor: '#2a2b3a' }}
        >
          {columns.slice(0, 3).map((col) => {
            const value = (item as any)[col.key]
            return (
              <View key={col.key} className="flex-row justify-between">
                <Text className="text-xs text-gray-500">{col.title}</Text>
                <View>
                  {col.render ? (
                    col.render(value, item)
                  ) : (
                    <Text className="text-sm text-gray-200">{String(value ?? '')}</Text>
                  )}
                </View>
              </View>
            )
          })}
        </Pressable>
      )}
    />
  )
}
