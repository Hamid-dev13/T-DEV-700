import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { Shell, Card, Link } from './Layout'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'
import * as router from '../router'

// Mock du module API
vi.mock('../utils/api', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getSession: vi.fn()
}))

// Mock du router
vi.mock('../router', () => ({
  navigate: vi.fn()
}))

describe('Card Component', () => {
  it('should render card with title and children', () => {
    render(
      <BrowserRouter>
      <BrowserRouter>
      <Card title="Test Card">
        <div>Test Content</div>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render card with actions', () => {
    render(
      <BrowserRouter>
      <BrowserRouter>
      <Card title="Test Card" actions={<button>Action Button</button>}>
        <div>Content</div>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Action Button')).toBeInTheDocument()
  })

  it('should render card with footer', () => {
    render(
      <BrowserRouter>
      <BrowserRouter>
      <Card title="Test Card" footer={<div>Footer Content</div>}>
        <div>Content</div>
      </Card>
    )

    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })
})

describe('Link Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render link with children', () => {
    render(
      <BrowserRouter>
      <BrowserRouter><Link to="/test">Test Link</Link>)

    expect(screen.getByText('Test Link')).toBeInTheDocument()
  })

  it('should navigate when clicked', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
      <BrowserRouter><Link to="/dashboard">Go to Dashboard</Link>)

    const link = screen.getByText('Go to Dashboard')
    await user.click(link)

    expect(router.navigate).toHaveBeenCalledWith('/dashboard')
  })
})

describe('Shell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render shell with children when user is not logged in', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    expect(await screen.findByText('Test Content')).toBeInTheDocument()
    expect(screen.getByText('MR5')).toBeInTheDocument()
  })

  it('should render navigation when user is logged in', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    // Attendre que l'utilisateur soit chargé
    expect(await screen.findByText('Pointage')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Équipe')).toBeInTheDocument()
    expect(screen.getByText('Mon compte')).toBeInTheDocument()
    expect(screen.getByText('Se déconnecter')).toBeInTheDocument()
  })

  it('should navigate to clock page when Pointage is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    const pointageButton = await screen.findByText('Pointage')
    await user.click(pointageButton)

    expect(router.navigate).toHaveBeenCalledWith('/clock')
  })

  it('should navigate to dashboard page when Dashboard is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    const dashboardButton = await screen.findByText('Dashboard')
    await user.click(dashboardButton)

    expect(router.navigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should call logout when Se déconnecter is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    vi.mocked(api.getSession).mockResolvedValue(mockUser)

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    const logoutButton = await screen.findByText('Se déconnecter')
    await user.click(logoutButton)

    expect(api.logout).toHaveBeenCalled()
    expect(router.navigate).toHaveBeenCalledWith('/login')
  })

  it('should display current year in footer', async () => {
    vi.mocked(api.getSession).mockResolvedValue(null)
    const currentYear = new Date().getFullYear()

    render(
      <BrowserRouter>
      <BrowserRouter>
      <AuthProvider>
        <Shell>
          <div>Test Content</div>
        </Shell>
      </AuthProvider>
      </BrowserRouter>
      </BrowserRouter>
    )

    expect(await screen.findByText(`© ${currentYear} — Démo`)).toBeInTheDocument()
  })
})
