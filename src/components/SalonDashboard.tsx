import React, { useState, useEffect } from 'react';
import { Establishment, Coiffeur, Reservation, Review } from '../types';
import { useAppStore } from '../store';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Users, Scissors, Clock, CheckCircle, XCircle, MessageSquare, Star, Plus, Trash2, AlertCircle } from 'lucide-react';

export function SalonDashboard({ establishment }: { establishment: Establishment }) {
  const [coiffeurs, setCoiffeurs] = useState<Coiffeur[]>([]);
  const [newHairdresserName, setNewHairdresserName] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);

  const { 
    reservations, 
    updateReservationStatus, 
    reviews, 
    replyToReview,
    updateHairSalonData 
  } = useAppStore();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'establishments', establishment.id, 'coiffeurs'), (snapshot) => {
      const coiffeurList: Coiffeur[] = [];
      snapshot.forEach(docSnap => {
        coiffeurList.push({ id: docSnap.id, ...docSnap.data() } as Coiffeur);
      });
      setCoiffeurs(coiffeurList);
    });
    return unsub;
  }, [establishment.id]);

  const updateClientCount = async (coiffeurId: string, count: number) => {
    const validCount = Math.max(0, count);
    const now = new Date().toISOString();
    
    // Update subcollection
    try {
      await updateDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', coiffeurId), {
        waitingClientsCount: validCount,
        lastUpdated: now
      });

      // Also sync to establishment's hairSalonData hairdressers array if applicable
      const updatedHairdressers = (establishment.hairSalonData?.hairdressers || []).map(h => 
        h.id === coiffeurId ? { ...h, waitingClientsCount: validCount, lastUpdated: now } : h
      );
      await updateHairSalonData(establishment.id, {
        hairdressers: updatedHairdressers,
        hairstyles: establishment.hairSalonData?.hairstyles || []
      });
    } catch (e) {
      console.error("Erreur mise à jour file d'attente:", e);
    }
  };

  const handleAddHairdresser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHairdresserName.trim()) return;
    const newId = 'h_' + Date.now();
    const now = new Date().toISOString();
    const newCoiffeur: Coiffeur = {
      id: newId,
      establishmentId: establishment.id,
      name: newHairdresserName.trim(),
      waitingClientsCount: 0,
      lastUpdated: now
    };

    try {
      await setDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', newId), newCoiffeur);
      
      const currentHairdressers = establishment.hairSalonData?.hairdressers || [];
      const updatedHairdressers = [...currentHairdressers, {
        id: newId,
        name: newCoiffeur.name,
        waitingClientsCount: 0,
        lastUpdated: now
      }];

      await updateHairSalonData(establishment.id, {
        hairdressers: updatedHairdressers,
        hairstyles: establishment.hairSalonData?.hairstyles || []
      });

      setNewHairdresserName('');
    } catch (e) {
      console.error("Erreur ajout coiffeur:", e);
    }
  };

  const handleDeleteHairdresser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'establishments', establishment.id, 'coiffeurs', id));
      const updatedHairdressers = (establishment.hairSalonData?.hairdressers || []).filter(h => h.id !== id);
      await updateHairSalonData(establishment.id, {
        hairdressers: updatedHairdressers,
        hairstyles: establishment.hairSalonData?.hairstyles || []
      });
    } catch (e) {
      console.error("Erreur suppression coiffeur:", e);
    }
  };

  const estReservations = reservations.filter(r => r.establishmentId === establishment.id);
  const estReviews = reviews.filter(rev => rev.establishmentId === establishment.id);

  const handleReplySubmit = async (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text || !text.trim()) return;
    try {
      await replyToReview(reviewId, text.trim());
      setReplyingReviewId(null);
      setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
    } catch (e) {
      console.error("Erreur réponse avis:", e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
            Espace Gérant - Salon de Coiffure
          </span>
          <h2 className="text-2xl font-black">{establishment.name}</h2>
          <p className="text-xs text-orange-100 mt-1">
            {establishment.city} • {establishment.neighborhood} • {establishment.phone}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-md">
          <Scissors className="w-5 h-5 text-white" />
          <span className="text-xs font-bold">{coiffeurs.length} coiffeur(s) actif(s)</span>
        </div>
      </div>

      {/* Section 1 & 2: Dynamic List of Hairdressers & Waiting Clients form (Every 5 hours / Manual) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Gestion des Coiffeurs & File d'attente (Mise à jour recommandée toutes les 5h)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Mettez à jour le nombre de clients en attente pour chaque coiffeur en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
            <Clock className="w-4 h-4" />
            <span>Rappel : Actualisez toutes les 5 heures</span>
          </div>
        </div>

        {/* Add Hairdresser Form */}
        <form onSubmit={handleAddHairdresser} className="flex gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <input 
            type="text"
            placeholder="Nom complet du coiffeur / coiffeuse (ex: Ibrahim, Aminata...)"
            value={newHairdresserName}
            onChange={e => setNewHairdresserName(e.target.value)}
            className="flex-1 px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none text-xs font-medium"
          />
          <button 
            type="submit"
            className="px-5 py-3 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter le coiffeur
          </button>
        </form>
        <p className="text-[11px] text-gray-500 flex items-start gap-1.5 mt-1 bg-orange-50/50 p-3 rounded-xl border border-orange-100/50 leading-relaxed">
          <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
          <span>💡 <strong>Note importante :</strong> Saisissez simplement le nom complet du coiffeur/coiffeuse. Il n'est pas nécessaire de créer un compte d'accès pour eux sur l'application. Cette liste sert uniquement d'affichage pour informer vos clients du nombre de personnes en attente.</span>
        </p>

        {/* Hairdressers List & Queue Control */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coiffeurs.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-gray-500">Aucun coiffeur enregistré pour le moment.</p>
              <p className="text-[11px] text-gray-400 mt-1">Utilisez le formulaire ci-dessus pour ajouter votre équipe.</p>
            </div>
          ) : (
            coiffeurs.map(c => {
              const lastUpdatedFormatted = c.lastUpdated 
                ? new Date(c.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : 'Jamais';

              return (
                <div key={c.id} className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{c.name}</h4>
                      <span className="text-[10px] text-gray-400">Dernière maj : {lastUpdatedFormatted}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteHairdresser(c.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Supprimer ce coiffeur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                        {c.waitingClientsCount}
                      </div>
                      <span className="text-xs font-bold text-gray-700">Clients en attente</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        type="button"
                        onClick={() => updateClientCount(c.id, c.waitingClientsCount - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        min="0"
                        value={c.waitingClientsCount}
                        onChange={(e) => updateClientCount(c.id, parseInt(e.target.value) || 0)}
                        className="w-14 text-center py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs font-bold text-gray-800 outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => updateClientCount(c.id, c.waitingClientsCount + 1)}
                        className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Invitation / Reservation Validation */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-orange-500" />
            Demandes de Réservation & Invitations Salon
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Gérez les demandes de rendez-vous ou de passage envoyées par vos clients.
          </p>
        </div>

        {estReservations.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">Aucune demande de réservation en attente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {estReservations.map(res => (
              <div key={res.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{res.clientName}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      res.status === 'confirmee' ? 'bg-green-100 text-green-700' :
                      res.status === 'refusee' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {res.status === 'confirmee' ? 'Confirmée' : res.status === 'refusee' ? 'Refusée' : 'En attente'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    📅 Date : <strong className="text-gray-800">{res.date}</strong> à <strong className="text-gray-800">{res.time}</strong> • Personnes : <strong className="text-gray-800">{res.guestsCount}</strong>
                  </p>
                  {res.clientPhone && (
                    <p className="text-xs text-gray-500">📞 Tél : {res.clientPhone}</p>
                  )}
                  {res.note && (
                    <p className="text-xs italic text-gray-500 bg-white p-2 rounded-xl border border-gray-100 mt-1">
                      "{res.note}"
                    </p>
                  )}
                </div>

                {res.status === 'en_attente' && (
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'confirmee')}
                      className="flex-1 md:flex-none px-4 py-2 bg-green-600 text-white font-bold text-xs rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" /> Accepter
                    </button>
                    <button 
                      onClick={() => updateReservationStatus(res.id, 'refusee')}
                      className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Received Client Reviews */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Avis Clients Reçus ({estReviews.length})
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Note moyenne : <strong className="text-orange-600">{establishment.averageRating || 0}/5</strong>
          </p>
        </div>

        {estReviews.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Star className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-500">Aucun avis client pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {estReviews.map(rev => (
              <div key={rev.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-xs">
                      💬
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">Client</h4>
                      <span className="text-[10px] text-gray-400">
                        {new Date(rev.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-600 text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{rev.rating}/5</span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {rev.comment}
                </p>

                {(rev as any).reply && (
                  <div className="mt-3 p-3 bg-orange-50/60 rounded-xl border border-orange-100 text-xs text-orange-900">
                    <strong className="block font-bold mb-1 text-orange-700">Votre réponse :</strong>
                    <p className="font-medium">{(rev as any).reply}</p>
                  </div>
                )}

                {!(rev as any).reply && (
                  <div>
                    {replyingReviewId === rev.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea 
                          rows={2}
                          placeholder="Écrivez votre réponse au client..."
                          value={replyTexts[rev.id] || ''}
                          onChange={e => setReplyTexts(prev => ({ ...prev, [rev.id]: e.target.value }))}
                          className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs font-medium focus:border-orange-500 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => setReplyingReviewId(null)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-bold"
                          >
                            Annuler
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleReplySubmit(rev.id)}
                            className="px-4 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition-colors shadow-sm"
                          >
                            Envoyer la réponse
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setReplyingReviewId(rev.id)}
                        className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Répondre à cet avis
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
