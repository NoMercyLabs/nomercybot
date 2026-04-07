import { Platform } from 'react-native'
import type { StateStorage } from 'zustand/middleware'

// Platform-aware storage: localStorage on web, SecureStore on native
// Uses dynamic import pattern to avoid bundling expo-secure-store on web

let _storage: StateStorage | null = null

function getStorage(): StateStorage {
  if (_storage) return _storage

  if (Platform.OS === 'web') {
    // Inline synchronous implementation for web
    _storage = {
      getItem: (name: string) => {
        try { return localStorage.getItem(name) } catch { return null }
      },
      setItem: (name: string, value: string) => {
        try { localStorage.setItem(name, value) } catch {}
      },
      removeItem: (name: string) => {
        try { localStorage.removeItem(name) } catch {}
      },
    }
  } else {
    // Native: async SecureStore
    _storage = {
      getItem: async (name: string) => {
        const SecureStore = await import('expo-secure-store')
        try { return await SecureStore.getItemAsync(name) } catch { return null }
      },
      setItem: async (name: string, value: string) => {
        const SecureStore = await import('expo-secure-store')
        try { await SecureStore.setItemAsync(name, value) } catch {}
      },
      removeItem: async (name: string) => {
        const SecureStore = await import('expo-secure-store')
        try { await SecureStore.deleteItemAsync(name) } catch {}
      },
    }
  }

  return _storage
}

export const appStorage: StateStorage = {
  getItem: (name) => getStorage().getItem(name),
  setItem: (name, value) => getStorage().setItem(name, value),
  removeItem: (name) => getStorage().removeItem(name),
}
