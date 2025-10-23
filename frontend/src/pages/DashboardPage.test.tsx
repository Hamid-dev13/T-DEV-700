import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DashboardPage from './DashboardPage'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

// Mock du module API
vi.mock('../utils/api', () => ({
  getSession: vi.fn(),
  getClocks: vi.fn(),
  getMyTeams: vi.fn(),
  getTeamUsers: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

describe('DashboardPage Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    admin: false,
    phone: undefined
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSession).mockResolvedValue(mockUser)
    vi.mocked(api.getClocks).mockResolvedValue([])
    vi.mocked(api.getMyTeams).mockResolvedValue([])
  })

  it('should render dashboard page with title', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(await screen.findByText('Résumé de vos heures - Semaine en cours')).toBeInTheDocument()
  })

  it('should display loading state initially', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Récupération de vos données...')).toBeInTheDocument()
  })

  it('should display summary cards with default values', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument()
      expect(screen.getByText('Cette semaine')).toBeInTheDocument()
    })
  })

  it('should calculate and display daily hours', async () => {
    const mockClocks = [
      new Date('2025-10-23T09:00:00'),
      new Date('2025-10-23T17:00:00')
    ]
    vi.mocked(api.getClocks).mockResolvedValue(mockClocks)

    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Résumé de vos heures - Semaine en cours')).toBeInTheDocument()
    })
  })

  it('should display team summary when user is a manager', async () => {
    const mockTeam = {
      team: {
        id: '1',
        name: 'Team A',
        description: 'Test Team',
        managerId: '1',
        startHour: 9,
        endHour: 17
      },
      manager: mockUser,
      members: [
        { id: '2', firstName: 'John', lastName: 'Doe', email: 'john@example.com', admin: false, phone: undefined }
      ]
    }
    vi.mocked(api.getMyTeams).mockResolvedValue([mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Résumé de l'équipe - Team A/)).toBeInTheDocument()
      expect(screen.getByText('Membres de l\'équipe')).toBeInTheDocument()
    })
  })

  it('should display detail by day section', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Détail par jour')).toBeInTheDocument()
    })
  })
})
