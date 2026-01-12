import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import * as api from '../utils/api'

vi.mock('../utils/api')

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should provide auth context', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current).toBeDefined()
    expect(result.current.user).toBeNull()
  })

  it('should check authentication on mount', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', admin: true }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle login success for admin user', async () => {
    const mockUser = { id: '1', email: 'admin@example.com', admin: true }
    vi.mocked(api.getSession).mockResolvedValue(null)
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let loginResult
    await act(async () => {
      loginResult = await result.current.login('admin@example.com', 'password')
    })

    expect(loginResult.success).toBe(true)
  })

  it('should reject login for non-admin user', async () => {
    const mockUser = { id: '1', email: 'user@example.com', admin: false }
    vi.mocked(api.getSession).mockResolvedValue(null)
    vi.mocked(api.login).mockResolvedValue(mockUser)

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let loginResult
    await act(async () => {
      loginResult = await result.current.login('user@example.com', 'password')
    })

    expect(loginResult.success).toBe(false)
    expect(loginResult.error).toBe('Accès réservé aux administrateurs')
    expect(result.current.user).toBeNull()
  })


  it('should handle login error', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)
    vi.mocked(api.login).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let loginResult
    await act(async () => {
      loginResult = await result.current.login('admin@example.com', 'wrongpassword')
    })

    expect(loginResult.success).toBe(false)
    expect(loginResult.error).toContain('Network error')
  })

  it('should handle checkAuth error gracefully', async () => {
    vi.mocked(api.getSession).mockRejectedValue(new Error('Auth failed'))

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
  })

  it('should throw error when useAuth is used outside provider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})
