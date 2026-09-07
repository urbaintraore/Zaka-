import React, { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';

interface AdExpressWizardProps {
  isOpen?: boolean;
  onClose: () => void;
}

export function AdExpressWizard({ onClose }: AdExpressWizardProps) {
  const [budget, setBudget] = useState('5000');
  const [days, setDays] = useState('3');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="text-orange-600" size={20} />
          <h3 className="text-base font-bold text-gray-900">Sponsoring Express</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500">Budget (FCFA)</label>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500">Durée (Jours)</label>
            <input
              type="number"
              value={days}
              onChange={e => setDays(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            />
          </div>

          <div className="p-3 bg-orange-50 text-orange-900 rounded-xl text-xs">
            Portée estimée: <strong>~{parseInt(budget || '0') * 2} personnes</strong> sur Ouagadougou.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                alert('Sponsoring activé avec succès !');
                onClose();
              }}
              className="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
            >
              <Send size={14} />
              <span>Lancer le boost</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
