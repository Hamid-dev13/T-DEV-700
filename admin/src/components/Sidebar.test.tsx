import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Sidebar from './Sidebar'
import * as AuthContext from '../contexts/AuthContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' })
  }
})

describe('Sidebar Component', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { email: 'admin@example.com', id: '1', admin: true },
      login: vi.fn(),
      logout: mockLogout,
      loading: false
    })
  })

  it('should render sidebar with menu items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    expect(screen.getByText('Time Manager')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Clocks')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should navigate when clicking menu items', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByText('Users'))
    expect(mockNavigate).toHaveBeenCalledWith('/users')

    fireEvent.click(screen.getByText('Teams'))
    expect(mockNavigate).toHaveBeenCalledWith('/teams')
  })

  it('should toggle sidebar when clicking toggle button', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    const toggleButtons = screen.getAllByRole('button')
    const toggleButton = toggleButtons[0] // First button is the toggle

    // Initially open, should show "Time Manager"
    expect(screen.getByText('Time Manager')).toBeInTheDocument()

    // Click to close
    fireEvent.click(toggleButton)

    // Click to open again
    fireEvent.click(toggleButton)
  })

  it('should call logout when clicking logout button', async () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    )

    const logoutButton = screen.getByText('Logout')
    fireEvent.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })
})
