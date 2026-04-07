import { ScrollView, View, Text } from 'react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { useApiQuery } from '@/hooks/useApi'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

interface CommandGroup {
  id: string
  name: string
  commandCount: number
}

export default function CommandGroupsScreen() {
  const { data: groups, isLoading } = useApiQuery<CommandGroup[]>('command-groups', '/commands/groups')

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#0a0b0f' }}>
      <PageHeader title="Command Groups" backHref="/(dashboard)/commands" />
      <View className="px-6 py-4 gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          : groups?.map((g) => (
              <Card key={g.id} className="flex-row items-center justify-between p-4">
                <Text className="font-medium" style={{ color: '#f4f5fa' }}>{g.name}</Text>
                <Text className="text-sm" style={{ color: '#8889a0' }}>{g.commandCount} commands</Text>
              </Card>
            ))}
      </View>
    </ScrollView>
  )
}
