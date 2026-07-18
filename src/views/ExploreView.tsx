import { useState } from 'react';
import { useAppStore } from '../store';
import { Search, MapPin, MessageSquare, Calendar, Heart } from 'lucide-react';
import { ReservationModal } from '../components/ReservationModal';

interface ExploreViewProps {
  onStartChat?: (estId: string, recipient?: 'gerant' | 'dj') => void;
  onNavigate?: (tab: any) => void;
}

export function ExploreView({ onStartChat, onNavigate }: ExploreViewProps) {
  const { establishments, currentUser, relationshipRequests, createRelationshipRequest, createServiceRequest, setGlobalError, users, favorites, toggleFavorite } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);

  const handleReservationSubmit = (data: { reservationType: string, date: string, time: string, guests: number, details: string }) => {
    if (!currentUser || !reservationEst) return;
    
    const isAnniv = data.reservationType === 'anniversaire';
    
    createServiceRequest({
      clientId: currentUser.id,
      establishmentId: reservationEst.id,
      type: isAnniv ? 'anniversaire' : 'reservation',
      details: `Date: ${data.date} à ${data.time} | Places: ${data.guests} | Type: ${data.reservationType}${data.details ? ` | Note: ${data.details}` : ''}`
    });
  };

  const filtered = establishments.filter(est => {
    if (est.status === 'suspendu') return false;
    if (category !== 'all' && est.category !== category) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = (est.name || '').toLowerCase().includes(searchLower);
      const neighborhoodMatch = (est.neighborhood || '').toLowerCase().includes(searchLower);
      if (!nameMatch && !neighborhoodMatch) return false;
    }
    return true;
  });

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 mb-4">Explorer</h2>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un lieu, quartier..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {['all', 'maquis', 'bar', 'restaurant', 'boite_de_nuit'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${category === cat ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-200'}`}
            >
              {cat === 'all' ? 'Tout' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map(est => {
          const djRequests = relationshipRequests.filter(r => r.establishmentId === est.id && r.status === 'acceptee' && r.isDJ);
          const djs = djRequests.map(r => {
            const djId = r.type === 'client_join' ? r.initiatorId : r.targetId;
            return users.find(u => u.id === djId);
          }).filter(Boolean);

          return (
            <div key={est.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gray-200 relative">
                <img src={est.photos[0] || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800'} alt={est.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-sm font-bold text-gray-900 flex items-center gap-1 shadow-sm">
                  <span className="text-yellow-500">★</span> {est.averageRating.toFixed(1)}
                </div>
                {currentUser && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await toggleFavorite(currentUser.id, est.id);
                    }}
                    className="absolute top-3 left-3 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all active:scale-90 text-white"
                    title={(favorites[currentUser.id] || []).includes(est.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Heart className={`w-4 h-4 ${(favorites[currentUser.id] || []).includes(est.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                  </button>
                )}
              </div>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-1">{est.category.replace(/_/g, ' ')}</div>
                  <h3 className="font-bold text-gray-900 text-lg truncate">{est.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 font-medium truncate">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{est.address}, {est.neighborhood}</span>
                  </div>
                  {djs.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50/70 border border-purple-100 px-2.5 py-1 rounded-lg w-fit">
                      <span className="text-xs">🎧</span>
                      <span>DJ : {djs.map(dj => dj?.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              {onStartChat && (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                  {(() => {
                    const req = relationshipRequests.find(r => r.establishmentId === est.id && (r.initiatorId === currentUser?.id || r.targetId === currentUser?.id));
                    if (!req) {
                      return (
                        <button
                          onClick={async () => {
                            if (!currentUser) {
                              setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour rejoindre cet établissement.", type: 'info' });
                              if (onNavigate) onNavigate('profile');
                              return;
                            }
                            try {
                              await createRelationshipRequest({ 
                                initiatorId: currentUser.id, 
                                targetId: est.ownerId, 
                                establishmentId: est.id, 
                                type: 'client_join' 
                              });
                              alert("Demande d'adhésion envoyée avec succès !");
                            } catch (err) {
                              console.error(err);
                              alert("Erreur lors de l'envoi de la demande.");
                            }
                          }}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Rejoindre
                        </button>
                      );
                    }
                    if (req.status === 'en_attente') {
                      return (
                        <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-yellow-50 text-yellow-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                          En attente
                        </span>
                      );
                    }
                    if (req.status === 'acceptee') {
                      return (
                        <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-50 text-green-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                          Membre ✓
                        </span>
                      );
                    }
                    return (
                      <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-red-50 text-red-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                        Refusé
                      </span>
                    );
                  })()}
                  {djs.length > 0 ? (
                    <>
                      <button
                        onClick={() => onStartChat(est.id, 'gerant')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                        title="Contacter le Gérant"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Gérant
                      </button>
                      <button
                        onClick={() => onStartChat(est.id, 'dj')}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                        title="Contacter le DJ"
                      >
                        <span>🎧</span>
                        DJ
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onStartChat(est.id, 'gerant')}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Discuter
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour réserver.", type: 'info' });
                        if (onNavigate) onNavigate('profile');
                        return;
                      }
                      setReservationEst({ id: est.id, name: est.name });
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    Réserver
                  </button>
                </div>
              )}
            </div>
          </div>
        )})}

        {filtered.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
            Aucun résultat trouvé.
          </div>
        )}
      </div>

      {reservationEst && (
        <ReservationModal
          establishmentName={reservationEst.name}
          onClose={() => setReservationEst(null)}
          onSubmit={handleReservationSubmit}
        />
      )}
    </div>
  );
}
