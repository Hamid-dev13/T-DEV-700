import Sidebar from '../components/Sidebar';

function Teams() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center px-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestion des équipes</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4">Liste des équipes</h3>
              <p className="text-gray-600">
                Page de gestion des équipes à venir...
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Teams;
