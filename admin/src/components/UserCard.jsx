import { Mail, Phone, Shield, User as UserIcon, Calendar } from 'lucide-react';

function UserCard({ user }) {
  const formatDate = (date) => {
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
    </div>
  );
}

export default UserCard;
