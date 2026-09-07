import React from 'react';
import { PieChart } from 'lucide-react';

export interface UserEstablishmentPreferencesChartProps {
  currentUser?: any;
  establishments?: any[];
  favorites?: string[];
  reservations?: any[];
  onNavigateToExplore?: () => void;
  [key: string]: any;
}

export const UserEstablishmentPreferencesChart: React.FC<UserEstablishmentPreferencesChartProps> = (props) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <PieChart className="text-orange-600" size={18} />
        <h3 className="text-sm font-bold text-gray-900">Vos préférences de sorties</h3>
      </div>
      <div className="space-y-2 pt-2">
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Maquis & Bars</span>
            <span>45%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Restaurants</span>
            <span>30%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
            <span>Hôtels & Piscines</span>
            <span>25%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
