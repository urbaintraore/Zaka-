import React from 'react';
import { Establishment, Coiffeur } from '../types';
import { HairGallery } from './HairGallery';

export function SalonProfile({ establishment }: { establishment: Establishment }) {
  const coiffeurs = (establishment.hairSalonData?.hairdressers || []) as Coiffeur[];
  const salonData = establishment.hairSalonData;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl">
        <h4 className="text-sm font-bold text-gray-500 mb-3">Clients en attente</h4>
        <div className="space-y-2">
          {coiffeurs.map(c => (
            <div key={c.id} className="flex justify-between text-sm">
              <span>{c.name}</span>
              <span className="font-bold text-orange-600">{c.waitingClientsCount} clients</span>
            </div>
          ))}
        </div>
      </div>

      {salonData && <HairGallery hairstyles={salonData.hairstyles || []} />}
    </div>
  );
}
