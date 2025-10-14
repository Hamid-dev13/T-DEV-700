import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { clockIn, getUserClocks, getAttendanceDelay } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AttendanceDelay } from '../types';

const EmployeePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [clocks, setClocks] = useState<string[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [delay, setDelay] = useState<AttendanceDelay | null>(null);
  const [loadingDelay, setLoadingDelay] = useState(true);

  // Timer qui se met à jour toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Charger l'historique et les retards au montage du composant
  useEffect(() => {
    if (user?.id) {
      loadClockHistory();
      loadDelayInfo();
    }
  }, [user?.id]);

  const loadClockHistory = async () => {
    if (!user?.id) return;
    
    try {
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

  const loadDelayInfo = async () => {
    try {
      const delayData = await getAttendanceDelay();
      setDelay(delayData);
    } catch (error) {
      console.error('Erreur lors du chargement des retards:', error);
      setDelay(null);
    } finally {
      setLoadingDelay(false);
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

  const isClockedIn = clocks.length > 0 && clocks.length % 2 !== 0;
  
  const getElapsedTime = () => {
    if (clocks.length === 0) return null;
    
    const lastClock = new Date(clocks[0]);
    const diff = currentTime.getTime() - lastClock.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds };
  };

  const elapsedTime = getElapsedTime();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="flex flex-col items-center px-4 py-8">
        
        {/* Bouton Pointer */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
          <button
            onClick={handleClockIn}
            disabled={isLoading}
            className={`font-bold text-2xl w-64 h-64 rounded-full shadow-2xl
                       transition-all duration-300 ease-in-out
                       hover:scale-105 active:scale-95
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       border-4
                       ${isClockedIn 
                         ? 'bg-green-500 hover:bg-green-600 text-white border-green-700' 
                         : 'bg-[#FFC933] hover:bg-[#FFBF00] text-[#1E2448] border-[#1E2448]'}`}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl animate-pulse">⏳</span>
                <span className="text-sm">Envoi...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl">{isClockedIn ? '👋' : '🕐'}</span>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold">
                    {isClockedIn ? 'SORTIE' : 'ENTRÉE'}
                  </span>
                  {isClockedIn && elapsedTime && (
                    <span className="text-xs mt-2 opacity-90">
                      Depuis {elapsedTime.hours}h{String(elapsedTime.minutes).padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </button>

          {message && (
            <div className={`mt-8 px-6 py-4 rounded-lg shadow-md max-w-md text-center
                            transition-all duration-300
                            ${message.type === 'success' 
                              ? 'bg-green-50 border-2 border-green-400 text-green-800' 
                              : 'bg-red-50 border-2 border-[#FF6B6B] text-[#FF6B6B]'}`}>
              <p className="font-semibold">{message.text}</p>
            </div>
          )}

          <p className="mt-8 text-[#64748B] text-center text-sm">
            {isClockedIn 
              ? 'Cliquez pour enregistrer votre sortie'
              : 'Cliquez pour enregistrer votre entrée'}
          </p>
        </div>

        {/* Section en 2 colonnes: Historique + Retards */}
        <div className="mt-12 w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
            {/* COLONNE GAUCHE: Historique */}
            <div>
              <h3 className="text-2xl font-bold text-[#1E2448] mb-6 flex items-center gap-2">
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
                                   flex items-center justify-between shadow-sm hover:shadow-md"
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

            {/* COLONNE DROITE: Retards */}
            <div>
              <h3 className="text-2xl font-bold text-[#1E2448] mb-6 flex items-center gap-2">
                <span>⏰</span>
                Statut aujourd'hui
              </h3>

              {loadingDelay ? (
                <div className="text-center text-[#64748B] bg-white rounded-xl p-8 shadow-sm">
                  Chargement...
                </div>
              ) : !delay ? (
                <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">ℹ️</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-700 text-lg">Pas encore pointé</p>
                      <p className="text-sm text-gray-500">Aucun pointage aujourd'hui</p>
                    </div>
                  </div>
                </div>
              ) : delay.status === 'late' ? (
                <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                      <p className="font-bold text-red-700 text-lg">En retard</p>
                      <p className="text-sm text-red-600">
                        {new Date(delay.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-lg p-4">
                    <p className="text-red-800 font-semibold text-center text-3xl">
                      {Math.floor(delay.delay_minutes / 60)}h{String(delay.delay_minutes % 60).padStart(2, '0')}
                    </p>
                    <p className="text-red-600 text-center text-sm mt-1">de retard</p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">✅</span>
                    </div>
                    <div>
                      <p className="font-bold text-green-700 text-lg">À l'heure</p>
                      <p className="text-sm text-green-600">
                        {new Date(delay.date).toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-green-700 text-center">Vous êtes arrivé à l'heure 🎉</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeePage;