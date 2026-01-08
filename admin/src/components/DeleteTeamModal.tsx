import { AlertTriangle, X } from 'lucide-react';
import { Team } from '../utils/types';

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: Team | null;
  loading: boolean;
}

function DeleteTeamModal({ isOpen, onClose, onConfirm, team, loading }: DeleteTeamModalProps) {
  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Supprimer l'équipe</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer l'équipe{' '}
          <span className="font-semibold">{team.name}</span> ?
          <br />
          <span className="text-red-600 font-medium">
            Cette action est irréversible et supprimera également tous les membres de l'équipe.
          </span>
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTeamModal;

