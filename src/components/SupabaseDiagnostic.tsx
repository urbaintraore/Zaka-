import React, { useState } from 'react';
import { checkSupabaseConnection } from '../lib/supabaseClient';
import { useAppStore } from '../store';
import { Database, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SupabaseDiagnosticProps {
  className?: string;
  autoCheckOnMount?: boolean;
}

export const SupabaseDiagnostic: React.FC<SupabaseDiagnosticProps> = ({
  className = '',
}) => {
  const { setGlobalError } = useAppStore();
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<{ ok: boolean; message: string } | null>(null);

  const runDiagnostic = async () => {
    setChecking(true);
    try {
      const status = await checkSupabaseConnection();
      setLastCheck(status);

      if (status.ok) {
        setGlobalError({
          message: 'Client Supabase opérationnel. Connexion à la base de données et tables validée.',
          code: 'supabase/connected',
          type: 'info',
        });
      } else {
        setGlobalError({
          message: `Échec de connexion Supabase: ${status.message}`,
          code: 'supabase/connection-error',
          type: 'error',
        });
      }
    } catch (err: any) {
      const msg = err?.message || 'Erreur inattendue lors de la vérification de Supabase.';
      setLastCheck({ ok: false, message: msg });
      setGlobalError({
        message: msg,
        code: 'supabase/connection-error',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-3 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${
          lastCheck?.ok 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
            : lastCheck && !lastCheck.ok
            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
        }`}>
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            Diagnostic Supabase
            {lastCheck && (
              lastCheck.ok 
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                : <AlertTriangle className="w-4 h-4 text-red-500 inline" />
            )}
          </h4>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {lastCheck 
              ? (lastCheck.ok ? 'Client initialisé et connecté' : lastCheck.message)
              : 'Vérifier la connectivité au projet Supabase'}
          </p>
        </div>
      </div>

      <button
        onClick={runDiagnostic}
        disabled={checking}
        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
        <span>{checking ? 'Test...' : 'Vérifier'}</span>
      </button>
    </div>
  );
};
