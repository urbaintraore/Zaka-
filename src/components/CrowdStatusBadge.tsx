import { Establishment } from '../types';
import { useAppStore } from '../store';
import { Flame, Clock, Users, ShieldAlert } from 'lucide-react';

interface CrowdStatusBadgeProps {
  establishment: Establishment;
  showControlForOwner?: boolean;
  className?: string;
}

export function CrowdStatusBadge({ establishment, showControlForOwner = false, className = '' }: CrowdStatusBadgeProps) {
  const { currentUser, updateCrowdStatus } = useAppStore();
  const isOwner = currentUser && (currentUser.id === establishment.ownerId || currentUser.role === 'admin');

  const { crowdStatus, crowdStatusUpdatedAt } = establishment;

  const getStatusInfo = () => {
    if (!crowdStatus || !crowdStatusUpdatedAt) {
      return {
        isExpired: true,
        label: "Affluence non renseignée",
        bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
        dot: "bg-gray-400",
        icon: Users,
        timeAgo: null
      };
    }

    const updatedDate = new Date(crowdStatusUpdatedAt).getTime();
    const now = Date.now();
    const diffMs = now - updatedDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    // Expire after 4 hours (240 minutes)
    if (diffMins >= 240) {
      return {
        isExpired: true,
        label: "Affluence non renseignée",
        bg: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
        dot: "bg-gray-400",
        icon: Users,
        timeAgo: `Dernière mise à jour il y a ${diffHours}h`
      };
    }

    let timeAgoText = "À l'instant";
    if (diffMins > 0 && diffMins < 60) {
      timeAgoText = `il y a ${diffMins} min`;
    } else if (diffMins >= 60) {
      timeAgoText = `il y a ${diffHours} h`;
    }

    if (crowdStatus === 'calme') {
      return {
        isExpired: false,
        label: "Calme",
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500 animate-pulse",
        icon: Users,
        timeAgo: timeAgoText
      };
    }

    if (crowdStatus === 'anime') {
      return {
        isExpired: false,
        label: "Animé",
        bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500 animate-pulse",
        icon: Flame,
        timeAgo: timeAgoText
      };
    }

    if (crowdStatus === 'complet') {
      return {
        isExpired: false,
        label: "Complet 🚫",
        bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        dot: "bg-rose-500",
        icon: ShieldAlert,
        timeAgo: timeAgoText
      };
    }

    return {
      isExpired: true,
      label: "Affluence non renseignée",
      bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
      dot: "bg-gray-400",
      icon: Users,
      timeAgo: null
    };
  };

  const info = getStatusInfo();
  const Icon = info.icon;

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${info.bg} transition-all`}>
        <span className={`w-2 h-2 rounded-full ${info.dot}`} />
        <Icon className="w-3.5 h-3.5" />
        <span>Jauge : {info.label}</span>
        {info.timeAgo && !info.isExpired && (
          <span className="opacity-75 font-normal border-l border-current/20 pl-2 ml-1 text-[11px] inline-flex items-center gap-1">
            <Clock className="w-3 h-3 inline" />
            {info.timeAgo}
          </span>
        )}
      </div>

      {showControlForOwner && isOwner && (
        <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
            <span>Mettre à jour l'affluence en 1 clic :</span>
            {info.timeAgo && <span className="text-[10px] text-gray-500">Mis à jour {info.timeAgo}</span>}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateCrowdStatus(establishment.id, 'calme')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                crowdStatus === 'calme' && !info.isExpired
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/40 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              🟢 Calme
            </button>
            <button
              onClick={() => updateCrowdStatus(establishment.id, 'anime')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                crowdStatus === 'anime' && !info.isExpired
                  ? 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/40 shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 hover:bg-amber-100'
              }`}
            >
              🟠 Animé
            </button>
            <button
              onClick={() => updateCrowdStatus(establishment.id, 'complet')}
              className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                crowdStatus === 'complet' && !info.isExpired
                  ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/40 shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 hover:bg-rose-100'
              }`}
            >
              🔴 Complet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
