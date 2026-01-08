import { Calendar, Clock as ClockIcon, Loader2, Plus, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import AddClockModal from '../components/AddClockModal';
import DeleteClockModal from '../components/DeleteClockModal';
import EditClockModal from '../components/EditClockModal';
import Sidebar from '../components/Sidebar';
import { getClocks, getUsers } from '../utils/api';
import { User } from '../utils/types';

interface ClockEntry {
  date: Date;
  iso: string;
}

function Clocks() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [clocks, setClocks] = useState<ClockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filtres de date
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(1); // Premier jour du mois
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClock, setSelectedClock] = useState<{ from: Date; to: Date } | null>(null);
  const [deleteClockDate, setDeleteClockDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchClocks();
    } else {
      setClocks([]);
    }
  }, [selectedUserId, fromDate, toDate]);

  const fetchUsers = async () => {
    try {
      const usersList = await getUsers();
      setUsers(usersList);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
    }
  };

  const fetchClocks = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    setError('');
    try {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59); // Fin de journée
      
      const clocksList = await getClocks(selectedUserId, from, to);
      setClocks(clocksList);
    } catch (err) {
      setError('Erreur lors du chargement des pointages: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClock = () => {
    if (!selectedUserId) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleClockAdded = () => {
    fetchClocks();
  };

  const handleEditClock = (clockDate: Date) => {
    // Trouver le pointage suivant pour avoir from/to
    const sortedClocks = [...clocks].sort((a, b) => a.date.getTime() - b.date.getTime());
    const index = sortedClocks.findIndex(c => c.date.getTime() === clockDate.getTime());
    
    if (index >= 0 && index < sortedClocks.length - 1) {
      setSelectedClock({
        from: sortedClocks[index].date,
        to: sortedClocks[index + 1].date
      });
      setIsEditModalOpen(true);
    } else {
      setError('Impossible de modifier ce pointage (pointage unique ou dernier pointage)');
    }
  };

  const handleClockUpdated = () => {
    fetchClocks();
  };

  const handleDeleteClock = (clockDate: Date) => {
    setDeleteClockDate(clockDate);
    setIsDeleteModalOpen(true);
  };

  const handleClockDeleted = () => {
    fetchClocks();
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des pointages</h2>
          <button
            onClick={handleAddClock}
            disabled={!selectedUserId}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            Ajouter un pointage
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="w-4 h-4 inline mr-2" />
                    Utilisateur
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {!selectedUserId ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Sélectionnez un utilisateur pour voir ses pointages</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Pointages de {selectedUser?.firstName} {selectedUser?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {clocks.length} pointage{clocks.length > 1 ? 's' : ''} trouvé{clocks.length > 1 ? 's' : ''}
                  </p>
                </div>

                {clocks.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    Aucun pointage trouvé pour cette période
                  </div>
                ) : (
                  <div className="divide-y">
                    {clocks.map((clock, index) => {
                      const isEven = index % 2 === 0;
                      const nextClock = clocks[index + 1];
                      const duration = nextClock 
                        ? Math.round((nextClock.date.getTime() - clock.date.getTime()) / (1000 * 60)) // en minutes
                        : null;

                      return (
                        <div
                          key={index}
                          className={`p-4 hover:bg-gray-50 transition ${
                            isEven ? 'bg-blue-50' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                isEven ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                              }`}>
                                <ClockIcon className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {isEven ? '🟢 Arrivée' : '🔴 Départ'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDateTime(clock.date)}
                                </p>
                                {duration !== null && isEven && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Durée: {Math.floor(duration / 60)}h {duration % 60}min
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isEven && nextClock && (
                                <button
                                  onClick={() => handleEditClock(clock.date)}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  Modifier
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteClock(clock.date)}
                                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AddClockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onClockAdded={handleClockAdded}
        userId={selectedUserId}
      />

      <EditClockModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClock(null);
        }}
        onClockUpdated={handleClockUpdated}
        userId={selectedUserId}
        clock={selectedClock}
      />

      <DeleteClockModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteClockDate(null);
        }}
        onClockDeleted={handleClockDeleted}
        userId={selectedUserId}
        clockDate={deleteClockDate}
      />
    </div>
  );
}

export default Clocks;

