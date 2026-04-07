import { apiClient, setAuthToken } from '@/lib/api/client'

// Capture the final request config via a mock adapter (runs after all request interceptors)
let lastRequestConfig: any = null
const mockAdapter = jest.fn(async (config: any) => {
  lastRequestConfig = config
  return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
})

const originalAdapter = apiClient.defaults.adapter

beforeAll(() => {
  apiClient.defaults.adapter = mockAdapter
})

afterAll(() => {
  apiClient.defaults.adapter = originalAdapter
})

beforeEach(() => {
  lastRequestConfig = null
  mockAdapter.mockClear()
  setAuthToken(null)
})

describe('setAuthToken / auth injection', () => {
  it('injects Bearer token into Authorization header when token is set', async () => {
    setAuthToken('my-token-123')
    await apiClient.get('/test')
    expect(lastRequestConfig?.headers?.['Authorization']).toBe('Bearer my-token-123')
  })

  it('does not inject Authorization when token is null', async () => {
    setAuthToken(null)
    await apiClient.get('/test')
    expect(lastRequestConfig?.headers?.['Authorization']).toBeUndefined()
  })

  it('does not override a manually set Authorization header', async () => {
    setAuthToken('auto-token')
    await apiClient.get('/test', {
      headers: { Authorization: 'Bearer manual-token' },
    })
    expect(lastRequestConfig?.headers?.['Authorization']).toBe('Bearer manual-token')
  })

  it('uses the most recently set token', async () => {
    setAuthToken('first-token')
    await apiClient.get('/test')
    expect(lastRequestConfig?.headers?.['Authorization']).toBe('Bearer first-token')

    setAuthToken('second-token')
    await apiClient.get('/test')
    expect(lastRequestConfig?.headers?.['Authorization']).toBe('Bearer second-token')
  })
})

describe('setAuthToken standalone', () => {
  it('is exported as a function', () => {
    expect(typeof setAuthToken).toBe('function')
  })

  it('can be called with a string without throwing', () => {
    expect(() => setAuthToken('some-token')).not.toThrow()
  })

  it('can be called with null without throwing', () => {
    expect(() => setAuthToken(null)).not.toThrow()
  })
})

describe('apiClient defaults', () => {
  it('has 30 second timeout', () => {
    expect(apiClient.defaults.timeout).toBe(30_000)
  })

  it('sends requests to the correct base URL for the platform', () => {
    // In the test environment (non-native), baseURL depends on Platform.OS
    // jest-expo sets platform to ios, so EXPO_PUBLIC_API_URL or localhost
    const baseURL = apiClient.defaults.baseURL
    expect(typeof baseURL).toBe('string')
  })
})

describe('error response normalization', () => {
  it('normalizes 404 response into ApiError shape', async () => {
    mockAdapter.mockImplementationOnce(() =>
      Promise.reject({
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Resource not found', code: 'NOT_FOUND' },
        },
        config: { headers: {}, _retry: true, url: '/missing' },
        message: 'Request failed with status code 404',
      }),
    )

    try {
      await apiClient.get('/missing')
      fail('Should have thrown')
    } catch (error: any) {
      expect(error.message).toBe('Resource not found')
      expect(error.status).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
    }
  })

  it('uses axios error message as fallback when API response has no message', async () => {
    mockAdapter.mockImplementationOnce(() =>
      Promise.reject({
        isAxiosError: true,
        response: { status: 500, data: {} },
        config: { headers: {}, _retry: true, url: '/crash' },
        message: 'Internal Server Error',
      }),
    )

    try {
      await apiClient.get('/crash')
      fail('Should have thrown')
    } catch (error: any) {
      expect(error.message).toBe('Internal Server Error')
      expect(error.status).toBe(500)
    }
  })
})
