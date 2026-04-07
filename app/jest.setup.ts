import '@testing-library/react-native/extend-expect'

// Polyfill crypto.randomUUID for the test environment
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  let counter = 0
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => `test-uuid-${++counter}`,
    },
    configurable: true,
  })
}

// Override Expo's __ExpoImportMetaRegistry lazy getter to prevent Jest 30
// sandbox errors (jest-expo installs a lazy require() getter which Jest 30
// blocks when called outside the original module execution scope).
Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
  value: {
    get: (_key: string) => ({ url: '', env: {} }),
    set: () => {},
    delete: () => {},
  },
  configurable: true,
  writable: true,
})

// Silence noisy console output during tests
jest.spyOn(console, 'log').mockImplementation(() => {})
jest.spyOn(console, 'warn').mockImplementation(() => {})
