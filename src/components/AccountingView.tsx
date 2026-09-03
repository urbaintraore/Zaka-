import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ComptabiliteMensuelle } from './ComptabiliteMensuelle';
import { Store, ShieldAlert, FileText, ArrowLeft, Building2 } from 'lucide-react';

interface AccountingViewProps {
  onBack?: () => void;
}

export function AccountingView({ onBack }: AccountingViewProps) {
  const { currentUser, establishments } = useAppStore();

  // Filter establishments owned by current user (or all if admin)
  const myEsts = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return establishments;
    return establishments.filter(e => e.ownerId === currentUser.id || (e as any).managerId === currentUser.id);
  }, [establishments, currentUser]);

  const [selectedEstId, setSelectedEstId] = useState<string>(() => myEsts[0]?.id || '');

  // Keep selectedEstId valid if establishments load or change
  React.useEffect(() => {
    if (myEsts.length > 0 && (!selectedEstId || !myEsts.some(e => e.id === selectedEstId))) {
      setSelectedEstId(myEsts[0].id);
    }
  }, [myEsts, selectedEstId]);

  const isGerantOrAuthorized = currentUser && (
    currentUser.role === 'gerant' || 
    currentUser.role === 'admin' || 
    currentUser.role === 'salon_coiffure'
  );

  // Strict Role Check Access Control
  if (!isGerantOrAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4 my-8">
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col items-center gap-3">
          <ShieldAlert className="w-12 h-12 text-rose-600 dark:text-rose-400" />
          <h3 className="text-lg font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">
            Accès Strictement Limité
          </h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-medium max-w-md">
            La vue comptabilité est exclusivement réservée aux utilisateurs ayant le rôle de <strong>Gérant d'établissement</strong>. Vous n'avez pas les autorisations nécessaires pour accéder à ces données financières.
          </p>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-2 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
            >
              Retour au Profil
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeEst = myEsts.find(e => e.id === selectedEstId) || myEsts[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 rounded-2xl transition-all cursor-pointer"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[10px] font-black uppercase tracking-wider">
                Espace Gérant
              </span>
              <span className="text-xs text-gray-400 font-bold">• Module Financier</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
              <FileText className="w-6 h-6 text-orange-500" />
              <span>Comptabilité & Trésorerie Mensuelle</span>
            </h2>
          </div>
        </div>

        {/* Multi Establishment Picker if Gerant owns multiple */}
        {myEsts.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-gray-400 shrink-0">Établissement :</span>
            <div className="flex gap-1.5">
              {myEsts.map(est => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => setSelectedEstId(est.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeEst?.id === est.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{est.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content View */}
      {activeEst ? (
        <ComptabiliteMensuelle establishment={activeEst} />
      ) : (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 space-y-3">
          <Store className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            Aucun établissement associé à votre compte gérant
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Veuillez créer ou enregistrer votre premier établissement dans l'Espace Gérant pour activer la gestion comptable.
          </p>
        </div>
      )}
    </div>
  );
}
