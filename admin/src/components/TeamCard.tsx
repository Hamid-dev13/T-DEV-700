import { Calendar, Clock, Edit, Eye, Trash2, User as UserElement, Users as UsersIcon } from 'lucide-react';
import { Team, User } from "../utils/types";

interface TeamCardProps {
  team: Team;
  manager: User | null;
  onEdit?: (team: Team) => void;
  onDelete?: (team: Team) => void;
  onViewMembers?: (team: Team) => void;
}

function TeamCard({ team, manager, onEdit, onDelete, onViewMembers }: TeamCardProps) {
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-purple-600" />
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(team)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Modifier l'équipe"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(team)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Supprimer l'équipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
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

        {onViewMembers && (
          <div className="pt-3 border-t mt-3">
            <button
              onClick={() => onViewMembers(team)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium"
            >
              <Eye className="w-4 h-4" />
              Voir les membres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamCard;
