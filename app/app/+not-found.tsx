import { Link, Stack } from 'expo-router'
import { View, Text } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen() {
  const { t } = useTranslation('common')

  return (
    <>
      <Stack.Screen options={{ title: t('errors.notFound') }} />
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#0a0b0f' }}>
        <Text className="text-2xl font-bold mb-2" style={{ color: '#f4f5fa' }}>{t('errors.notFound')}</Text>
        <Text className="mb-6" style={{ color: '#8889a0' }}>{t('errors.notFoundMessage')}</Text>
        <Link href="/(dashboard)" style={{ color: '#a78bfa' }}>
          {t('errors.goHome')}
        </Link>
      </View>
    </>
  )
}
