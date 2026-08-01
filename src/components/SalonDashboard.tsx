import React, { useState, useEffect } from 'react';
import { Establishment, Coiffeur } from '../types';
import { useAppStore } from '../store';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, onSnapshot } from 'firebase/firestore';

export function SalonDashboard({ establishment }: { establishment: Establishment }) {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const { user } = useAppStore();

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

  const updateClientCount = async (coiffeurId: string, count: number) => {
    await updateDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', coiffeurId), {
      waitingClientsCount: count,
      lastUpdated: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h2 className="text-lg font-bold mb-4">Tableau de bord - Clients en attente</h2>
      <div className="space-y-3">
        {coiffeurs.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span>{c.name}</span>
            <input 
              type="number"
              value={c.waitingClientsCount}
              onChange={(e) => updateClientCount(c.id, parseInt(e.target.value))}
              className="w-20 p-1 border rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
