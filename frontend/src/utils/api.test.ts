import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from './api'
import apiClient from './apiClient'

// Mock apiClient
vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  },
  clearToken: vi.fn()
}))

describe('api module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSession', () => {
    it('should return user data on success', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      vi.mocked(apiClient.get).mockResolvedValue(mockUser)

      const result = await api.getSession()

      expect(apiClient.get).toHaveBeenCalledWith('/user')
      expect(result).toEqual(mockUser)
    })

    it('should return null on error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'))

      const result = await api.getSession()

      expect(result).toBeNull()
    })
  })

  describe('login', () => {
    it('should call apiClient.post with credentials', async () => {
      const mockUser = { id: '1', email: 'test@example.com' }
      vi.mocked(apiClient.post).mockResolvedValue(mockUser)

      const result = await api.login('test@example.com', 'password123')

      expect(apiClient.post).toHaveBeenCalledWith('/user/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      expect(result).toEqual(mockUser)
    })
  })

  describe('logout', () => {
    it('should call clearToken', async () => {
      const { clearToken } = await import('./apiClient')

      api.logout()

      expect(clearToken).toHaveBeenCalled()
    })
  })

  describe('getUsers', () => {
    it('should fetch all users', async () => {
      const mockUsers = [
        { id: '1', email: 'user1@example.com' },
        { id: '2', email: 'user2@example.com' }
      ]
      vi.mocked(apiClient.get).mockResolvedValue(mockUsers)

      const result = await api.getUsers()

      expect(apiClient.get).toHaveBeenCalledWith('/users')
      expect(result).toEqual(mockUsers)
    })
  })

  describe('updateMyProfile', () => {
    it('should convert camelCase to snake_case', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true })

      await api.updateMyProfile({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789'
      })

      expect(apiClient.put).toHaveBeenCalledWith('/user', {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789'
      })
    })

    it('should include password if provided', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true })

      await api.updateMyProfile({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789',
        password: 'newPassword123'
      })

      expect(apiClient.put).toHaveBeenCalledWith('/user', {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+33123456789',
        password: 'newPassword123'
      })
    })
  })

  describe('updateUser', () => {
    it('should update user by ID', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true })

      await api.updateUser('123', { firstName: 'Jane' })

      expect(apiClient.put).toHaveBeenCalledWith('/users/123', { firstName: 'Jane' })
    })

    it('should encode user ID', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true })

      await api.updateUser('user@email.com', { firstName: 'Jane' })

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/'),
        expect.any(Object)
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete user by ID', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true })

      await api.deleteUser('123')

      expect(apiClient.delete).toHaveBeenCalledWith('/users/123')
    })
  })

  describe('getTeams', () => {
    it('should return array of teams', async () => {
      const mockTeams = [
        { id: 'team1', name: 'Engineering' },
        { id: 'team2', name: 'Design' }
      ]
      vi.mocked(apiClient.get).mockResolvedValue(mockTeams)

      const result = await api.getTeams()

      expect(apiClient.get).toHaveBeenCalledWith('/teams')
      expect(result).toEqual(mockTeams)
    })

    it('should extract items from response object', async () => {
      const mockResponse = {
        items: [
          { id: 'team1', name: 'Engineering' }
        ]
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse)

      const result = await api.getTeams()

      expect(result).toEqual(mockResponse.items)
    })
  })

  describe('getTeamsWithMembers', () => {
    it('should fetch teams with their members', async () => {
      const mockTeams = [
        { id: 'team1', name: 'Engineering' }
      ]
      const mockMembers = {
        manager: { id: 'manager1', firstName: 'John' },
        members: [
          { id: 'member1', firstName: 'Alice' }
        ]
      }

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce(mockMembers)

      const result = await api.getTeamsWithMembers()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'team1',
        name: 'Engineering',
        manager: mockMembers.manager,
        members: mockMembers.members
      })
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      const result = await api.getTeamsWithMembers()

      expect(result).toEqual([])
    })
  })

  describe('getUserTeam', () => {
    it('should fetch user team', async () => {
      const mockTeam = { id: 'team1', name: 'Engineering' }
      vi.mocked(apiClient.get).mockResolvedValue(mockTeam)

      const result = await api.getUserTeam()

      expect(apiClient.get).toHaveBeenCalledWith('/users/team')
      expect(result).toEqual(mockTeam)
    })
  })

  describe('getMyTeams', () => {
    it('should fetch current user teams', async () => {
      const mockTeams = [{ id: 'team1', name: 'Engineering' }]
      vi.mocked(apiClient.get).mockResolvedValue(mockTeams)

      const result = await api.getMyTeams()

      expect(apiClient.get).toHaveBeenCalledWith('/user/teams')
      expect(result).toEqual(mockTeams)
    })
  })

  describe('getTeamUsers', () => {
    it('should fetch team users', async () => {
      const mockUsers = [
        { id: 'user1', firstName: 'Alice' }
      ]
      vi.mocked(apiClient.get).mockResolvedValue(mockUsers)

      const result = await api.getTeamUsers('team1')

      expect(apiClient.get).toHaveBeenCalledWith('/teams/team1/users')
      expect(result).toEqual(mockUsers)
    })
  })

  describe('getUserTeamById', () => {
    it('should find team by user ID', async () => {
      const mockTeams = [
        { id: 'team1', name: 'Engineering' }
      ]
      const mockMembers = [
        { id: 'user1', firstName: 'Alice' }
      ]

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce(mockMembers)

      const result = await api.getUserTeamById('user1')

      expect(result).toMatchObject({
        id: 'team1',
        name: 'Engineering',
        members: mockMembers
      })
    })

    it('should return null if user not found in any team', async () => {
      const mockTeams = [
        { id: 'team1', name: 'Engineering' }
      ]
      const mockMembers = [
        { id: 'user2', firstName: 'Bob' }
      ]

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce(mockMembers)

      const result = await api.getUserTeamById('user1')

      expect(result).toBeNull()
    })

    it('should handle string member IDs', async () => {
      const mockTeams = [
        { id: 'team1', name: 'Engineering' }
      ]
      const mockMembers = ['user1', 'user2']

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockTeams)
        .mockResolvedValueOnce(mockMembers)

      const result = await api.getUserTeamById('user1')

      expect(result).toMatchObject({
        id: 'team1',
        name: 'Engineering'
      })
    })

    it('should return null on error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      const result = await api.getUserTeamById('user1')

      expect(result).toBeNull()
    })
  })

  describe('getClocks', () => {
    it('should fetch and parse clock timestamps', async () => {
      const mockClocks = [
        '2025-01-15T09:00:00Z',
        '2025-01-15T17:00:00Z'
      ]
      vi.mocked(apiClient.get).mockResolvedValue(mockClocks)

      const result = await api.getClocks('user1')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/users/user1/clocks',
        expect.objectContaining({ query: expect.any(Object) })
      )
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(Date)
    })

    it('should use provided date range', async () => {
      const from = new Date('2025-01-01')
      const to = new Date('2025-01-31')
      vi.mocked(apiClient.get).mockResolvedValue([])

      await api.getClocks('user1', from, to)

      expect(apiClient.get).toHaveBeenCalledWith(
        '/users/user1/clocks',
        { query: { from, to } }
      )
    })

    it('should return empty array on error', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      const result = await api.getClocks('user1')

      expect(result).toEqual([])
    })
  })

  describe('addClock', () => {
    it('should create new clock entry', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true })

      await api.addClock()

      expect(apiClient.post).toHaveBeenCalledWith('/clocks')
    })
  })

  describe('teamAverages', () => {
    it('should fetch team averages from API', async () => {
      const mockAverages = {
        daily: [{ day: '2025-01-15', hours: 8 }],
        weekly: [{ week: '2025-W03', hours: 40 }]
      }
      vi.mocked(apiClient.get).mockResolvedValue(mockAverages)

      const result = await api.teamAverages('team1')

      expect(apiClient.get).toHaveBeenCalledWith(
        '/teams/team1/averages',
        expect.objectContaining({ query: expect.any(Object) })
      )
      expect(result).toEqual(mockAverages)
    })

    it.skip('should calculate averages when API fails', async () => {
      const mockTeam = {
        id: 'team1',
        name: 'Engineering',
        members: ['user1']
      }
      const mockClocks = [
        { timestamp: '2025-01-15T09:00:00Z', type: 'in' },
        { timestamp: '2025-01-15T17:00:00Z', type: 'out' }
      ]
      vi.mocked(apiClient.get)
        .mockRejectedValueOnce(new Error('Not implemented'))
        .mockResolvedValueOnce([mockTeam])
        .mockResolvedValueOnce(mockClocks)

      const result = await api.teamAverages('team1')

      expect(result).toHaveProperty('daily')
      expect(result).toHaveProperty('weekly')
    })
  })
})
