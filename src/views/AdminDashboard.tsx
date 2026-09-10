import React from 'react';
import { useAppStore } from '../store';
import { Shield, Users, Store, CheckCircle, LogOut } from 'lucide-react';

export function AdminDashboard({ onLogout }: { onLogout?: () => void }) {
  const { users, establishments, reservations } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Tableau de bord Administrateur</h2>
            <p className="text-xs text-gray-500">Vue globale de la plateforme Zaka</p>
          </div>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl">
            <LogOut size={18} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-purple-600 text-white rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-xs font-semibold text-gray-500">Utilisateurs inscrits</div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-xl">
            <Store size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{establishments.length}</div>
            <div className="text-xs font-semibold text-gray-500">Établissements actifs</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{reservations.length}</div>
            <div className="text-xs font-semibold text-gray-500">Réservations effectuées</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Gestion des utilisateurs</h3>
        <div className="divide-y divide-gray-100">
          {users.map(u => (
            <div key={u.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{u.name}</p>
                <p className="text-[10px] text-gray-500">{u.email || u.phone}</p>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase ${
                u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                u.role === 'gerant' ? 'bg-orange-100 text-orange-800' :
                u.role === 'salon_coiffure' ? 'bg-rose-100 text-rose-800 font-extrabold' :
                u.role === 'artiste' ? 'bg-indigo-100 text-indigo-800' :
                u.role === 'annonceur' ? 'bg-amber-100 text-amber-800' :
                u.role === 'entreprise' ? 'bg-blue-100 text-blue-800' :
                u.role === 'caissier' ? 'bg-teal-100 text-teal-800' :
                'bg-gray-100 text-gray-700'
              }`}>
                {u.role === 'salon_coiffure' ? '💇 Salon Coiffure / Beauté' : u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
