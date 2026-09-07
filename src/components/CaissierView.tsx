import React, { useState } from 'react';
import { CreditCard, Search, LogOut } from 'lucide-react';
import { useAppStore } from '../store';

export function CaissierView({ 
  onLogout, 
  onNavigate, 
  onStartChatWithConv,
  initialEstablishmentId
}: { 
  onLogout?: () => void; 
  onNavigate?: (tab: any) => void; 
  onStartChatWithConv?: (convId: string) => void; 
  initialEstablishmentId?: string;
}) {
  const { reservations, updateReservationStatus } = useAppStore();
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Terminal Caissier</h2>
            <p className="text-xs text-gray-500">Validez les réservations et commandes à l'arrivée</p>
          </div>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl">
            <LogOut size={18} />
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Rechercher par nom de client ou ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Réservations à encaisser</h3>
        <div className="divide-y divide-gray-100">
          {reservations.map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{r.userName}</p>
                <p className="text-[10px] text-gray-500">{r.establishmentName} • {r.date} à {r.time} ({r.guestsCount} pers)</p>
              </div>
              <button
                onClick={() => updateReservationStatus(r.id, 'confirmed')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
              >
                Valider arrivée
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
