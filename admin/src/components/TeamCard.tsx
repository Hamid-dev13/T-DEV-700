import { Users as UsersIcon, Clock, Calendar, User as UserElement } from 'lucide-react';
import { Team, User } from "../utils/types";

interface TeamCardProps {
  team: Team;
  manager: User | null;
}

function TeamCard({ team, manager }: TeamCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-800">{team.name}</h3>
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">{team.description}</p>
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center text-sm text-gray-700">
          <UserElement className="w-4 h-4 mr-2 text-gray-400" />
          <span className="font-medium">Manager:</span>
          <span className="ml-2">
            {manager ? `${manager.firstName} ${manager.lastName}` : 'Non défini'}
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          <span>
            Horaires: {team.startHour}h - {team.endHour}h
          </span>
        </div>

        <div className="flex items-center text-sm text-gray-500 pt-2">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          Créée le {formatDate(team.createdAt)}
        </div>
      </div>
    </div>
  );
}

export default TeamCard;
