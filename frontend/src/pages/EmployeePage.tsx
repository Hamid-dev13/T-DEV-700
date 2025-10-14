import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { clockIn, getUserClocks } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EmployeePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [clocks, setClocks] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Charger l'historique au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadClockHistory();
    }
  }, [user?.id]);

  const loadClockHistory = async () => {
    if (!user?.id) return;
    
    try {
      // Récupère les pointages des 7 derniers jours
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const history = await getUserClocks(user.id, from, to);
      setClocks(history);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleClockIn = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await clockIn();
      setMessage({ 
        type: 'success', 
        text: `Pointage enregistré à ${new Date(result.at).toLocaleTimeString('fr-FR')}` 
      });
      
      // Ajoute le nouveau pointage à l'historique
      setClocks(prev => [result.at, ...prev]);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erreur lors du pointage' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Contenu principal */}
      <div className="flex flex-col items-center px-4 py-8">
        
        {/* Bouton Pointer - Style WTTJ */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
          <button
            onClick={handleClockIn}
            disabled={isLoading}
            className="bg-[#FFC933] hover:bg-[#FFBF00] 
                       text-[#1E2448] font-bold text-2xl
                       w-64 h-64 rounded-full shadow-2xl
                       transition-all duration-300 ease-in-out
                       hover:scale-105 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       border-4 border-[#1E2448]"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl animate-pulse">⏳</span>
                <span className="text-sm">Envoi...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">🕐</span>
                <span>Pointer</span>
              </div>
            )}
          </button>

          {/* Message de feedback */}
          {message && (
            <div className={`mt-8 px-6 py-4 rounded-lg shadow-md max-w-md text-center
                            transition-all duration-300
                            ${message.type === 'success' 
                              ? 'bg-green-50 border-2 border-green-400 text-green-800' 
                              : 'bg-red-50 border-2 border-[#FF6B6B] text-[#FF6B6B]'}`}>
              <p className="font-semibold">{message.text}</p>
            </div>
          )}

          {/* Info */}
          <p className="mt-8 text-[#64748B] text-center text-sm">
            Cliquez sur le bouton pour enregistrer votre pointage
          </p>
        </div>

        {/* Historique des pointages */}
        <div className=" w-full max-w-2xl">
          <h3 className="text-2xl font-bold text-[#1E2448] text-center flex items-center justify-center gap-2">
            <span>📋</span>
            Historique des pointages
          </h3>

          {loadingHistory ? (
            <div className="text-center text-[#64748B] bg-white rounded-xl p-8 shadow-sm">
              Chargement de l'historique...
            </div>
          ) : clocks.length === 0 ? (
            <div className="text-center text-[#64748B] bg-white rounded-xl p-8 shadow-sm">
              Aucun pointage enregistré ces 7 derniers jours
            </div>
          ) : (
            <div className="space-y-3">
              {clocks.slice(0, 10).map((clockTime, index) => {
                const date = new Date(clockTime);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div 
                    key={index}
                    className="bg-white border-2 border-gray-200 rounded-xl p-4 
                               hover:border-[#FFC933] transition-all duration-300
                               flex items-center justify-between
                               shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#FFC933]/10 rounded-full 
                                    flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#FFC933]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1E2448]">
                          {date.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })}
                        </p>
                        <p className="text-[#64748B] text-sm">
                          {date.toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {isToday && (
                      <span className="bg-[#FFC933] text-[#1E2448] text-xs font-bold 
                                     px-3 py-1 rounded-full">
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;