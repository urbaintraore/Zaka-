import React, { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '../lib/supabaseClient';
import { useAppStore } from '../store';
import { Database, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SupabaseStatusProps {
  className?: string;
  autoCheck?: boolean;
}

export const SupabaseStatus: React.FC<SupabaseStatusProps> = ({
  className = '',
  autoCheck = false,
}) => {
  const { setGlobalError } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const verifyConnection = async () => {
    setChecking(true);
    try {
      const res = await checkSupabaseConnection();
      setStatus(res);

      if (res.ok) {
        setGlobalError({
          message: 'Client Supabase connecté et initialisé avec succès !',
          code: 'supabase/connected',
          type: 'info',
        });
      } else {
        setGlobalError({
          message: `Échec de connexion Supabase: ${res.message}`,
          code: 'supabase/connection-error',
          type: 'error',
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erreur lors de la vérification du client Supabase.';
      setStatus({ ok: false, message: errorMsg });
      setGlobalError({
        message: errorMsg,
        code: 'supabase/connection-error',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      verifyConnection();
    }
  }, [autoCheck]);

  return (
    <div className={`p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${
          status?.ok 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
            : status && !status.ok
            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        }`}>
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
            Statut Supabase Client
            {status?.ok && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {status && !status.ok && <AlertTriangle className="w-4 h-4 text-red-500" />}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {status 
              ? (status.ok ? 'Client Supabase actif & prêt' : status.message)
              : 'Cliquez sur Vérifier pour tester la connexion'}
          </p>
        </div>
      </div>

      <button
        onClick={verifyConnection}
        disabled={checking}
        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
        <span>{checking ? 'Vérification...' : 'Vérifier'}</span>
      </button>
    </div>
  );
};

export default SupabaseStatus;
