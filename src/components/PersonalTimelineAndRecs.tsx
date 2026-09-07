import React from 'react';
import { Sparkles, MapPin, Heart } from 'lucide-react';
import { useAppStore } from '../store';

export interface PersonalTimelineAndRecsProps {
  currentUser?: any;
  establishments?: any[];
  favorites?: string[];
  reservations?: any[];
  onNavigateToExplore?: () => void;
  [key: string]: any;
}

export const PersonalTimelineAndRecs: React.FC<PersonalTimelineAndRecsProps> = (props) => {
  const store = useAppStore();
  const establishments = props.establishments || store.establishments || [];
  const favorites = props.favorites || store.favorites || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="text-amber-500" size={18} />
        <h3 className="text-sm font-bold text-gray-900">Recommandations pour vous</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {establishments.map((est: any) => (
          <div key={est.id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={est.photoUrl} alt={est.name} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <h4 className="text-xs font-bold text-gray-900">{est.name}</h4>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <MapPin size={10} />
                  <span>{est.neighborhood}, {est.city}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => store.toggleFavorite(est.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart size={16} fill={favorites.includes(est.id) ? 'red' : 'none'} color={favorites.includes(est.id) ? 'red' : 'currentColor'} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
