import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

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

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSession).mockResolvedValue(null)
  })

  it('should render login form correctly', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Bienvenue 👋')).toBeInTheDocument()
      expect(screen.getByText('Connexion')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
    })
  })

  it('should update email and password fields on user input', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('vous@exemple.com') as HTMLInputElement
    const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('should call login function on form submit', async () => {
    const user = userEvent.setup()
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    vi.mocked(api.login).mockResolvedValue(mockUser)

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('vous@exemple.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should display error message on login failure', async () => {
    const user = userEvent.setup()
    vi.mocked(api.login).mockRejectedValue(new Error('Invalid credentials'))

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('vous@exemple.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Identifiants non valides')).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    const user = userEvent.setup()
    vi.mocked(api.login).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ id: '1', email: 'test@example.com', name: 'Test' }), 100))
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByPlaceholderText('vous@exemple.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByPlaceholderText('vous@exemple.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Le bouton devrait afficher "Connexion..." pendant le chargement
    await waitFor(() => {
      expect(screen.getByText('Connexion...')).toBeInTheDocument()
    })
  })
})
