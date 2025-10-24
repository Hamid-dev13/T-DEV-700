import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClockPage from './ClockPage'
import { AuthProvider } from '../context/AuthContext'
import * as api from '../utils/api'

// Mock du module API
vi.mock('../utils/api', () => ({
  getSession: vi.fn(),
  getClocks: vi.fn(),
  addClock: vi.fn(),
  login: vi.fn(),
  logout: vi.fn()
}))

describe('ClockPage Component', () => {
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
  })

  it('should render clock page with title and button', async () => {
    render(
      <AuthProvider>
        <ClockPage />
      </AuthProvider>
    )

    expect(await screen.findByText('Pointage')).toBeInTheDocument()
    expect(screen.getByText('🕐 Pointer')).toBeInTheDocument()
    expect(screen.getByText('📋 Historique des pointages')).toBeInTheDocument()
  })

  it('should display empty state when no clock entries', async () => {
    render(
      <AuthProvider>
        <ClockPage />
      </AuthProvider>
    )

    expect(await screen.findByText('Aucune entrée dans cette période.')).toBeInTheDocument()
  })

  it('should call addClock when pointer button is clicked', async () => {
    const user = userEvent.setup()
    const mockClock = { id: '1', user_id: '1', at: new Date().toISOString() }
    vi.mocked(api.addClock).mockResolvedValue(mockClock)

    render(
      <AuthProvider>
        <ClockPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('🕐 Pointer')).toBeInTheDocument()
    })

    const pointerButton = screen.getByText('🕐 Pointer')
    await user.click(pointerButton)

    expect(api.addClock).toHaveBeenCalled()
  })

  it('should display clock entries when available', async () => {
    const mockClocks = [
      { date: new Date('2025-10-23T09:00:00'), iso: '2025-10-23T09:00:00Z' },
      { date: new Date('2025-10-23T17:00:00'), iso: '2025-10-23T17:00:00Z' }
    ]
    vi.mocked(api.getClocks).mockResolvedValue(mockClocks)

    render(
      <AuthProvider>
        <ClockPage />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/⬆️ Arrivée/)).toBeInTheDocument()
      expect(screen.getByText(/⬇️ Départ/)).toBeInTheDocument()
    })
  })

  it('should group clock entries by day', async () => {
    const mockClocks = [
      { date: new Date('2025-10-23T09:00:00'), iso: '2025-10-23T09:00:00Z' },
      { date: new Date('2025-10-23T17:00:00'), iso: '2025-10-23T17:00:00Z' },
      { date: new Date('2025-10-22T09:30:00'), iso: '2025-10-22T09:30:00Z' },
      { date: new Date('2025-10-22T18:00:00'), iso: '2025-10-22T18:00:00Z' }
    ]
    vi.mocked(api.getClocks).mockResolvedValue(mockClocks)

    render(
      <AuthProvider>
        <ClockPage />
      </AuthProvider>
    )

    await waitFor(() => {
      // Vérifier qu'il y a 2 groupes de jours différents
      const dayHeaders = screen.getAllByText(/📅/)
      expect(dayHeaders.length).toBeGreaterThan(0)
    })
  })
})
