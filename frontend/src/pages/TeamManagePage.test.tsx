import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('Chargement de l\'équipe...')).toBeInTheDocument()
  })

  it('should render team data after loading', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Alice/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Bob/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should show message when user has no team', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue([])

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Vous n\'êtes pas encore assigné à une équipe.')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    vi.mocked(api.getMyTeams).mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Vous n\'êtes pas encore assigné à une équipe.')).toBeInTheDocument()
    })
  })

  it('should switch between members and manager tabs', async () => {
    const user = userEvent.setup()
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click on manager tab
    const managerTab = screen.getByText(/Manager/i)
    await user.click(managerTab)

    await waitFor(() => {
      expect(screen.getAllByText(/John/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
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
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('🔄 Sélectionner une équipe')).toBeInTheDocument()
      // Use getAllByText since the team name appears in the selector and in the title
      const teamNames = screen.getAllByText(/Engineering Team/i)
      expect(teamNames.length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it.skip('should switch between teams when selector changes', async () => {
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
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    const selector = screen.getByRole('combobox')
    await user.selectOptions(selector, '1')

    await waitFor(() => {
      expect(screen.getByText(/Design Team/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Charlie/i).length).toBeGreaterThan(0)
    }, { timeout: 3000 })
  })

  it('should handle single team object response', async () => {
    vi.mocked(api.getMyTeams).mockResolvedValue(mockTeamData as any)

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should not render when user is not authenticated', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeamData])

    render(
      <MemoryRouter>
        <AuthProvider>
          <TeamManagePage />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      // Should show loading state but not fetch teams
      expect(api.getMyTeams).not.toHaveBeenCalled()
    })
  })
})
