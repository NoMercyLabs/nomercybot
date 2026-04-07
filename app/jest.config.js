/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/.expo/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lucide-react-native|nativewind|tailwind-merge|clsx)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Prevent Expo winter runtime lazy-require() calls from triggering Jest 30 sandbox errors
    '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
    '^expo/src/winter/(.*)$': '<rootDir>/__mocks__/expo-winter.js',
    // Prevent Expo's Web Streams polyfill from crashing when streams are cancelled during tests
    '^expo/virtual/streams$': '<rootDir>/__mocks__/expo-winter.js',
  },
  forceExit: true,
  collectCoverageFrom: [
    'stores/**/*.ts',
    'hooks/**/*.ts',
    'components/**/*.tsx',
    'lib/**/*.ts',
    'features/**/*.ts',
    'features/**/*.tsx',
    '!**/__tests__/**',
    '!**/*.d.ts',
  ],
}
