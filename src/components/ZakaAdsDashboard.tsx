import React from 'react';
import { Megaphone, TrendingUp, Eye, MousePointer } from 'lucide-react';

export function ZakaAdsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-600 text-white rounded-xl">
          <Megaphone size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Zaka Ads & Sponsoring</h2>
          <p className="text-xs text-gray-500">Boostez la visibilité de vos établissements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl">
            <Eye size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">12,450</div>
            <div className="text-xs font-semibold text-gray-500">Impressions</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <MousePointer size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">840</div>
            <div className="text-xs font-semibold text-gray-500">Clics</div>
          </div>
        </div>

        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-orange-600 text-white rounded-xl">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">6.7%</div>
            <div className="text-xs font-semibold text-gray-500">Taux de conversion</div>
          </div>
        </div>
      </div>
    </div>
  );
}
