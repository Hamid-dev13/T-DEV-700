import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import { AuthProvider } from '../contexts/AuthContext'
import * as AuthContext from '../contexts/AuthContext'

vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}))

describe('Dashboard Component', () => {
  it('should render dashboard with welcome message', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'admin@example.com', id: '1', admin: true },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Bienvenue sur Time Manager')).toBeInTheDocument()
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument()
  })

  it('should render sidebar', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'admin@example.com', id: '1', admin: true },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should display user email in welcome message', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'test@example.com', id: '2', admin: true },
      login: vi.fn(),
      logout: vi.fn(),
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
  })
})
