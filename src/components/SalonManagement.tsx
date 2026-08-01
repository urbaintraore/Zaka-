import React, { useState } from 'react';
import { Establishment, Hairdresser, Hairstyle } from '../types';
import { useAppStore } from '../store';
import { Users, Scissors, Plus, Trash2, AlertCircle } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export function SalonManagement({ establishment }: { establishment: Establishment }) {
  const { updateHairSalonData } = useAppStore();
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>(establishment.hairSalonData?.hairdressers || []);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>(establishment.hairSalonData?.hairstyles || []);

  const [newHairdresserName, setNewHairdresserName] = useState('');
  const [newHairstyleName, setNewHairstyleName] = useState('');
  const [newHairstyleGender, setNewHairstyleGender] = useState<'homme' | 'femme' | 'enfant'>('femme');
  const [newHairstylePrice, setNewHairstylePrice] = useState(5000);
  const [newHairstylePhoto, setNewHairstylePhoto] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdateQueue = async (hairdresserId: string, count: number) => {
    const updatedHairdressers = hairdressers.map(h => 
      h.id === hairdresserId ? { ...h, waitingClientsCount: count, lastUpdated: new Date().toISOString() } : h
    );
    setHairdressers(updatedHairdressers);
    await updateHairSalonData(establishment.id, { hairdressers: updatedHairdressers, hairstyles });
    
    try {
      await setDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', hairdresserId), {
        id: hairdresserId,
        establishmentId: establishment.id,
        name: updatedHairdressers.find(h => h.id === hairdresserId)?.name || '',
        waitingClientsCount: count,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Error updating coiffeur subcollection:", e);
    }
  };

  const handleAddHairdresser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHairdresserName.trim()) return;
    const newId = 'h_' + Date.now();
    const newH: Hairdresser = {
      id: newId,
      name: newHairdresserName.trim(),
      waitingClientsCount: 0,
      lastUpdated: new Date().toISOString()
    };
    const updatedHairdressers = [...hairdressers, newH];
    setHairdressers(updatedHairdressers);
    setNewHairdresserName('');
    await updateHairSalonData(establishment.id, { hairdressers: updatedHairdressers, hairstyles });
    
    try {
      await setDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', newId), {
        id: newId,
        establishmentId: establishment.id,
        name: newH.name,
        waitingClientsCount: 0,
        lastUpdated: newH.lastUpdated
      });
    } catch (e) {
      console.error("Error adding coiffeur subcollection:", e);
    }
  };

  const handleDeleteHairdresser = async (id: string) => {
    const updatedHairdressers = hairdressers.filter(h => h.id !== id);
    setHairdressers(updatedHairdressers);
    await updateHairSalonData(establishment.id, { hairdressers: updatedHairdressers, hairstyles });
    try {
      await deleteDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', id));
    } catch (e) {
      console.error("Error deleting coiffeur subcollection:", e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        const base64 = await compressImage(e.target.files[0], 800, 800, 0.7);
        setNewHairstylePhoto(base64);
      } catch (err) {
        console.error("Failed to compress hairstyle image", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddHairstyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHairstyleName.trim()) return;
    const newId = 'style_' + Date.now();
    const newS: Hairstyle = {
      id: newId,
      name: newHairstyleName.trim(),
      gender: newHairstyleGender,
      photoUrl: newHairstylePhoto || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400',
      price: newHairstylePrice
    };
    const updatedHairstyles = [...hairstyles, newS];
    setHairstyles(updatedHairstyles);
    setNewHairstyleName('');
    setNewHairstylePhoto('');
    await updateHairSalonData(establishment.id, { hairdressers, hairstyles: updatedHairstyles });
  };

  const handleDeleteHairstyle = async (id: string) => {
    const updatedHairstyles = hairstyles.filter(s => s.id !== id);
    setHairstyles(updatedHairstyles);
    await updateHairSalonData(establishment.id, { hairdressers, hairstyles: updatedHairstyles });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mt-4 space-y-8">
      <div>
        <h3 className="font-black text-lg text-gray-900 mb-1">Gestion Salon de Coiffure</h3>
        <p className="text-xs text-gray-500">Gérez vos coiffeurs (file d'attente mise à jour régulièrement) et votre catalogue de modèles de coiffures.</p>
      </div>
      
      {/* Hairdressers Queue Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-500" />
          Coiffeurs / Coiffeuses & File d'attente (Mise à jour toutes les 5h)
        </h4>

        <form onSubmit={handleAddHairdresser} className="flex gap-2">
          <input 
            type="text"
            placeholder="Nom complet du coiffeur/coiffeuse"
            value={newHairdresserName}
            onChange={e => setNewHairdresserName(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-orange-500 outline-none"
          />
          <button type="submit" className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-1 cursor-pointer">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </form>
        <p className="text-[11px] text-gray-500 flex items-start gap-1.5 bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
          <span>💡 <strong>Note :</strong> Saisissez simplement le nom complet. Les coiffeurs n'ont pas besoin de compte ou d'accès sur l'application, l'affichage sert uniquement à informer les clients du temps d'attente.</span>
        </p>

        <div className="grid gap-3">
          {hairdressers.map(h => (
            <div key={h.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-sm text-gray-900">{h.name}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number"
                    min="0"
                    value={h.waitingClientsCount}
                    onChange={(e) => handleUpdateQueue(h.id, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-center text-sm font-bold text-orange-600 focus:border-orange-500 outline-none"
                  />
                  <span className="text-xs font-medium text-gray-500">clients en attente</span>
                </div>
                <button 
                  onClick={() => handleDeleteHairdresser(h.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {hairdressers.length === 0 && (
            <p className="text-xs text-gray-400 italic">Aucun coiffeur ajouté. Ajoutez vos coiffeurs ci-dessus.</p>
          )}
        </div>
      </div>

      {/* Hairstyles Gallery Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Scissors className="w-4 h-4 text-orange-500" />
          Galerie des Modèles de Coiffures (Hommes, Femmes, Enfants)
        </h4>

        <form onSubmit={handleAddHairstyle} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Nom du modèle</label>
            <input 
              type="text"
              placeholder="Ex: Tresses africaines, Dégradé..."
              value={newHairstyleName}
              onChange={e => setNewHairstyleName(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Catégorie</label>
            <select
              value={newHairstyleGender}
              onChange={e => setNewHairstyleGender(e.target.value as any)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            >
              <option value="femme">Femme</option>
              <option value="homme">Homme</option>
              <option value="enfant">Enfant</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Prix estimé (FCFA)</label>
            <input 
              type="number"
              value={newHairstylePrice}
              onChange={e => setNewHairstylePrice(parseInt(e.target.value) || 0)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Photo du modèle</label>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
              />
              {isUploading && <span className="text-xs text-orange-600 animate-pulse font-bold">Compression...</span>}
            </div>
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="w-full py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Ajouter ce modèle à la galerie
            </button>
          </div>
        </form>

        {/* Display Hairstyles by Category */}
        <div className="space-y-6 pt-2">
          {(['femme', 'homme', 'enfant'] as const).map(cat => {
            const items = hairstyles.filter(h => h.gender === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h5 className="text-xs font-extrabold text-orange-600 uppercase tracking-widest border-b border-orange-100 pb-1">
                  Modèles {cat === 'femme' ? 'Femmes' : cat === 'homme' ? 'Hommes' : 'Enfants'} ({items.length})
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {items.map(h => (
                    <div key={h.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm flex flex-col">
                      <div className="h-32 bg-gray-100 relative">
                        <img src={h.photoUrl} alt={h.name} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => handleDeleteHairstyle(h.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer shadow"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <p className="font-bold text-xs text-gray-900 line-clamp-1">{h.name}</p>
                          <p className="text-[11px] font-black text-orange-600 mt-0.5">{h.price.toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {hairstyles.length === 0 && (
            <p className="text-xs text-gray-400 italic">Aucun modèle de coiffure dans la galerie pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
