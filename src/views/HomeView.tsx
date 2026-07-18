import { useState } from 'react';
import { useAppStore } from '../store';
import { MapPin, Tag, Flame, Sparkles, Star, MessageSquare, Calendar, Megaphone, X, Users, Heart } from 'lucide-react';
import { stripHtml } from '../utils/htmlHelpers';
import { ReservationModal } from '../components/ReservationModal';
import { Publication } from '../types';

interface HomeViewProps {
  onStartChat?: (estId: string) => void;
}

export function HomeView({ onStartChat }: HomeViewProps) {
  const { publications, establishments, currentUser, createServiceRequest, relationshipRequests, setGlobalError, favorites, toggleFavorite } = useAppStore();
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [filterMemberOnly, setFilterMemberOnly] = useState(false);

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

  const getEst = (id: string) => establishments.find(e => e.id === id);

  // Filter based on member status if active
  const joinedEstIds = currentUser
    ? relationshipRequests
        .filter(r => (r.initiatorId === currentUser.id || r.targetId === currentUser.id) && r.status === 'acceptee')
        .map(r => r.establishmentId)
    : [];

  const filteredPublications = filterMemberOnly
    ? publications.filter(p => joinedEstIds.includes(p.establishmentId))
    : publications;

  // Group by type
  const events = filteredPublications.filter(p => p.type === 'evenement');
  const promos = filteredPublications.filter(p => p.type === 'promo' || p.type === 'bon_plan');
  const annonces = filteredPublications.filter(p => p.type === 'annonce');
  
  const topEstablishments = [...establishments].sort((a,b) => b.averageRating - a.averageRating).slice(0, 5);

  const filteredEstablishments = filterMemberOnly
    ? establishments.filter(e => joinedEstIds.includes(e.id))
    : topEstablishments;

  return (
    <div className="flex flex-col gap-8 pb-24 max-w-3xl mx-auto">
      {/* Hero Banner Conviviale */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 px-6 pt-10 pb-12 rounded-b-[2rem] shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-3 leading-tight">
            Où s'enjailler <br/>
            <span className="text-orange-200">aujourd'hui ?</span>
          </h2>
          <p className="text-orange-100 mb-6 font-medium text-sm pr-8">
            Découvrez les meilleurs maquis, bars et restaurants près de chez vous.
          </p>
          <button className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Explorer la carte
          </button>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-8">
        {/* Filtres de flux */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMemberOnly(false)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${!filterMemberOnly ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tous les flux
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour filtrer par vos établissements membres.", type: 'info' });
                  return;
                }
                setFilterMemberOnly(true);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMemberOnly ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Mes clubs membres
            </button>
          </div>
          
          {filterMemberOnly && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 font-bold px-2.5 py-1 rounded-full animate-pulse">
              Filtre membre actif
            </span>
          )}
        </div>

        {filterMemberOnly && filteredPublications.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm max-w-sm mx-auto my-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Aucune publication membre</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {joinedEstIds.length === 0 
                ? "Vous n'avez pas encore rejoint d'établissement. Allez dans l'onglet 'Explorer' pour envoyer des demandes d'adhésion !"
                : "Les établissements dont vous êtes membre n'ont publié aucune annonce ou promo pour le moment."}
            </p>
          </div>
        )}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-black text-gray-900 tracking-tight">À la une</h2>
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-4 px-4">
              {events.map(event => {
                const est = getEst(event.establishmentId);
                const imageUrl = event.imageUrl || 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&q=80&w=800';
                return (
                  <div key={event.id} onClick={() => setSelectedPub(event)} className="min-w-[280px] w-[280px] snap-start bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md hover:border-gray-200 transition-all">
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                      <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg shadow-sm">
                        Événement
                      </div>
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate font-medium">{est?.name} • {est?.neighborhood}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {annonces.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Communiqués & Annonces</h2>
            </div>
            <div className="flex flex-col gap-3">
              {annonces.map(annonce => {
                const est = getEst(annonce.establishmentId);
                return (
                  <div key={annonce.id} onClick={() => setSelectedPub(annonce)} className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:border-blue-300 transition-colors p-4 flex gap-4 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200/50">
                      <Megaphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <div className="text-[11px] font-black text-blue-600 mb-0.5 uppercase tracking-wide">{est?.name}</div>
                      <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{annonce.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{stripHtml(annonce.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {promos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Promos & Bons Plans</h2>
            </div>
            <div className="flex flex-col gap-3">
              {promos.map(promo => {
                const est = getEst(promo.establishmentId);
                return (
                  <div key={promo.id} onClick={() => setSelectedPub(promo)} className="bg-white rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 transition-colors p-4 flex gap-4 cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex-shrink-0 flex items-center justify-center border border-orange-200/50">
                      <Tag className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <div className="text-[11px] font-black text-orange-600 mb-0.5 uppercase tracking-wide">{est?.name}</div>
                      <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{promo.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{stripHtml(promo.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight">
            {filterMemberOnly ? "Mes Clubs Membres" : "Lieux Populaires"}
          </h2>
          <div className="flex flex-col gap-4">
            {filteredEstablishments.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100 animate-bounce">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Aucun club membre</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Vous n'avez pas encore rejoint d'établissement. Allez dans l'onglet <strong className="text-orange-600 font-bold">Explorer</strong> pour demander l'adhésion à des établissements !
                </p>
              </div>
            ) : (
              filteredEstablishments.map(est => {
                const imageUrl = est.photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800';
                return (
                  <div key={est.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-32 relative">
                       <img src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute bottom-3 right-3 flex items-center gap-1 text-yellow-400 font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-sm">
                         <Star className="w-4 h-4 fill-yellow-400" /> {est.averageRating.toFixed(1)}
                       </div>
                       {currentUser && (
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             await toggleFavorite(currentUser.id, est.id);
                           }}
                           className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all active:scale-90 text-white"
                           title={(favorites[currentUser.id] || []).includes(est.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                         >
                           <Heart className={`w-4 h-4 ${(favorites[currentUser.id] || []).includes(est.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                         </button>
                       )}
                    </div>
                    <div className="p-4 flex gap-4 items-center justify-between">
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-0.5 truncate">{est.name}</h3>
                        <p className="text-sm text-gray-500 capitalize font-medium truncate">{est.category.replace(/_/g, ' ')} • {est.neighborhood}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {onStartChat && (
                          <button 
                            onClick={() => onStartChat(est.id)}
                            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-shrink-0"
                            title="Discuter"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setReservationEst({ id: est.id, name: est.name })}
                          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-shrink-0"
                          title="Réserver"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
      
      {reservationEst && (
        <ReservationModal
          establishmentName={reservationEst.name}
          onClose={() => setReservationEst(null)}
          onSubmit={handleReservationSubmit}
        />
      )}

      {/* Publication Details Modal */}
      {selectedPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                  {selectedPub.type === 'evenement' ? 'Événement' : selectedPub.type === 'annonce' ? 'Communiqué' : 'Promo / Bon plan'}
                </span>
                <h2 className="text-lg font-black text-gray-900 leading-tight mt-1.5 truncate">{selectedPub.title}</h2>
                <p className="text-xs text-gray-500 font-bold mt-0.5">Par {getEst(selectedPub.establishmentId)?.name || 'Établissement'}</p>
              </div>
              <button onClick={() => setSelectedPub(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer flex-shrink-0 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {selectedPub.imageUrl && (
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                  <img src={selectedPub.imageUrl} alt={selectedPub.title} className="w-full h-full object-cover" />
                </div>
              )}

              {(selectedPub.startDate || selectedPub.endDate) && (
                <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-orange-800 font-bold">
                  <Calendar className="w-4 h-4 text-orange-600 animate-pulse" />
                  <span>
                    {selectedPub.startDate && `Du ${new Date(selectedPub.startDate).toLocaleDateString('fr-FR')}`}
                    {selectedPub.endDate && ` au ${new Date(selectedPub.endDate).toLocaleDateString('fr-FR')}`}
                  </span>
                </div>
              )}

              <div className="text-gray-600 text-sm mb-5 leading-relaxed prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedPub.description }} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex-shrink-0 flex gap-3">
              <button
                onClick={() => setSelectedPub(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs text-center"
              >
                Fermer
              </button>
              {onStartChat && (
                <button
                  onClick={() => {
                    const estId = selectedPub.establishmentId;
                    setSelectedPub(null);
                    onStartChat(estId);
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter l'établissement
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
