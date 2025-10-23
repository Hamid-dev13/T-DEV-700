import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeamManagePage from './TeamManagePage'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

// Mock du module API
vi.mock('../utils/api', () => ({
  getSession: vi.fn(),
  getMyTeams: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

describe('TeamManagePage Component', () => {
  const mockUser = {
    id: '1',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User'
  }

  const mockTeamData = {
    team: {
      id: 'team1',
      name: 'Engineering Team',
      startHour: 9,
      endHour: 17
    },
    manager: {
      id: 'manager1',
      firstName: 'John',
      lastName: 'Manager',
      email: 'john.manager@example.com'
    },
    members: [
      {
        id: 'member1',
        firstName: 'Alice',
        lastName: 'Developer',
        email: 'alice@example.com'
      },
      {
        id: 'member2',
        firstName: 'Bob',
        lastName: 'Designer',
        email: 'bob@example.com'
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSession).mockResolvedValue(mockUser)
  })

  it('should render loading state initially', async () => {
    vi.mocked(api.getMyTeams).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([mockTeamData]), 100))
    )

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    expect(screen.getByText('Chargement de l\'équipe...')).toBeInTheDocument()
  })

  it('should render team data after loading', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument()
      expect(screen.getByText('Alice Developer')).toBeInTheDocument()
      expect(screen.getByText('Bob Designer')).toBeInTheDocument()
    })
  })

  it('should show message when user has no team', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue([])

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Vous n\'êtes pas encore assigné à une équipe.')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    vi.mocked(api.getMyTeams).mockRejectedValue(new Error('Network error'))

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Vous n\'êtes pas encore assigné à une équipe.')).toBeInTheDocument()
    })
  })

  it('should switch between members and manager tabs', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument()
    })

    // Click on manager tab
    const managerTab = screen.getByText(/Manager/i)
    await user.click(managerTab)

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument()
    })
  })

  it('should show team selector when multiple teams exist', async () => {
    const mockMultipleTeams = [
      mockTeamData,
      {
        team: {
          id: 'team2',
          name: 'Design Team',
          startHour: 9,
          endHour: 17
        },
        manager: {
          id: 'manager2',
          firstName: 'Jane',
          lastName: 'Lead',
          email: 'jane@example.com'
        },
        members: [
          {
            id: 'member3',
            firstName: 'Charlie',
            lastName: 'Designer',
            email: 'charlie@example.com'
          }
        ]
      }
    ]

    vi.mocked(api.getMyTeams).mockResolvedValue(mockMultipleTeams)

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('🔄 Sélectionner une équipe')).toBeInTheDocument()
      expect(screen.getByText(/Engineering Team/)).toBeInTheDocument()
    })
  })

  it('should switch between teams when selector changes', async () => {
    const user = userEvent.setup()
    const mockMultipleTeams = [
      mockTeamData,
      {
        team: {
          id: 'team2',
          name: 'Design Team',
          startHour: 9,
          endHour: 17
        },
        manager: {
          id: 'manager2',
          firstName: 'Jane',
          lastName: 'Lead',
          email: 'jane@example.com'
        },
        members: [
          {
            id: 'member3',
            firstName: 'Charlie',
            lastName: 'Designer',
            email: 'charlie@example.com'
          }
        ]
      }
    ]

    vi.mocked(api.getMyTeams).mockResolvedValue(mockMultipleTeams)

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument()
    })

    const selector = screen.getByRole('combobox')
    await user.selectOptions(selector, '1')

    await waitFor(() => {
      expect(screen.getByText('Design Team')).toBeInTheDocument()
      expect(screen.getByText('Charlie Designer')).toBeInTheDocument()
    })
  })

  it('should handle single team object response', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue(mockTeamData as any)

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Engineering Team')).toBeInTheDocument()
    })
  })

  it('should not render when user is not authenticated', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <AuthProvider>
        <TeamManagePage />
      </AuthProvider>
    )

    await waitFor(() => {
      // Should show loading state but not fetch teams
      expect(api.getMyTeams).not.toHaveBeenCalled()
    })
  })
})
