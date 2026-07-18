import { useState } from 'react';
import { useAppStore } from '../store';
import { Heart, MapPin, MessageSquare, Calendar } from 'lucide-react';
import { ReservationModal } from '../components/ReservationModal';

interface FavoritesViewProps {
  onStartChat?: (estId: string) => void;
}

export function FavoritesView({ onStartChat }: FavoritesViewProps) {
  const { currentUser, favorites, establishments, toggleFavorite, createServiceRequest } = useAppStore();
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);

  if (!currentUser) {
    return (
      <div className="p-4 text-center mt-12 max-w-sm mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Connectez-vous</h2>
        <p className="text-gray-500 font-medium">Pour sauvegarder vos établissements favoris et les retrouver facilement.</p>
      </div>
    );
  }

  const myFavIds = favorites[currentUser.id] || [];
  const myFavs = establishments.filter(e => myFavIds.includes(e.id));

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

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h2 className="text-2xl font-black text-gray-900 mb-6">Mes Favoris</h2>
      
      <div className="flex flex-col gap-4">
        {myFavs.map(est => (
          <div key={est.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex gap-4 items-center">
            <img src={est.photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200'} alt={est.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-[16px] truncate">{est.name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1 font-medium truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{est.neighborhood}</span>
              </div>
            </div>
            
            <div className="flex items-center">
              {onStartChat && (
                <button 
                  onClick={() => onStartChat(est.id)}
                  className="p-3 text-orange-600 hover:bg-orange-50 rounded-full transition-colors active:scale-90"
                  title="Discuter"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => setReservationEst({ id: est.id, name: est.name })}
                className="p-3 text-orange-600 hover:bg-orange-50 rounded-full transition-colors active:scale-90"
                title="Réserver"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button onClick={() => toggleFavorite(currentUser.id, est.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-full transition-colors active:scale-90">
                <Heart className="w-5 h-5 fill-red-500" />
              </button>
            </div>
          </div>
        ))}

        {myFavs.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Vous n'avez pas encore de favoris.</p>
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
