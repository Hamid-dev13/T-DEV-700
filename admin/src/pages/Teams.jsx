import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TeamCard from '../components/TeamCard';
import AddTeamModal from '../components/AddTeamModal';
import { UsersRound, Loader2 } from 'lucide-react';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:3001/teams', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const teamsData = await response.json();
        setTeams(teamsData);

        // Récupérer les infos des managers
        await fetchManagers();
      } else {
        setError('Erreur lors du chargement des équipes');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await fetch('http://localhost:3001/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const usersData = await response.json();
        // Créer un map userId -> user
        const usersMap = {};
        usersData.forEach(user => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des managers:', err);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleTeamAdded = (newTeam) => {
    setTeams([...teams, newTeam]);
    // Recharger pour avoir les infos du manager
    fetchTeams();
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des équipes</h2>
          <button
            onClick={() => setIsModalOpen(true)}
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
                    manager={users[team.managerId]}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddTeamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTeamAdded={handleTeamAdded}
      />
    </div>
  );
}

export default Teams;
