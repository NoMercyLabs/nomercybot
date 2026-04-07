import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadNamespace } from '@/lib/i18n/resources'
import i18n, { type SupportedLocale } from '@/lib/i18n'

type FeatureNamespace = 'commands' | 'dashboard' | 'pipelines' | 'settings' | 'chat' | 'music' | 'moderation' | 'rewards'

export function useFeatureTranslation(namespace: FeatureNamespace) {
  const [isLoaded, setIsLoaded] = useState(
    i18n.hasResourceBundle(i18n.language, namespace),
  )
  const { t, i18n: i18nInstance } = useTranslation(namespace)

  useEffect(() => {
    if (isLoaded) return

    loadNamespace(i18nInstance.language as SupportedLocale, namespace).then(() => {
      setIsLoaded(true)
    })
  }, [namespace, i18nInstance.language, isLoaded])

  return { t, isLoaded }
}
