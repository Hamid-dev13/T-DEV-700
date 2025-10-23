import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import * as api from './utils/api'

// Mock du module API
vi.mock('./utils/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn()
}))

// Mock des pages pour éviter les dépendances complexes
vi.mock('./pages/AccountPage', () => ({
  default: () => <div>Account Page Mock</div>
}))

vi.mock('./pages/ClockPage', () => ({
  default: () => <div>Clock Page Mock</div>
}))

vi.mock('./pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page Mock</div>
}))

vi.mock('./pages/TeamManagePage', () => ({
  default: () => <div>Team Manage Page Mock</div>
}))

vi.mock('./pages/MemberDetailsPage', () => ({
  default: () => <div>Member Details Page Mock</div>
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading screen while checking authentication', async () => {
    vi.mocked(api.getSession).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(null), 100))
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    expect(screen.getByText('Chargement…')).toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bienvenue 👋')).toBeInTheDocument()
    })
  })

  it('should redirect authenticated user from root to /clock', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Clock Page Mock')).toBeInTheDocument()
    })
  })

  it('should allow access to unprotected account route', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)

    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Account Page Mock')).toBeInTheDocument()
    })
  })

  it('should allow access to protected routes when authenticated', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page Mock')).toBeInTheDocument()
    })
  })

  it('should render login page on /login route', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bienvenue 👋')).toBeInTheDocument()
    })
  })

  it('should redirect unknown routes to root', async () => {
    const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Clock Page Mock')).toBeInTheDocument()
    })
  })
})
