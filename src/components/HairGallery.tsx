import React from 'react';
import { Hairstyle } from '../types';

export function HairGallery({ hairstyles }: { hairstyles: Hairstyle[] }) {
  const categories = ['homme', 'femme', 'enfant'];

  return (
    <div className="space-y-6">
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="text-lg font-bold text-gray-900 capitalize mb-2">{cat}</h3>
          <div className="grid grid-cols-2 gap-4">
            {hairstyles.filter(h => h.gender === cat).map(h => (
              <div key={h.id} className="border p-2 rounded-lg">
                <img src={h.photoUrl} alt={h.name} className="w-full h-32 object-cover rounded-lg" />
                <p className="font-bold text-sm mt-2">{h.name}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
