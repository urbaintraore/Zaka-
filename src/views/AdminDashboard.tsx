import { useAppStore } from '../store';
import { LogOut, CheckCircle, XCircle } from 'lucide-react';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { establishments, validateEstablishment } = useAppStore();
  const pendingEsts = establishments.filter(e => e.status === 'en_attente');

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Administration</h2>
          <p className="text-gray-500 text-sm">Gestion de la plateforme</p>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm">
          <LogOut className="w-5 h-5" />
        </button>
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
                <button onClick={() => validateEstablishment(est.id)} className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 font-bold rounded-lg text-sm transition-colors">
                  <CheckCircle className="w-4 h-4" /> Valider
                </button>
                <button className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-sm transition-colors">
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
    </div>
  );
}
