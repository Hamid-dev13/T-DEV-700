import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MemberDetailsPage from './MemberDetailsPage'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

// Mock du module API
vi.mock('../utils/api', () => ({
  getSession: vi.fn(),
  getClocks: vi.fn(),
  getTeamsWithMembers: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock window.navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('MemberDetailsPage Component', () => {
  const mockUser = {
    id: 'user1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User'
  }

  const mockMember = {
    id: 'member1',
    firstName: 'Alice',
    lastName: 'Developer',
    email: 'alice@example.com'
  }

  const mockTeam = {
    id: 'team1',
    name: 'Engineering',
    startHour: 9,
    endHour: 17,
    members: [
      { id: 'member1', firstName: 'Alice', lastName: 'Developer' },
      { id: 'member2', firstName: 'Bob', lastName: 'Designer' }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSession).mockResolvedValue(mockUser)
    sessionStorage.clear()

    // Store member data in sessionStorage
    sessionStorage.setItem(`member_member1`, JSON.stringify(mockMember))
  })

  it('should render loading state initially', async () => {
    vi.mocked(api.getTeamsWithMembers).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve([mockTeam]), 100))
    )
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('should render member details after loading', async () => {
    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })

  it('should display member team information', async () => {
    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Engineering/i)).toBeInTheDocument()
    })
  })

  it('should calculate and display daily hours', async () => {
    const clockIn = new Date('2025-01-15T09:00:00')
    const clockOut = new Date('2025-01-15T17:00:00')

    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([
      { date: clockIn, iso: clockIn.toISOString() },
      { date: clockOut, iso: clockOut.toISOString() }
    ])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })

  it('should handle member without team', async () => {
    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    vi.mocked(api.getTeamsWithMembers).mockRejectedValue(new Error('Network error'))
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })

  it('should identify manager from team name', async () => {
    const managerTeam = {
      id: 'team-manager',
      name: 'Manager',
      startHour: 8,
      endHour: 18,
      members: [
        { id: 'member1', firstName: 'Alice', lastName: 'Manager' }
      ]
    }

    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([managerTeam, mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })

  it('should handle member data from sessionStorage', async () => {
    const customMember = {
      id: 'member2',
      firstName: 'Bob',
      lastName: 'Designer',
      email: 'bob@example.com'
    }

    sessionStorage.setItem(`member_member2`, JSON.stringify(customMember))

    const teamWithBob = {
      ...mockTeam,
      members: [
        { id: 'member2', firstName: 'Bob', lastName: 'Designer' }
      ]
    }

    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([teamWithBob])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member2']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Bob Designer/i)).toBeInTheDocument()
    })
  })

  it('should load current week clocks', async () => {
    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([mockTeam])
    vi.mocked(api.getClocks).mockResolvedValue([
      { date: new Date('2025-01-13T09:00:00'), iso: '2025-01-13T09:00:00Z' },
      { date: new Date('2025-01-13T17:00:00'), iso: '2025-01-13T17:00:00Z' },
      { date: new Date('2025-01-14T09:00:00'), iso: '2025-01-14T09:00:00Z' },
      { date: new Date('2025-01-14T17:00:00'), iso: '2025-01-14T17:00:00Z' }
    ])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.getClocks).toHaveBeenCalledWith(
        'member1',
        expect.any(Date),
        expect.any(Date)
      )
    })
  })

  it('should handle member ID with string type in team members', async () => {
    const teamWithStringIds = {
      id: 'team1',
      name: 'Engineering',
      startHour: 9,
      endHour: 17,
      members: ['member1', 'member2'] // String IDs instead of objects
    }

    vi.mocked(api.getTeamsWithMembers).mockResolvedValue([teamWithStringIds])
    vi.mocked(api.getClocks).mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/member/member1']}>
        <AuthProvider>
          <Routes>
            <Route path="/member/:memberId" element={<MemberDetailsPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Alice Developer/i)).toBeInTheDocument()
    })
  })
})
