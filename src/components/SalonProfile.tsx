import React, { useEffect, useState } from 'react';
import { Establishment, Coiffeur } from '../types';
import { HairGallery } from './HairGallery';
import { Users } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export function SalonProfile({ establishment }: { establishment: Establishment }) {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const salonData = establishment.hairSalonData;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'establishments', establishment.id, 'coiffeurs'), (snapshot) => {
      const coiffeurList: Coiffeur[] = [];
      snapshot.forEach(doc => {
        coiffeurList.push({ id: doc.id, ...doc.data() } as Coiffeur);
      });
      setCoiffeurs(coiffeurList);
    });
    return unsub;
  }, [establishment.id]);

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
