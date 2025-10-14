import React, { useState, useEffect } from 'react';
import { getUserClocks } from '../services/api';
import type { TeamMember } from '../types';

interface MemberCardProps {
  member: TeamMember;
}

const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  const [clocks, setClocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberClocks();
  }, [member.id]);

  const loadMemberClocks = async () => {
    try {
      // Récupère les pointages du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const memberClocks = await getUserClocks(
        member.id,
        today.toISOString(),
        tomorrow.toISOString()
      );
      setClocks(memberClocks);
    } catch (error) {
      console.error('Erreur chargement pointages:', error);
      setClocks([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcul du statut (pointé ou non)
  const isClockedIn = clocks.length > 0 && clocks.length % 2 !== 0;
  const lastClock = clocks.length > 0 ? new Date(clocks[0]) : null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-5 
                    hover:border-[#FFC933] transition-all duration-300
                    shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        {/* Infos membre */}
        <div className="flex items-center gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-[#FFC933] rounded-full 
                        flex items-center justify-center text-white font-bold text-lg">
            {member.firstName[0]}{member.lastName[0]}
          </div>

          {/* Nom et email */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#1E2448] truncate">
              {member.firstName} {member.lastName}
            </p>
            <p className="text-sm text-[#64748B] truncate">
              {member.email}
            </p>
          </div>
        </div>

        {/* Statut */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="text-xs text-[#64748B]">Chargement...</div>
          ) : clocks.length === 0 ? (
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-600">Absent</span>
            </div>
          ) : isClockedIn ? (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Présent</span>
              </div>
              {lastClock && (
                <span className="text-xs text-[#64748B]">
                  Depuis {lastClock.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-orange-100 px-3 py-2 rounded-lg mb-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-orange-700">Sorti</span>
              </div>
              {lastClock && (
                <span className="text-xs text-[#64748B]">
                  À {lastClock.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          )}

          {/* Nombre de pointages du jour */}
          {clocks.length > 0 && (
            <div className="bg-[#FFC933]/10 px-3 py-2 rounded-lg">
              <p className="text-xs text-[#64748B]">Pointages</p>
              <p className="text-lg font-bold text-[#1E2448] text-center">
                {clocks.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCard;