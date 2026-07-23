import { useAppStore } from '../store';
import { LogOut, CheckCircle, XCircle, Download, Award, Building2 } from 'lucide-react';
import { useInstallApp } from '../hooks/useInstallApp';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { establishments, validateEstablishment, entreprises, validateEntreprise } = useAppStore();
  const pendingEsts = establishments.filter(e => e.status === 'en_attente');
  const pendingEnts = (entreprises || []).filter(e => e.status === 'en_attente');
  const { isInstallable, promptInstall } = useInstallApp();

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Administration</h2>
          <p className="text-gray-500 text-sm">Gestion de la plateforme</p>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button onClick={promptInstall} className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-full shadow-sm" title="Installer l'application">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm" title="Déconnexion">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Établissements en attente ({pendingEsts.length})</h3>
        <div className="flex flex-col gap-3">
          {pendingEsts.map(est => (
            <div key={est.id} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{est.name}</h4>
                <p className="text-sm text-gray-600 mb-1">{est.description}</p>
                <div className="text-xs font-medium text-gray-500">
                  {est.address}, {est.neighborhood}, {est.city} • Tél: {est.phone}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => validateEstablishment(est.id)} className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg text-sm transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4" /> Valider
                </button>
                <button className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-sm transition-colors cursor-pointer">
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </div>
            </div>
          ))}
          {pendingEsts.length === 0 && (
             <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
               Aucun établissement en attente.
             </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900">Entreprises / Marques en attente ({pendingEnts.length})</h3>
        </div>
        
        <div className="flex flex-col gap-3">
          {pendingEnts.map(ent => (
            <div key={ent.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm flex flex-col gap-4">
              <div className="flex items-start gap-4">
                {ent.logo ? (
                  <img src={ent.logo} alt={ent.name} className="w-16 h-16 rounded-xl object-cover border border-gray-150 flex-shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-amber-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight">{ent.name}</h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full uppercase">
                      {ent.sector}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{ent.description}</p>
                </div>
              </div>

              {ent.philosophy && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-gray-700">
                  <span className="font-extrabold text-amber-800 block mb-1">💡 Pourquoi rejoignent-ils Zaka+ ?</span>
                  <p className="italic">"{ent.philosophy}"</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button onClick={() => validateEntreprise(ent.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg text-sm transition-colors cursor-pointer">
                  <CheckCircle className="w-4 h-4" /> Activer la marque
                </button>
              </div>
            </div>
          ))}
          {pendingEnts.length === 0 && (
             <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
               Aucune entreprise en attente de validation.
             </div>
          )}
        </div>
      </section>
    </div>
  );
}
