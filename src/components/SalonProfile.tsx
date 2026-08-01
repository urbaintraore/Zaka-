import React from 'react';
import { Establishment } from '../types';
import { HairGallery } from './HairGallery';
import { Users } from 'lucide-react';

export function SalonProfile({ establishment }: { establishment: Establishment }) {
  const salonData = establishment.hairSalonData;

  if (!salonData) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-4">
        <Users className="w-8 h-8 text-orange-500" />
        <div>
          <p className="text-sm font-bold text-gray-500">Nombre de coiffeurs</p>
          <p className="text-2xl font-black text-gray-900">
            {salonData.hairdressers ? salonData.hairdressers.length : 0}
          </p>
        </div>
      </div>

      <HairGallery hairstyles={salonData.hairstyles || []} />
    </div>
  );
}
