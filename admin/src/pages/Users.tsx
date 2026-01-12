import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserCard from '../components/UserCard';
import AddUserModal from '../components/AddUserModal';
import EditUserModal from '../components/EditUserModal';
import DeleteUserModal from '../components/DeleteUserModal';
import { UserPlus, Loader2 } from 'lucide-react';
import { User } from '../utils/types';
import { deleteUser, getUsers } from '../utils/api';
import { except } from 'drizzle-orm/gel-core';
import { getErrorMessage } from '../utils/errors';

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const users = await getUsers();
      setUsers(users);

    } catch (err: unknown) {
      setError('Erreur lors du chargement des utilisateurs' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAdded = (newUser: User) => {
    setUsers([...users, newUser]);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);
    try {
      await deleteUser(selectedUser.id);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      alert('Erreur lors de la suppression: ' + getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des utilisateurs</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <UserPlus className="w-5 h-5" />
            Ajouter un utilisateur
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        user={selectedUser}
        loading={deleteLoading}
      />
    </div>
  );
}

export default Users;
