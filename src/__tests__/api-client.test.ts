import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EngramClient, EngramApiError } from '../api/client'

describe('EngramApiError', () => {
  it('sets name, message, statusCode, and response', () => {
    const err = new EngramApiError('not found', 404, { detail: 'missing' })
    expect(err.name).toBe('EngramApiError')
    expect(err.message).toBe('not found')
    expect(err.statusCode).toBe(404)
    expect(err.response).toEqual({ detail: 'missing' })
  })

  it('is an instance of Error', () => {
    const err = new EngramApiError('fail')
    expect(err).toBeInstanceOf(Error)
  })
})

describe('EngramClient', () => {
  let client: EngramClient
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    client = new EngramClient('http://test-api')
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockJsonResponse(data: unknown, status = 200) {
    fetchSpy.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(data),
    })
  }

  function mockNonJsonResponse(status = 204) {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status,
      statusText: 'No Content',
      headers: new Headers(),
      json: () => Promise.reject(new Error('no json')),
    })
  }

  describe('buildQueryString (via search)', () => {
    it('builds query params from search parameters', async () => {
      mockJsonResponse([])
      await client.search({ query: 'test', top_k: 5, content_type: 'youtube' })

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain('q=test')
      expect(url).toContain('top_k=5')
      expect(url).toContain('content_type=youtube')
    })

    it('omits undefined/null params', async () => {
      mockJsonResponse([])
      await client.search({ query: 'hello' })

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain('q=hello')
      expect(url).not.toContain('top_k')
      expect(url).not.toContain('content_type')
    })

    it('handles array params (tags)', async () => {
      mockJsonResponse([])
      await client.search({ query: 'test', tags: ['a', 'b'] })

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain('tags=a')
      expect(url).toContain('tags=b')
    })
  })

  describe('search', () => {
    it('calls GET /search with correct query params', async () => {
      const results = [{ content: {}, score: 0.9 }]
      mockJsonResponse(results)

      const data = await client.search({ query: 'machine learning', top_k: 10 })
      expect(data).toEqual(results)

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toBe('http://test-api/search?q=machine+learning&top_k=10')
    })
  })

  describe('searchSemantic', () => {
    it('calls POST /search/semantic with JSON body', async () => {
      mockJsonResponse([])
      await client.searchSemantic({ query: 'test', top_k: 5 })

      const [url, opts] = fetchSpy.mock.calls[0]
      expect(url).toBe('http://test-api/search/semantic')
      expect(opts.method).toBe('POST')
      expect(JSON.parse(opts.body)).toEqual({ query: 'test', top_k: 5 })
    })
  })

  describe('searchHybrid', () => {
    it('calls POST /search/hybrid with semantic_weight', async () => {
      mockJsonResponse([])
      await client.searchHybrid({ query: 'test', top_k: 5, semantic_weight: 0.7 })

      const [url, opts] = fetchSpy.mock.calls[0]
      expect(url).toBe('http://test-api/search/hybrid')
      expect(JSON.parse(opts.body)).toEqual({ query: 'test', top_k: 5, semantic_weight: 0.7 })
    })
  })

  describe('getContent', () => {
    it('calls GET /content/:id', async () => {
      const content = { id: '123', title: 'Test' }
      mockJsonResponse(content)

      const data = await client.getContent('abc-123')
      expect(data).toEqual(content)
      expect(fetchSpy.mock.calls[0][0]).toBe('http://test-api/content/abc-123')
    })
  })

  describe('listContent', () => {
    it('calls GET /content with filters', async () => {
      mockJsonResponse({ items: [], total: 0, limit: 50, offset: 0 })
      await client.listContent({ content_type: 'youtube', limit: 50, offset: 0 })

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain('content_type=youtube')
      expect(url).toContain('limit=50')
      expect(url).toContain('offset=0')
    })

    it('calls GET /content with no params when none given', async () => {
      mockJsonResponse({ items: [], total: 0, limit: 50, offset: 0 })
      await client.listContent()

      expect(fetchSpy.mock.calls[0][0]).toBe('http://test-api/content')
    })
  })

  describe('deleteContent', () => {
    it('calls DELETE /content/:id and handles empty response', async () => {
      mockNonJsonResponse(204)
      await client.deleteContent('abc-123')

      const [url, opts] = fetchSpy.mock.calls[0]
      expect(url).toBe('http://test-api/content/abc-123')
      expect(opts.method).toBe('DELETE')
    })
  })

  describe('getSources', () => {
    it('calls GET /content/sources with content_type param', async () => {
      const sources = { youtube: ['Author A', 'Author B'] }
      mockJsonResponse(sources)

      const data = await client.getSources('youtube')
      expect(data).toEqual(sources)

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain('content_type=youtube')
    })

    it('calls GET /content/sources without params when no type given', async () => {
      mockJsonResponse({})
      await client.getSources()

      expect(fetchSpy.mock.calls[0][0]).toBe('http://test-api/content/sources')
    })
  })

  describe('health', () => {
    it('calls GET /health', async () => {
      mockJsonResponse({ status: 'ok', version: '1.0.0' })
      const data = await client.health()

      expect(data).toEqual({ status: 'ok', version: '1.0.0' })
      expect(fetchSpy.mock.calls[0][0]).toBe('http://test-api/health')
    })
  })

  describe('error handling', () => {
    it('throws EngramApiError with message from response.message', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ message: 'Invalid query' }),
      })

      await expect(client.search({ query: 'test' })).rejects.toThrow(EngramApiError)
      await expect(
        client.search({ query: 'test' }).catch((e) => {
          throw e
        })
      ).rejects.toMatchObject({})

      // Re-test to actually inspect the error
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ message: 'Invalid query' }),
      })

      try {
        await client.search({ query: 'test' })
        expect.fail('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EngramApiError)
        expect((e as EngramApiError).message).toBe('Invalid query')
        expect((e as EngramApiError).statusCode).toBe(400)
      }
    })

    it('throws EngramApiError with detail string from response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ detail: 'Content not found' }),
      })

      try {
        await client.getContent('nonexistent')
        expect.fail('should have thrown')
      } catch (e) {
        expect((e as EngramApiError).message).toBe('Content not found')
      }
    })

    it('throws EngramApiError with joined detail array', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () =>
          Promise.resolve({
            detail: [
              { msg: 'field required', loc: ['body', 'query'] },
              { msg: 'invalid type', loc: ['body', 'top_k'] },
            ],
          }),
      })

      try {
        await client.searchSemantic({ query: '', top_k: -1 })
        expect.fail('should have thrown')
      } catch (e) {
        expect((e as EngramApiError).message).toBe('field required, invalid type')
      }
    })

    it('handles non-JSON error responses using statusText', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/plain' }),
        json: () => Promise.reject(new Error('not json')),
      })

      try {
        await client.health()
        expect.fail('should have thrown')
      } catch (e) {
        expect((e as EngramApiError).message).toBe('Internal Server Error')
        expect((e as EngramApiError).statusCode).toBe(500)
      }
    })

    it('wraps network errors in EngramApiError', async () => {
      fetchSpy.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      try {
        await client.health()
        expect.fail('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(EngramApiError)
        expect((e as EngramApiError).message).toBe('Network error: Failed to fetch')
        expect((e as EngramApiError).statusCode).toBeUndefined()
      }
    })
  })
})
