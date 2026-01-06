import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <div className="text-sm text-gray-600">
            Bienvenue, <span className="font-semibold">{user?.email}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Bienvenue sur Time Manager</h3>
              <p className="text-gray-600">
                Ceci est votre interface d'administration. Utilisez le menu à gauche pour naviguer.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
