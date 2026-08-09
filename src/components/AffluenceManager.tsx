import React from 'react';
import { useAppStore } from '../store';
import { Users, Flame, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

interface AffluenceManagerProps {
  establishmentId: string;
}

export function AffluenceManager({ establishmentId }: AffluenceManagerProps) {
  const { establishments, updateCrowdStatus, currentUser } = useAppStore();
  const establishment = establishments.find(e => e.id === establishmentId);

  if (!establishment) return null;

  const { crowdStatus, crowdStatusUpdatedAt } = establishment;

  const getStatusInfo = () => {
    if (!crowdStatus || !crowdStatusUpdatedAt) {
      return { isExpired: true, text: 'Affluence non renseignée', timeText: 'Jamais mis à jour' };
    }
    const diffMins = Math.floor((Date.now() - new Date(crowdStatusUpdatedAt).getTime()) / (1000 * 60));
    if (diffMins >= 240) {
      return { isExpired: true, text: 'Expiré (plus de 4h)', timeText: `Il y a ${Math.floor(diffMins / 60)}h` };
    }
    const hours = Math.floor(diffMins / 60);
    const timeText = diffMins < 60 ? `il y a ${diffMins} min` : `il y a ${hours}h`;
    return { isExpired: false, text: crowdStatus.toUpperCase(), timeText };
  };

  const info = getStatusInfo();

  return (
    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-950/50 text-orange-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Gestion de la Jauge d'Affluence</h3>
            <p className="text-xs text-gray-500">Mettez à jour en 1 clic le taux de remplissage pour les fêtards</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            info.isExpired 
              ? 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300'
              : crowdStatus === 'calme'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : crowdStatus === 'anime'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : 'bg-rose-100 text-rose-800 border-rose-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${info.isExpired ? 'bg-gray-400' : 'bg-current animate-pulse'}`} />
            {crowdStatus === 'calme' ? '🟢 Calme' : crowdStatus === 'anime' ? '🟠 Animé' : crowdStatus === 'complet' ? '🔴 Complet' : 'Non renseigné'}
          </span>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" /> {info.timeText}
          </p>
        </div>
      </div>

      {info.isExpired && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin" />
          <span>L'affichage a expiré (4h dépassées). Sélectionnez l'état actuel pour informer vos clients en temps réel.</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => updateCrowdStatus(establishmentId, 'calme')}
          className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
            crowdStatus === 'calme' && !info.isExpired
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40 shadow-md'
              : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <span className="text-base">🟢</span>
          <span>Calme</span>
          <span className="text-[10px] opacity-80 font-normal">Places dispo</span>
        </button>

        <button
          onClick={() => updateCrowdStatus(establishmentId, 'anime')}
          className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
            crowdStatus === 'anime' && !info.isExpired
              ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/40 shadow-md'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Animé</span>
          <span className="text-[10px] opacity-80 font-normal">Bonne ambiance</span>
        </button>

        <button
          onClick={() => updateCrowdStatus(establishmentId, 'complet')}
          className={`py-3 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition-all ${
            crowdStatus === 'complet' && !info.isExpired
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/40 shadow-md'
              : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border-rose-200 hover:bg-rose-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Complet 🚫</span>
          <span className="text-[10px] opacity-80 font-normal">Plus de place</span>
        </button>
      </div>
    </div>
  );
}
