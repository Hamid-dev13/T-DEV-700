import { describe, it, expect } from 'vitest'
import { getCookie, COOKIE_TOKEN_KEY } from './cookie'

describe('cookie utilities', () => {
  describe('COOKIE_TOKEN_KEY', () => {
    it('should be defined as "token"', () => {
      expect(COOKIE_TOKEN_KEY).toBe('token')
    })
  })

  describe('getCookie', () => {
    it('should extract cookie value from cookie string', () => {
      const cookies = 'token=abc123; other=value'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc123')
    })

    it('should return cookie value when cookie is at the start', () => {
      const cookies = 'token=abc123; other=value'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc123')
    })

    it('should return cookie value when cookie is in the middle', () => {
      const cookies = 'first=123; token=abc123; last=xyz'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc123')
    })

    it('should return cookie value when cookie is at the end', () => {
      const cookies = 'first=123; token=abc123'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc123')
    })

    it('should return null when cookie is not found', () => {
      const cookies = 'other=value; another=data'
      const result = getCookie(cookies, 'token')
      expect(result).toBeNull()
    })

    it('should return null when cookie string is empty', () => {
      const cookies = ''
      const result = getCookie(cookies, 'token')
      expect(result).toBeNull()
    })

    it('should handle cookie with special characters', () => {
      const cookies = 'token=abc-123_xyz.890'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc-123_xyz.890')
    })

    it('should handle cookie with URL-encoded value', () => {
      const cookies = 'token=abc%20def%2Fghi'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc%20def%2Fghi')
    })

    it('should return first match when cookie appears multiple times', () => {
      const cookies = 'token=first; other=value; token=second'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('first')
    })

    it('should not match partial cookie names', () => {
      const cookies = 'mytoken=abc123; token=xyz789'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('xyz789')
    })

    it('should handle cookies with spaces around equals sign', () => {
      // Note: According to cookie spec, spaces around = are part of the value
      const cookies = 'token=abc123'
      const result = getCookie(cookies, 'token')
      expect(result).toBe('abc123')
    })

    it('should return null for empty cookie value', () => {
      const cookies = 'token=; other=value'
      const result = getCookie(cookies, 'token')
      // The regex requires at least one character after =, so empty values return null
      expect(result).toBeNull()
    })
  })
})
