import React from 'react';
import { FileSpreadsheet, Download, ArrowLeft, LogOut } from 'lucide-react';
import { useAppStore } from '../store';

export function AccountingView({ onBack, onLogout }: { onBack?: () => void; onLogout?: () => void }) {
  const { reservations } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Comptabilité & Bilan</h2>
            <p className="text-xs text-gray-500">Suivi des chiffres d'affaires et recettes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-2">
            <Download size={16} />
            <span>Exporter Excel</span>
          </button>
          {onLogout && (
            <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Synthèse financière</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Revenus de réservations</p>
            <p className="text-xl font-bold text-gray-900">185 000 FCFA</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">Commandes à emporter</p>
            <p className="text-xl font-bold text-gray-900">62 500 FCFA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
