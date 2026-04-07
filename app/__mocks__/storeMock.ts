// In-memory storage mock for Zustand persist middleware
const store: Record<string, string> = {}

export const mockStorage = {
  getItem: jest.fn((name: string) => store[name] ?? null),
  setItem: jest.fn((name: string, value: string) => { store[name] = value }),
  removeItem: jest.fn((name: string) => { delete store[name] }),
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
}
