import React, { useState } from 'react';
import { Establishment, Hairdresser, Hairstyle } from '../types';
import { useAppStore } from '../store';
import { X, Users, Scissors } from 'lucide-react';

export function SalonManagement({ establishment }: { establishment: Establishment }) {
  const { updateHairSalonData } = useAppStore();
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>(establishment.hairSalonData?.hairdressers || []);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>(establishment.hairSalonData?.hairstyles || []);

  const handleUpdateQueue = async (hairdresserId: string, count: number) => {
    const updatedHairdressers = hairdressers.map(h => 
      h.id === hairdresserId ? { ...h, waitingClientsCount: count, lastUpdated: new Date().toISOString() } : h
    );
    setHairdressers(updatedHairdressers);
    await updateHairSalonData(establishment.id, { hairdressers: updatedHairdressers, hairstyles });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm mt-4">
      <h3 className="font-bold text-gray-900 mb-4">Gestion Salon de Coiffure</h3>
      
      {/* Hairdressers Queue */}
      <div className="mb-6">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">File d'attente (mise à jour toutes les 5h)</h4>
        <div className="grid gap-3">
          {hairdressers.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-sm">{h.name}</span>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={h.waitingClientsCount}
                  onChange={(e) => handleUpdateQueue(h.id, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 bg-white rounded-lg border border-gray-200 text-center text-sm font-bold"
                />
                <span className="text-xs text-gray-500">clients</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
