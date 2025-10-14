import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TeamCard from '../components/TeamCard';
import MemberRow from '../components/MemberRow';
import { useAuth } from '../context/AuthContext';
import { getUserTeams } from '../services/api';
import type { UserTeam } from '../types';

const ManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<UserTeam | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const allTeams = await getUserTeams();
      const managedTeams = allTeams.filter(teamData => 
        teamData.team.managerId === user?.id
      );
      setTeams(managedTeams);
    } catch (error) {
      console.error('Erreur lors du chargement des équipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = (teamData: UserTeam) => {
    setSelectedTeam(teamData);
  };

  const handleBackToDashboard = () => {
    setSelectedTeam(null);
  };

  // SI UNE ÉQUIPE EST SÉLECTIONNÉE : Vue détails
  if (selectedTeam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Bouton retour */}
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-[#64748B] hover:text-[#1E2448] 
                     mb-6 transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Retour au dashboard</span>
          </button>

          {/* En-tête de l'équipe */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#1E2448] mb-2">
                  {selectedTeam.team.name}
                </h1>
                <p className="text-[#64748B] mb-4">
                  {selectedTeam.team.description}
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B]">Horaires:</span>
                    <span className="font-semibold text-[#1E2448]">
                      {selectedTeam.team.startHour}h - {selectedTeam.team.endHour}h
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#64748B]">Membres:</span>
                    <span className="font-semibold text-[#1E2448]">
                      {selectedTeam.members.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 bg-[#FFC933]/10 rounded-full 
                          flex items-center justify-center">
                <span className="text-3xl">👥</span>
              </div>
            </div>
          </div>

          {/* Liste des membres */}
          <div>
            <h2 className="text-xl font-bold text-[#1E2448] mb-4">
              Membres de l'équipe ({selectedTeam.members.length})
            </h2>
            
            <div className="space-y-3">
              {selectedTeam.members.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member}
                  teamStartHour={selectedTeam.team.startHour}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SINON : Dashboard avec la liste des équipes
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E2448] mb-2">
            Interface Manager
          </h1>
          <p className="text-[#64748B]">
            Gérez vos équipes et suivez les pointages
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#FFC933] border-t-transparent"></div>
            <p className="mt-4 text-[#64748B]">Chargement des équipes...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-[#1E2448] mb-2">
              Aucune équipe à gérer
            </h2>
            <p className="text-[#64748B]">
              Vous ne gérez actuellement aucune équipe
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FFC933]/10 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Équipes gérées</p>
                    <p className="text-3xl font-bold text-[#1E2448]">{teams.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Total membres</p>
                    <p className="text-3xl font-bold text-[#1E2448]">
                      {teams.reduce((acc, t) => acc + t.members.length, 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">⏰</span>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Plages horaires</p>
                    <p className="text-lg font-bold text-[#1E2448]">
                      {Math.min(...teams.map(t => t.team.startHour))}h - {Math.max(...teams.map(t => t.team.endHour))}h
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1E2448] mb-4">
                Mes équipes ({teams.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((teamData) => (
                  <TeamCard
                    key={teamData.team.id}
                    teamData={teamData}
                    onClick={() => handleTeamClick(teamData)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerPage;