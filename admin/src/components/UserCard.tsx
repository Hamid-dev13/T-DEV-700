import { Mail, Phone, Shield, User as UserIcon, Calendar, Edit2, Trash2 } from 'lucide-react';
import { User } from "../utils/types";


interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {user.firstName} {user.lastName}
            </h3>
            {user.admin && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2 text-gray-400" />
          {user.email}
        </div>

        {user.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            {user.phone}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500 pt-2">
          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
          Créé le {formatDate(user.createdAt)}
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button
          onClick={() => onEdit(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
        >
          <Edit2 className="w-4 h-4" />
          Modifier
        </button>
        <button
          onClick={() => onDelete(user)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}

export default UserCard;
