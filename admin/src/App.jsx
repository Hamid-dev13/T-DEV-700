import Sidebar from './components/Sidebar';

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center px-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Votre contenu ici */}
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

export default App;