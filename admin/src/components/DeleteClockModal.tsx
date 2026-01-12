import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { deleteClockForMember } from '../utils/api';
import { getErrorMessage } from '../utils/errors';

interface DeleteClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClockDeleted: () => void;
  userId: string;
  clockDate: Date | null;
}

function DeleteClockModal({ isOpen, onClose, onClockDeleted, userId, clockDate }: DeleteClockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!clockDate) return;

    setLoading(true);
    setError('');

    try {
      await deleteClockForMember(userId, clockDate);
      onClockDeleted();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !clockDate) return null;

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

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
          <h2 className="text-2xl font-bold text-gray-800">Supprimer le pointage</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Êtes-vous sûr de vouloir supprimer le pointage du{' '}
          <span className="font-semibold">{formatDateTime(clockDate)}</span> ?
          <br />
          <span className="text-red-600 font-medium">
            Cette action est irréversible.
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
            onClick={handleConfirm}
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

export default DeleteClockModal;

