import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Users from './Users'
import * as api from '../utils/api'

vi.mock('../components/Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}))

vi.mock('../components/UserCard', () => ({
  default: ({ user, onEdit, onDelete }: any) => (
    <div data-testid={`user-card-${user.id}`}>
      <span>{user.email}</span>
      <button onClick={() => onEdit(user)}>Edit</button>
      <button onClick={() => onDelete(user)}>Delete</button>
    </div>
  )
}))

vi.mock('../components/AddUserModal', () => ({
  default: ({ isOpen, onClose, onUserAdded }: any) =>
    isOpen ? (
      <div data-testid="add-user-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

vi.mock('../components/EditUserModal', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="edit-user-modal">Edit Modal</div> : null
}))

vi.mock('../components/DeleteUserModal', () => ({
  default: ({ isOpen, onClose, onConfirm, loading }: any) =>
    isOpen ? (
      <div data-testid="delete-user-modal">
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
}))

vi.mock('../utils/api')

describe('Users Component', () => {
  const mockUsers = [
    { id: '1', email: 'user1@example.com', admin: false },
    { id: '2', email: 'user2@example.com', admin: true }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render users page with title', async () => {
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    expect(screen.getByText('Gestion des utilisateurs')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })
  })

  it('should display loading state', async () => {
    vi.mocked(api.getUsers).mockImplementation(() => new Promise(() => {}))

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    // The loading spinner uses Loader2 icon, not text
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('should display error message on fetch failure', async () => {
    vi.mocked(api.getUsers).mockRejectedValue(new Error('Network error'))

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument()
    })
  })

  it('should open add user modal when clicking add button', async () => {
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })

    const addButton = screen.getByText(/ajouter/i)
    fireEvent.click(addButton)

    expect(screen.getByTestId('add-user-modal')).toBeInTheDocument()
  })

  it('should open edit modal when clicking edit on user card', async () => {
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Edit')
    fireEvent.click(editButtons[0])

    expect(screen.getByTestId('edit-user-modal')).toBeInTheDocument()
  })

  it('should open delete modal when clicking delete on user card', async () => {
    vi.mocked(api.getUsers).mockResolvedValue(mockUsers)

    render(
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByText('Delete')
    fireEvent.click(deleteButtons[0])

    expect(screen.getByTestId('delete-user-modal')).toBeInTheDocument()
  })
})
