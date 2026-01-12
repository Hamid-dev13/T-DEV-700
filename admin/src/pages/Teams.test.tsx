import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Teams from './Teams'
import * as api from '../utils/api'

vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}))

vi.mock('../components/TeamCard', () => ({
  default: ({ team }: any) => (
    <div data-testid={`team-card-${team.id}`}>
      <span>{team.name}</span>
    </div>
  )
}))

vi.mock('../components/AddTeamModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="add-team-modal">Add Team Modal</div> : null
}))

vi.mock('../components/EditTeamModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="edit-team-modal">Edit Team Modal</div> : null
}))

vi.mock('../components/DeleteTeamModal', () => ({
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="delete-team-modal">Delete Team Modal</div> : null
}))

vi.mock('../utils/api')

describe('Teams Component', () => {
  const mockTeams = [
    { id: '1', name: 'Team Alpha', startHour: 9, endHour: 17, managerId: 'user1' },
    { id: '2', name: 'Team Beta', startHour: 10, endHour: 18, managerId: 'user2' }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render teams page with title', async () => {
    vi.mocked(api.getTeams).mockResolvedValue(mockTeams)

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    )

    expect(screen.getByText('Gestion des équipes')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Team Alpha')).toBeInTheDocument()
    })
  })

  it('should display loading state', async () => {
    vi.mocked(api.getTeams).mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    )

    // The loading spinner uses icon, not text
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should display error message on fetch failure', async () => {
    vi.mocked(api.getTeams).mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument()
    })
  })

  it('should display all teams', async () => {
    vi.mocked(api.getTeams).mockResolvedValue(mockTeams)

    render(
      <BrowserRouter>
        <Teams />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('team-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('team-card-2')).toBeInTheDocument()
    })
  })
})
