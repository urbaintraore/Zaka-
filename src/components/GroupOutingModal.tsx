import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useAppStore } from '../store';

interface GroupOutingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  preselectedFriendId?: string;
}

export function GroupOutingModal({ onClose, preselectedFriendId }: GroupOutingModalProps) {
  const { establishments } = useAppStore();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [establishmentId, setEstablishmentId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Sortie de groupe créée avec succès !');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-base font-bold text-gray-900">Organiser une sortie de groupe</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500">Titre de la sortie</label>
            <input
              type="text"
              required
              placeholder="ex: Soirée Grillades entre amis"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-500">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Heure</label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Établissement (Optionnel)</label>
            <select
              value={establishmentId}
              onChange={e => setEstablishmentId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            >
              <option value="">Sélectionner un lieu</option>
              {establishments.map(est => (
                <option key={est.id} value={est.id}>{est.name} ({est.city})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl"
            >
              Créer la sortie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
