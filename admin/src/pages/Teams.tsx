import { Loader2, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddTeamModal from '../components/AddTeamModal';
import DeleteTeamModal from '../components/DeleteTeamModal';
import EditTeamModal from '../components/EditTeamModal';
import Sidebar from '../components/Sidebar';
import TeamCard from '../components/TeamCard';
import TeamMembersModal from '../components/TeamMembersModal';
import { deleteTeam, getTeams, getUsers } from '../utils/api';
import { Team, User } from '../utils/types';

function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<Map<string, User>>(new Map<string, User>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      const teams = await getTeams();
      setTeams(teams);

      // Récupérer les infos des managers
      await fetchManagers();
    } catch (err) {
      setError('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const users = await getUsers();
      const usersMap = new Map<string, User>();
      users.forEach((user: User) => {
        usersMap.set(user.id, user);
      });
      setUsers(usersMap);
    } catch (err) {
      console.error('Erreur lors du chargement des managers:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleTeamAdded = (newTeam: Team) => {
    setTeams([...teams, newTeam]);
    // Recharger pour avoir les infos du manager
    fetchTeams();
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    // Recharger pour avoir les infos du manager
    fetchTeams();
  };

  const handleDeleteTeam = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const handleViewMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsMembersModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedTeam) return;

    setDeleteLoading(true);
    try {
      await deleteTeam(selectedTeam.id);
      setTeams(teams.filter(t => t.id !== selectedTeam.id));
      setIsDeleteModalOpen(false);
      setSelectedTeam(null);
    } catch (err) {
      setError('Erreur lors de la suppression: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des équipes</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <UsersRound className="w-5 h-5" />
            Créer une équipe
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Aucune équipe trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    manager={users.get(team.managerId) || null}
                    onEdit={handleEditTeam}
                    onDelete={handleDeleteTeam}
                    onViewMembers={handleViewMembers}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddTeamModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTeamAdded={handleTeamAdded}
      />

      <EditTeamModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeam(null);
        }}
        onTeamUpdated={handleTeamUpdated}
        team={selectedTeam}
      />

      <DeleteTeamModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={handleConfirmDelete}
        team={selectedTeam}
        loading={deleteLoading}
      />

      <TeamMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => {
          setIsMembersModalOpen(false);
          setSelectedTeam(null);
        }}
        team={selectedTeam}
      />
    </div>
  );
}

export default Teams;
