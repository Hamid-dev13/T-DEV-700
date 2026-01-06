import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import AccountPage from './AccountPage'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

// Mock du module API
vi.mock('../utils/api', () => ({
  getSession: vi.fn(),
  updateMyProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

// Mock window.alert et window.confirm
global.alert = vi.fn()
global.confirm = vi.fn()

describe('AccountPage Component', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+33123456789'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getSession).mockResolvedValue(mockUser)
    vi.mocked(global.alert).mockImplementation(() => {})
    vi.mocked(global.confirm).mockReturnValue(false)
  })

  it('should render account page with user data', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+33123456789')).toBeInTheDocument()
    })
  })

  it('should update form fields on user input', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const firstNameInput = screen.getByDisplayValue('John') as HTMLInputElement
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')

    expect(firstNameInput.value).toBe('Jane')
  })

  it('should successfully update profile with valid data', async () => {
    const user = userEvent.setup()
    vi.mocked(api.updateMyProfile).mockResolvedValue({ success: true })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const firstNameInput = screen.getByDisplayValue('John')
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.updateMyProfile).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+33123456789'
      })
      expect(global.alert).toHaveBeenCalledWith('Compte mis à jour avec succès.')
    })
  })

  it('should show error when password does not meet requirements', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer')
    await user.type(passwordInput, 'weak')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Mot de passe invalide')).toBeInTheDocument()
    })
  })

  it('should accept valid password', async () => {
    const user = userEvent.setup()
    vi.mocked(api.updateMyProfile).mockResolvedValue({ success: true })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer')
    await user.type(passwordInput, 'Valid1Pass!')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(api.updateMyProfile).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '+33123456789',
        password: 'Valid1Pass!'
      })
    })
  })

  it('should show password validation modal with all criteria', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer')
    await user.type(passwordInput, 'weak')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Mot de passe invalide')).toBeInTheDocument()
      expect(screen.getByText('Au moins une majuscule (A-Z)')).toBeInTheDocument()
      expect(screen.getByText('Au moins une minuscule (a-z)')).toBeInTheDocument()
      expect(screen.getByText('Au moins un chiffre (0-9)')).toBeInTheDocument()
    })
  })

  it('should close password error modal when clicking button', async () => {
    const user = userEvent.setup()

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer')
    await user.type(passwordInput, 'weak')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Mot de passe invalide')).toBeInTheDocument()
    })

    const comprisButton = screen.getByRole('button', { name: /compris/i })
    await user.click(comprisButton)

    await waitFor(() => {
      expect(screen.queryByText('Mot de passe invalide')).not.toBeInTheDocument()
    })
  })

  it('should handle API error when updating profile', async () => {
    const user = userEvent.setup()
    vi.mocked(api.updateMyProfile).mockRejectedValue(new Error('Server error'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Server error'))
    })
  })

  it('should show specific error for password security requirements', async () => {
    const user = userEvent.setup()
    vi.mocked(api.updateMyProfile).mockRejectedValue(new Error('Password does not meet security requirements'))

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer')
    await user.type(passwordInput, 'Valid1Pass!')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('exigences de sécurité'))
    })
  })

  it('should show confirmation dialog when deleting account', async () => {
    const user = userEvent.setup()
    vi.mocked(global.confirm).mockReturnValue(false)

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /supprimer john/i })
    await user.click(deleteButton)

    expect(global.confirm).toHaveBeenCalledWith(expect.stringContaining('Êtes-vous sûr'))
  })

  it('should show not implemented message when confirming account deletion', async () => {
    const user = userEvent.setup()
    vi.mocked(global.confirm).mockReturnValue(true)

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /supprimer john/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Fonctionnalité de suppression à implémenter')
    })
  })

  it('should clear password field after successful update', async () => {
    const user = userEvent.setup()
    vi.mocked(api.updateMyProfile).mockResolvedValue({ success: true })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    })

    const passwordInput = screen.getByPlaceholderText('Laisser vide pour ne pas changer') as HTMLInputElement
    await user.type(passwordInput, 'Valid1Pass!')

    expect(passwordInput.value).toBe('Valid1Pass!')

    const submitButton = screen.getByRole('button', { name: /enregistrer/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(passwordInput.value).toBe('')
    })
  })
})
