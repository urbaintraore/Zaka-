import { useEffect, useState } from 'react';
import { AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../store';

export function Toast() {
  const { globalError, setGlobalError } = useAppStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!globalError) {
      setIsVisible(false);
      return;
    }

    // Trigger transition entry on the next tick
    const entryTimer = setTimeout(() => setIsVisible(true), 50);

    // Give longer read times for security issues
    const displayDuration = globalError.code === 'auth/too-many-requests' ? 12000 : 7000;

    const exitTimer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit transition to finish before clearing state
      setTimeout(() => {
        setGlobalError(null);
      }, 300);
    }, displayDuration);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(exitTimer);
    };
  }, [globalError, setGlobalError]);

  if (!globalError) return null;

  const isTooManyRequests = globalError.code === 'auth/too-many-requests';
  const isUnauthorizedDomain = globalError.code === 'auth/unauthorized-domain';

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setGlobalError(null);
    }, 300);
  };

  return (
    <div
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 flex gap-3.5 transition-all duration-300 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isTooManyRequests ? (
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        ) : (
          <div className="p-2 bg-red-50 text-red-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-sm text-gray-900">
            {isTooManyRequests 
              ? "Sécurité d'authentification" 
              : isUnauthorizedDomain 
              ? "Domaine non autorisé" 
              : "Alerte de connexion"
            }
          </h4>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-xs text-gray-600 mt-1 leading-relaxed break-words">
          {globalError.message}
        </p>

        {isTooManyRequests && (
          <div className="mt-2 text-[10px] text-amber-700 bg-amber-50/50 p-2 rounded-lg leading-normal font-medium">
            💡 <strong>Astuce :</strong> Firebase limite les requêtes pour contrer les cyberattaques. Veuillez patienter environ 5 minutes sans essayer de vous connecter, puis réessayez sereinement.
          </div>
        )}

        {isUnauthorizedDomain && (
          <div className="mt-2 text-[10px] text-red-700 bg-red-50/50 p-2 rounded-lg leading-normal font-medium">
            ⚙️ <strong>Configuration :</strong> Ajoutez ce nom de domaine (<span className="font-mono bg-red-100 px-1 py-0.5 rounded">{typeof window !== 'undefined' ? window.location.hostname : ''}</span>) dans la console Firebase (Authentication &gt; Paramètres &gt; Domaines autorisés).
          </div>
        )}
      </div>
    </div>
  );
}

