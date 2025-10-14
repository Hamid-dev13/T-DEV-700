import React, { useState, useEffect } from 'react';
import type { TeamMember } from '../types';
import { getUserClocks } from '../services/api';

interface MemberRowProps {
  member: TeamMember;
  teamStartHour: number; // Heure de début de l'équipe
}

const MemberRow: React.FC<MemberRowProps> = ({ member, teamStartHour }) => {
  const [todayClocks, setTodayClocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayClocks();
  }, [member.id]);

  const loadTodayClocks = async () => {
    try {
      // Récupère les pointages des derniers jours
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const clocks = await getUserClocks(member.id, from, to);
      
      // Filtre pour ne garder que les pointages d'aujourd'hui
      const today = new Date();
      const filteredClocks = clocks.filter(clockTime => {
        const clockDate = new Date(clockTime);
        return clockDate.toDateString() === today.toDateString();
      });
      
      setTodayClocks(filteredClocks);
    } catch (error) {
      console.error('Erreur chargement pointages:', error);
      setTodayClocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcul du statut : pair = non pointé, impair = pointé
  const isClockedIn = todayClocks.length > 0 && todayClocks.length % 2 !== 0;
  const lastClock = todayClocks.length > 0 ? new Date(todayClocks[todayClocks.length - 1]) : null;

  // Calcul du retard (même logique que EmployeePage)
  const calculateDelay = (): number | null => {
    if (todayClocks.length === 0 || !teamStartHour) return null;
    
    // Trouve le pointage le plus ancien (= première arrivée)
    const allTodayTimes = todayClocks.map(c => new Date(c).getTime());
    const earliestTime = Math.min(...allTodayTimes);
    const firstClockOfDay = new Date(earliestTime);
    
    const arrivalHour = firstClockOfDay.getHours();
    const arrivalMinutes = firstClockOfDay.getMinutes();
    const arrivalTotalMinutes = arrivalHour * 60 + arrivalMinutes;
    
    const expectedTotalMinutes = teamStartHour * 60;
    const delayMinutes = arrivalTotalMinutes - expectedTotalMinutes;
    
    return delayMinutes > 0 ? delayMinutes : 0;
  };

  const delayMinutes = calculateDelay();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 
                    hover:border-[#FFC933] transition-all duration-200">
      <div className="flex items-center justify-between">
        
        {/* Info membre */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-[#FFC933] rounded-full 
                        flex items-center justify-center text-lg font-bold text-[#1E2448]">
            {member.firstName[0]}{member.lastName[0]}
          </div>
          <div>
            <p className="font-semibold text-[#1E2448]">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-sm text-[#64748B]">{member.email}</p>
          </div>
        </div>

        {/* Statut du jour */}
        <div className="flex items-center gap-6">
          {loading ? (
            <div className="text-sm text-[#64748B]">Chargement...</div>
          ) : todayClocks.length === 0 ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Pas encore pointé</span>
            </div>
          ) : (
            <>
              {/* Dernier pointage */}
              <div className="text-right">
                <p className="text-xs text-[#64748B]">Dernier pointage</p>
                <p className="text-sm font-semibold text-[#1E2448]">
                  {lastClock?.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              {/* Nombre de pointages */}
              <div className="text-center bg-gray-50 rounded-lg px-3 py-2">
                <p className="text-xs text-[#64748B]">Pointages</p>
                <p className="text-lg font-bold text-[#1E2448]">{todayClocks.length}</p>
              </div>

              {/* Statut actuel */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg
                            ${isClockedIn 
                              ? 'bg-green-50 border border-green-400' 
                              : 'bg-gray-50 border border-gray-300'}`}>
                <div className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-semibold ${isClockedIn ? 'text-green-700' : 'text-gray-600'}`}>
                  {isClockedIn ? 'Présent' : 'Absent'}
                </span>
              </div>

              {/* Retard */}
              {delayMinutes !== null && delayMinutes > 0 ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-400">
                  <span className="text-lg">⚠️</span>
                  <div className="text-right">
                    <p className="text-xs text-red-600">Retard</p>
                    <p className="text-sm font-bold text-red-700">
                      {Math.floor(delayMinutes / 60)}h{String(delayMinutes % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>
              ) : delayMinutes === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-400">
                  <span className="text-sm">✅</span>
                  <span className="text-xs font-semibold text-green-700">À l'heure</span>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberRow;