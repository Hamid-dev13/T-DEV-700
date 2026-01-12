import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'
import { AuthProvider } from '../contexts/AuthContext'
import * as AuthContext from '../contexts/AuthContext'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    expect(screen.getByText('Time Manager')).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('should allow user to type email and password', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email') as HTMLInputElement
    const passwordInput = screen.getByLabelText('Mot de passe') as HTMLInputElement

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput.value).toBe('admin@example.com')
    expect(passwordInput.value).toBe('password123')
  })

  it('should show loading state when submitting', async () => {
    const mockLogin = vi.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: false, error: 'Error' }), 100)))
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Connexion en cours...')).toBeInTheDocument()
    })
  })

  it('should display error message on failed login', async () => {
    const mockLogin = vi.fn(() => Promise.resolve({ success: false, error: 'Identifiants invalides' }))
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    const mockLogin = vi.fn(() => Promise.resolve({ success: true }))
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      logout: vi.fn(),
      user: null,
      loading: false
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText('Email')
    const passwordInput = screen.getByLabelText('Mot de passe')
    const submitButton = screen.getByRole('button', { name: /se connecter/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })
})
