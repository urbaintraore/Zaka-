import { useState } from 'react';
import { useAppStore } from '../store';
import { MapPin, Tag, Flame, Sparkles, Star, MessageSquare, Calendar } from 'lucide-react';
import { stripHtml } from '../utils/htmlHelpers';
import { ReservationModal } from '../components/ReservationModal';

interface HomeViewProps {
  onStartChat?: (estId: string) => void;
}

export function HomeView({ onStartChat }: HomeViewProps) {
  const { publications, establishments, currentUser, createServiceRequest } = useAppStore();
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

  const getEst = (id: string) => establishments.find(e => e.id === id);

  // Group by type
  const events = publications.filter(p => p.type === 'evenement');
  const promos = publications.filter(p => p.type === 'promo' || p.type === 'bon_plan');
  
  const topEstablishments = [...establishments].sort((a,b) => b.averageRating - a.averageRating).slice(0, 5);

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
                <div key={event.id} className="min-w-[280px] w-[280px] snap-start bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group">
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

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Promos & Bons Plans</h2>
          </div>
          <div className="flex flex-col gap-3">
            {promos.map(promo => {
              const est = getEst(promo.establishmentId);
              return (
                <div key={promo.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 transition-colors p-4 flex gap-4">
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

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight">Lieux Populaires</h2>
          <div className="flex flex-col gap-4">
            {topEstablishments.map(est => {
              const imageUrl = est.photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800';
              return (
                <div key={est.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 relative">
                     <img src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                     <div className="absolute bottom-3 right-3 flex items-center gap-1 text-yellow-400 font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-sm">
                       <Star className="w-4 h-4 fill-yellow-400" /> {est.averageRating.toFixed(1)}
                     </div>
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
            })}
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
    </div>
  );
}
