import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAppStore } from '../store';

export function UserReservationsCalendar(props: any) {
  const { reservations } = useAppStore();

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 p-5 space-y-4 ${props.className || ''}`}>
      <div className="flex items-center gap-2">
        <CalendarIcon className="text-orange-600" size={18} />
        <h3 className="text-sm font-bold text-gray-900">Calendrier de vos réservations</h3>
      </div>

      <div className="space-y-3">
        {reservations.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">Aucune réservation à venir.</p>
        ) : (
          reservations.map(res => (
            <div key={res.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-gray-900">{res.establishmentName}</h4>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <CalendarIcon size={12} />
                    {res.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {res.time}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                res.status === 'confirmed' || res.status === 'confirmee' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {res.status === 'confirmed' || res.status === 'confirmee' ? 'Confirmée' : 'En attente'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
