import React from 'react';
import type { UserTeam } from '../types';

interface TeamCardProps {
  teamData: UserTeam;
  onClick: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ teamData, onClick }) => {
  const { team, members } = teamData;

  return (
    <div 
      className="bg-white border-2 border-gray-200 rounded-xl p-6 
                 hover:border-[#FFC933] hover:shadow-lg
                 transition-all duration-300
                 transform hover:scale-102"
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#1E2448] mb-1">
            {team.name}
          </h3>
          <p className="text-sm text-[#64748B]">
            {team.description}
          </p>
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-[#FFC933]/10 rounded-full 
                        flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-[#64748B] mb-1">Membres</p>
          <p className="text-2xl font-bold text-[#1E2448]">
            {members.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-[#64748B] mb-1">Horaires</p>
          <p className="text-lg font-bold text-[#1E2448]">
            {team.startHour}h - {team.endHour}h
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex -space-x-2">
          {members.slice(0, 3).map((member, index) => (
            <div 
              key={member.id}
              className="w-8 h-8 bg-[#FFC933] rounded-full border-2 border-white
                       flex items-center justify-center text-xs font-bold text-[#1E2448]"
              title={`${member.firstName} ${member.lastName}`}
            >
              {member.firstName[0]}{member.lastName[0]}
            </div>
          ))}
          {members.length > 3 && (
            <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white
                          flex items-center justify-center text-xs font-bold text-gray-600">
              +{members.length - 3}
            </div>
          )}
        </div>
        <button
          onClick={onClick}
          className="flex items-center gap-2 text-[#FFC933] hover:text-[#FFBF00]
                   font-semibold transition-colors duration-200"
        >
          <span className="text-sm">Voir les détails</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TeamCard;