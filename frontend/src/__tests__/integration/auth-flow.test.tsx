import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../helpers/renderWithProviders'
import Login from '../../pages/Login'
import * as api from '../../utils/api'

vi.mock('../../utils/api', () => ({
  login: vi.fn(),
  getSession: vi.fn(),
  logout: vi.fn()
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Login Flow', () => {
    it('should complete full login flow', async () => {
      const user = userEvent.setup()
      const mockUser = { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User' }
      
      vi.mocked(api.login).mockResolvedValue(mockUser)
      vi.mocked(api.getSession).mockResolvedValue(null)

      renderWithProviders(<Login />)

      const emailInput = screen.getByPlaceholderText(/email/i)
      const passwordInput = screen.getByPlaceholderText(/mot de passe/i)
      const submitButton = screen.getByRole('button', { name: /connexion/i })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)

      await waitFor(() => {
        expect(api.login).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })
  })
})
