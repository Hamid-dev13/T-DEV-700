import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set environment variable before importing
process.env.VITE_API_URL = 'http://localhost:3000'

import { api } from './apiClient'

// Mock fetch globally
global.fetch = vi.fn()

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('api.get', () => {
    it('should make GET request with correct parameters', async () => {
      const mockResponse = { data: 'test' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
        text: async () => JSON.stringify(mockResponse)
      } as Response)

      const result = await api.get('/test')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include'
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle query parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}'
      } as Response)

      await api.get('/test', { query: { foo: 'bar', baz: 123 } })

      const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as URL
      expect(callUrl.searchParams.get('foo')).toBe('bar')
      expect(callUrl.searchParams.get('baz')).toBe('123')
    })

    it('should skip undefined and null query parameters', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}'
      } as Response)

      await api.get('/test', { query: { foo: 'bar', skip: undefined, none: null } })

      const callUrl = vi.mocked(global.fetch).mock.calls[0][0] as URL
      expect(callUrl.searchParams.get('foo')).toBe('bar')
      expect(callUrl.searchParams.has('skip')).toBe(false)
      expect(callUrl.searchParams.has('none')).toBe(false)
    })
  })

  describe('api.post', () => {
    it('should make POST request with payload', async () => {
      const mockPayload = { name: 'test' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
        text: async () => '{"success":true}'
      } as Response)

      await api.post('/test', mockPayload)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(mockPayload)
        })
      )
    })
  })

  describe('api.put', () => {
    it('should make PUT request with payload', async () => {
      const mockPayload = { name: 'updated' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
        text: async () => '{"success":true}'
      } as Response)

      await api.put('/test', mockPayload)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockPayload)
        })
      )
    })
  })

  describe('api.patch', () => {
    it('should make PATCH request with payload', async () => {
      const mockPayload = { status: 'active' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true }),
        text: async () => '{"success":true}'
      } as Response)

      await api.patch('/test', mockPayload)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(mockPayload)
        })
      )
    })
  })

  describe('api.delete', () => {
    it('should make DELETE request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: async () => null
      } as Response)

      await api.delete('/test/123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  describe('error handling', () => {
    it('should throw error with code 401 for unauthorized', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers()
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'UNAUTHORIZED',
        status: 401
      })
    })

    it('should throw error with code 403 for forbidden', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers()
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'FORBIDDEN',
        status: 403
      })
    })

    it('should extract error message from JSON response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Bad request' })
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'Bad request',
        status: 400
      })
    })

    it('should extract error message from message field in JSON', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Validation error' })
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'Validation error',
        status: 400
      })
    })

    it('should extract error from text response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal server error'
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'Internal server error',
        status: 500
      })
    })

    it('should use generic error message when no content', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: async () => '',
        json: async () => { throw new Error('Not JSON') },
        blob: async () => new Blob(),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => new FormData(),
        bytes: async () => new Uint8Array(),
        clone: vi.fn(),
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic',
        url: 'http://localhost:3000/test'
      } as Response)

      await expect(api.get('/test')).rejects.toMatchObject({
        message: 'HTTP 500',
        status: 500
      })
    })
  })

  describe('response parsing', () => {
    it('should parse JSON response', async () => {
      const mockData = { id: 1, name: 'test' }
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
        text: async () => JSON.stringify(mockData)
      } as Response)

      const result = await api.get('/test')
      expect(result).toEqual(mockData)
    })

    it('should parse text response', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'plain text response'
      } as Response)

      const result = await api.get('/test')
      expect(result).toBe('plain text response')
    })

    it('should return null for non-JSON/text responses', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/octet-stream' })
      } as Response)

      const result = await api.get('/test')
      expect(result).toBeNull()
    })
  })

  describe('custom headers', () => {
    it('should include custom headers in request', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}'
      } as Response)

      await api.get('/test', { headers: { 'X-Custom-Header': 'value' } })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(URL),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value'
          })
        })
      )
    })
  })
})
