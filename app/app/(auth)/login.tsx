import { View, Text, Pressable, Platform, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react-native'
import { TwitchLoginButton } from '@/features/auth/components/TwitchLoginButton'
import { useTwitchOAuth } from '@/features/auth/hooks/useTwitchOAuth'

const FEATURES = [
  '50+ built-in commands with custom pipeline builder',
  'Channel point rewards with TTS, songs, and effects',
  'Spotify integration, song requests, and queue management',
  'Progressive permissions — only request what you need',
]

const AVATARS = ['JD', 'AK', 'MR', 'TL', '+9']

const FOOTER_LINKS = ['Documentation', 'Privacy Policy', 'Terms of Service', 'Discord']

export default function LoginScreen() {
  const { login, isLoading, error } = useTwitchOAuth()
  const { t } = useTranslation('common')

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0b0f', overflow: 'hidden' }}>
      {/* Grid background — web only */}
      {Platform.OS === 'web' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.3,
            backgroundImage:
              'linear-gradient(#1e1f2a 1px, transparent 1px), linear-gradient(90deg, #1e1f2a 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          } as any}
        />
      )}

      {/* Purple radial glow — web only */}
      {Platform.OS === 'web' && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '-30%',
            left: '50%',
            width: 600,
            height: 600,
            transform: 'translateX(-50%)',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, hsla(264, 100%, 64%, 0.08) 0%, transparent 70%)',
          } as any}
        />
      )}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 440, alignItems: 'center' }}>
          {/* Logo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#7c3aed',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="m14 12-3.5 2V10z" />
              </svg>
            </View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#f4f5fa' }}>NoMercyBot</Text>
          </View>

          {/* Card */}
          <View
            style={{
              backgroundColor: '#111218',
              borderWidth: 1,
              borderColor: '#2a2b3a',
              borderRadius: 16,
              padding: 40,
              width: '100%',
              ...(Platform.OS === 'web'
                ? ({ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as any)
                : {}),
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#f4f5fa',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Add NoMercyBot to your channel
            </Text>
            <Text
              style={{
                color: '#8889a0',
                textAlign: 'center',
                marginBottom: 32,
                fontSize: 14,
                lineHeight: 21,
              }}
            >
              {t(
                'auth.loginSubtitle',
                'Powerful Twitch bot with custom commands, rewards, music, moderation, and more. Free to start.',
              )}
            </Text>

            <TwitchLoginButton onPress={login} isLoading={isLoading} />

            {error ? (
              <View
                style={{
                  marginTop: 12,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: 'rgba(239,68,68,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.3)',
                }}
              >
                <Text style={{ fontSize: 13, textAlign: 'center', color: '#f87171' }}>{error}</Text>
              </View>
            ) : null}

            {/* Feature checklist */}
            <View style={{ marginTop: 32, gap: 12 }}>
              {FEATURES.map((feature) => (
                <View
                  key={feature}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
                >
                  <View style={{ marginTop: 2, flexShrink: 0 }}>
                    <Check size={16} color="#a78bfa" />
                  </View>
                  <Text style={{ fontSize: 13, color: '#aaabbe', flex: 1 }}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Footer links inside card */}
            <View
              style={{
                marginTop: 32,
                flexDirection: 'row',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {FOOTER_LINKS.map((link) => (
                <Pressable key={link}>
                  <Text style={{ fontSize: 12, color: '#5a5b72' }}>{link}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Social proof */}
          <View style={{ marginTop: 48, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#5a5b72', marginBottom: 12 }}>
              Trusted by streamers
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {AVATARS.map((init, i) => (
                <View
                  key={init}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#2a2b3a',
                    borderWidth: 2,
                    borderColor: '#111218',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: i === 0 ? 0 : -6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#aaabbe' }}>{init}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: '#5a5b72', marginTop: 8 }}>
              Join 2,400+ streamers
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
