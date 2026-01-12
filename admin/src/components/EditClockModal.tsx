import { Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateClockForMember } from '../utils/api';
import { getErrorMessage } from '../utils/errors';

interface EditClockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClockUpdated: () => void;
  userId: string;
  clock: { from: Date; to: Date } | null;
}

function EditClockModal({ isOpen, onClose, onClockUpdated, userId, clock }: EditClockModalProps) {
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oldFrom, setOldFrom] = useState<Date | null>(null);
  const [oldTo, setOldTo] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && clock) {
      setOldFrom(new Date(clock.from));
      setOldTo(new Date(clock.to));

      const from = new Date(clock.from);
      const to = new Date(clock.to);

      // Adjust for local timezone
      const fromLocal = new Date(from.getTime() - from.getTimezoneOffset() * 60000);
      const toLocal = new Date(to.getTime() - to.getTimezoneOffset() * 60000);

      setFromDate(fromLocal.toISOString().slice(0, 16));
      setToDate(toLocal.toISOString().slice(0, 16));
      setError('');
    }
  }, [isOpen, clock]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!oldFrom || !oldTo) {
      setError('Erreur : anciennes dates non disponibles');
      return;
    }

    const newFrom = new Date(fromDate);
    const newTo = new Date(toDate);

    if (newFrom >= newTo) {
      setError('L\'heure de début doit être antérieure à l\'heure de fin');
      return;
    }

    setLoading(true);

    try {
      await updateClockForMember(userId, oldFrom, oldTo, newFrom, newTo);
      onClockUpdated();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !clock) return null;

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
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Modifier un pointage</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure d'arrivée *
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de départ *
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditClockModal;

