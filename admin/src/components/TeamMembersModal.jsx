import { useState, useEffect } from 'react';
import { X, Users, UserPlus, Trash2, Loader2, Shield } from 'lucide-react';

function TeamMembersModal({ isOpen, onClose, team }) {
  const [members, setMembers] = useState([]);
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      fetchTeamMembers();
      fetchAvailableUsers();
    }
  }, [isOpen, team]);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/teams/${team.id}/users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setManager(data.manager);
        setMembers(data.members || []);
      } else {
        setError('Erreur lors du chargement des membres');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setAddLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/teams/${team.id}/users`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: selectedUserId }),
      });

      if (response.ok) {
        setIsAddMemberOpen(false);
        setSelectedUserId('');
        fetchTeamMembers();
      } else {
        alert('Erreur lors de l\'ajout du membre');
      }
    } catch (err) {
      alert('Erreur de connexion');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'équipe ?')) return;

    try {
      const response = await fetch(`http://localhost:3001/teams/${team.id}/users`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: userId }),
      });

      if (response.ok) {
        fetchTeamMembers();
      } else {
        alert('Erreur lors de la suppression du membre');
      }
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  if (!isOpen || !team) return null;

  // Filtrer les utilisateurs disponibles (exclure le manager et les membres déjà présents)
  const memberIds = members.map(m => m.id);
  const usersToAdd = availableUsers.filter(
    u => u.id !== team.managerId && !memberIds.includes(u.id)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Membres de l'équipe</h2>
            <p className="text-sm text-gray-600">{team.name}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Manager */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Manager
              </h3>
              {manager && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="font-medium text-gray-800">
                    {manager.firstName} {manager.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{manager.email}</p>
                </div>
              )}
            </div>

            {/* Membres */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Membres ({members.length})
                </h3>
                <button
                  onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter un membre
                </button>
              </div>

              {isAddMemberOpen && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex gap-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">Sélectionner un utilisateur</option>
                      {usersToAdd.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedUserId || addLoading}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? 'Ajout...' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              )}

              {members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun membre dans cette équipe
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeamMembersModal;
