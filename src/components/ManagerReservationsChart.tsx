import React from 'react';
import { TrendingUp } from 'lucide-react';

export function ManagerReservationsChart() {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-900">Réservations sur 7 jours</h4>
        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
          <TrendingUp size={12} />
          <span>+14% cette semaine</span>
        </span>
      </div>
      <div className="h-32 flex items-end justify-between gap-2 pt-4">
        {[20, 35, 50, 40, 75, 90, 65].map((val, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div 
              style={{ height: `${val}%` }} 
              className="w-full bg-orange-500 rounded-t-md transition-all hover:bg-orange-600" 
            />
            <span className="text-[9px] text-gray-400">J{idx + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
