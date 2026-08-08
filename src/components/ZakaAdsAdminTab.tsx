import React from 'react';
import { useAppStore } from '../store';
import { Check, X, ShieldAlert, Sparkles, DollarSign, Layers, Eye, MousePointer } from 'lucide-react';

export const ZakaAdsAdminTab: React.FC = () => {
  const { campaigns, ads, adPayments, validateAdPayment, validateCampaignByAdmin, updateCampaignStatus } = useAppStore();

  const pendingPayments = adPayments.filter(p => p.status === 'en_attente');
  const pendingCampaigns = campaigns.filter(c => c.status === 'en_attente');

  const totalRevenue = adPayments
    .filter(p => p.status === 'valide')
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Revenue Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 text-white border border-orange-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-max mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Régie Publicitaire ZAKA Ads
          </span>
          <h2 className="text-2xl font-black text-white">
            Administration AdTech & Revenus Régie
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Gérez les campagnes des annonceurs, validez les règlements Mobile Money et administrez les emplacements publicitaires.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-right">
          <span className="text-xs text-gray-300 font-bold block">Chiffre d'Affaires AdTech Total</span>
          <span className="text-3xl font-black text-orange-400">
            {totalRevenue.toLocaleString('fr-FR')} <span className="text-xs font-bold text-white">FCFA</span>
          </span>
        </div>
      </div>

      {/* Pending Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pending Payments Approval */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              Paiements en Attente de Validation ({pendingPayments.length})
            </h3>
          </div>

          {pendingPayments.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">
              Aucun paiement en attente. Tous les versements sont validés.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pendingPayments.map(pay => (
                <div key={pay.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-gray-900 dark:text-white block">
                      {pay.advertiserName}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {pay.packName} • {pay.method.toUpperCase()} ({pay.phoneUsed})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-orange-600 dark:text-orange-400 mr-2">
                      {pay.amount.toLocaleString('fr-FR')} FCFA
                    </span>
                    <button
                      onClick={() => validateAdPayment(pay.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Campaigns Approval */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" />
              Campagnes en Attente de Modération ({pendingCampaigns.length})
            </h3>
          </div>

          {pendingCampaigns.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">
              Toutes les campagnes soumises sont approuvées.
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pendingCampaigns.map(camp => (
                <div key={camp.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-xs text-gray-900 dark:text-white block">
                      {camp.title}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Annonceur: {camp.advertiserName} • Budget: {camp.budgetTotal.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <button
                    onClick={() => validateCampaignByAdmin(camp.id)}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approuver & Diffuser</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Global Campaigns List */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
          Toutes les Campagnes Actives sur la Régie ({campaigns.length})
        </h3>

        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {campaigns.map(camp => (
            <div key={camp.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-gray-900 dark:text-white block">
                  {camp.title}
                </span>
                <span className="text-gray-500">
                  {camp.advertiserName} • {camp.targeting?.cities?.join(', ') || 'Tout le Burkina'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                  {camp.status}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {camp.budgetTotal.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
