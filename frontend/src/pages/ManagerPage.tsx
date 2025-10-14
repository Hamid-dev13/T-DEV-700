import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const ManagerPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* En-tête */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-[#1E2448]">
              Interface Manager
            </h1>
            <p className="text-[#64748B] mt-2">
              Bienvenue {user?.first_name}, voici votre tableau de bord de gestion.
            </p>
          </div>

          {/* Message temporaire */}
          <div className="bg-[#FFC933]/10 border-2 border-[#FFC933] rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">👨‍💼</div>
            <h2 className="text-xl font-bold text-[#1E2448] mb-2">
              Interface Manager en cours de développement
            </h2>
            <p className="text-[#64748B]">
              Les fonctionnalités de gestion d'équipe seront disponibles prochainement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;