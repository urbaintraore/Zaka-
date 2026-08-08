import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Campaign, Ad, AdDailyStat } from '../types';
import { CampaignWizard } from './CampaignWizard';
import { ZakaAdsPacksModal } from './ZakaAdsPacksModal';
import { 
  Sparkles, Plus, Eye, MousePointer, Target, DollarSign, 
  BarChart3, TrendingUp, Calendar, MapPin, Layers, FileText, 
  Bot, CheckCircle2, AlertCircle, ArrowUpRight, Share2, Download,
  Utensils, Scissors, Building2, Zap, ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

export const AdvertiserDashboard: React.FC = () => {
  const { currentUser, campaigns, ads, adPayments, adInvoices, adDailyStats } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'new_campaign' | 'payments'>('overview');
  const [showPacksModal, setShowPacksModal] = useState<boolean>(false);

  // Filter campaigns & ads belonging to advertiser or all if admin
  const userCampaigns = useMemo(() => {
    if (currentUser?.role === 'admin') return campaigns;
    return campaigns.filter(c => c.advertiserId === currentUser?.id);
  }, [campaigns, currentUser]);

  const userAds = useMemo(() => {
    const campIds = userCampaigns.map(c => c.id);
    return ads.filter(a => campIds.includes(a.campaignId) || a.advertiserId === currentUser?.id);
  }, [ads, userCampaigns, currentUser]);

  // Key metrics calculations
  const totalImpressions = useMemo(() => userAds.reduce((acc, a) => acc + (a.impressions || 0), 0), [userAds]);
  const totalClicks = useMemo(() => userAds.reduce((acc, a) => acc + (a.clicks || 0), 0), [userAds]);
  const totalBudgetSpent = useMemo(() => userCampaigns.reduce((acc, c) => acc + (c.budgetSpent || c.budgetTotal || 0), 0), [userCampaigns]);
  const activeCampaignsCount = useMemo(() => userCampaigns.filter(c => c.status === 'active').length, [userCampaigns]);
  const ctrPercentage = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Graph Data
  const trendData = useMemo(() => {
    if (adDailyStats && adDailyStats.length > 0) {
      return adDailyStats.slice(-7).map(s => ({
        date: s.date.slice(5),
        Impressions: s.impressions || 0,
        Clics: s.clicks || 0
      }));
    }
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((day, idx) => ({
      date: day,
      Impressions: (idx + 1) * 1200 + (totalImpressions > 0 ? totalImpressions / 7 : 0),
      Clics: (idx + 1) * 80 + (totalClicks > 0 ? totalClicks / 7 : 0)
    }));
  }, [adDailyStats, totalImpressions, totalClicks]);

  const cityReachData = [
    { city: 'Ouagadougou', reach: Math.round(totalImpressions * 0.65) || 12500 },
    { city: 'Bobo-Dioulasso', reach: Math.round(totalImpressions * 0.25) || 4800 },
    { city: 'Koudougou', reach: Math.round(totalImpressions * 0.06) || 1200 },
    { city: 'Autres Villes', reach: Math.round(totalImpressions * 0.04) || 800 }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 text-white border border-orange-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-max mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Régie Publicitaire ZAKA Ads
          </span>
          <h1 className="text-2xl font-black text-white">
            Espace Annonceur & Tableaux de Bord
          </h1>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Pilotez vos campagnes, suivez vos impressions in-app en temps réel et ciblez les clients de Ouagadougou et Bobo-Dioulasso.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPacksModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-2xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Packs Forfaits Pub</span>
          </button>

          <button
            onClick={() => setActiveTab('new_campaign')}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Créer une Campagne</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Vue d'ensemble</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'campaigns'
              ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Mes Campagnes ({userCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new_campaign')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'new_campaign'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouvelle Campagne</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Paiements & Factures</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Statistical Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1: Impressions */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Impressions Total</span>
                <Eye className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {totalImpressions.toLocaleString('fr-FR')}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +14% ce mois
              </span>
            </div>

            {/* Card 2: Clics */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Clics Engagés</span>
                <MousePointer className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {totalClicks.toLocaleString('fr-FR')}
              </div>
              <span className="text-[10px] text-orange-600 font-bold">
                CTR Moyen: {ctrPercentage}%
              </span>
            </div>

            {/* Card 3: Budget Investi */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Investissement Total</span>
                <DollarSign className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {totalBudgetSpent.toLocaleString('fr-FR')} <span className="text-xs font-bold">FCFA</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium">
                Paiements Mobile Money
              </span>
            </div>

            {/* Card 4: Campagnes Actives */}
            <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Campagnes Actives</span>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                {activeCampaignsCount}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Diffusion In-App OK
              </span>
            </div>

          </div>

          {/* Graphical Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Impressions / Clics Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                    Performance des Impressions & Engagements
                  </h3>
                  <p className="text-xs text-gray-500">Tendance sur les 7 derniers jours</p>
                </div>
                <span className="px-2.5 py-1 bg-orange-500/10 text-orange-600 font-extrabold text-[10px] rounded-lg">
                  Recharts Direct
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Impressions" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorImpressions)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* City Reach Bar Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  Portée Géographique
                </h3>
                <p className="text-xs text-gray-500">Répartition par ville du Burkina</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityReachData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="city" type="category" tick={{ fontSize: 10 }} width={85} />
                    <Tooltip />
                    <Bar dataKey="reach" fill="#f97316" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Sector Value Proposition & Solutions Grid */}
          <div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent p-6 rounded-3xl border border-orange-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-extrabold text-[10px] uppercase tracking-wider">
                  Stratégies AdTech Sur Mesure
                </span>
                <h3 className="font-black text-lg text-gray-900 dark:text-white mt-1">
                  Solutions & Opportunités ZAKA Ads par Secteur
                </h3>
              </div>
              <button
                onClick={() => setShowPacksModal(true)}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Voir les Forfaits Dediés</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Restaurants */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold mb-3">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">
                    Restaurants & Gastronomie
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    Remplissez vos tables et déclenchez des commandes instantanées.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">• Sponsoring "Menu du Jour" en tête de feed</li>
                    <li className="flex items-center gap-1.5">• Diffusion ciblée heures de repas (11h-13h & 18h-20h)</li>
                    <li className="flex items-center gap-1.5">• Bouton "Réserver une Table" & WhatsApp direct</li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('new_campaign')}
                  className="w-full py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Lancer une Pub Resto
                </button>
              </div>

              {/* Card 2: Salons de Beauté */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold mb-3">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">
                    Salons de Coiffure & Beauté
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    Remplissez votre carnet de rendez-vous et vos fauteuils.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">• Galerie Tresses & Coupes tendance sponsorisée</li>
                    <li className="flex items-center gap-1.5">• Prise de rendez-vous directe in-app</li>
                    <li className="flex items-center gap-1.5">• Offres "Heures Creuses" en semaine & week-end</li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('new_campaign')}
                  className="w-full py-2 bg-pink-500/10 hover:bg-pink-600 text-pink-600 hover:text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Lancer une Pub Beauté
                </button>
              </div>

              {/* Card 3: Grands Annonceurs & Marques */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">
                    Grands Annonceurs & Marques
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                    Dominez la scène urbaine et captez les consommateurs actifs.
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-1.5">• Bannières d'accueil & vidéos grand format</li>
                    <li className="flex items-center gap-1.5">• Co-branding fiches maquis, lounges & bars</li>
                    <li className="flex items-center gap-1.5">• Notifications push geofencées Ouaga & Bobo</li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('new_campaign')}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-600 text-amber-600 hover:text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Lancer une Campagne Marque
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Liste de vos Campagnes ({userCampaigns.length})
            </h3>
            <button
              onClick={() => setActiveTab('new_campaign')}
              className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer une campagne</span>
            </button>
          </div>

          {userCampaigns.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Target className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs text-gray-500">Vous n'avez pas encore de campagne active.</p>
              <button
                onClick={() => setActiveTab('new_campaign')}
                className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Lancer ma première publicité
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {userCampaigns.map(camp => (
                <div key={camp.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {camp.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                        camp.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {camp.status}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      Budget: {camp.budgetTotal.toLocaleString('fr-FR')} FCFA • Villes: {camp.targeting?.cities?.join(', ') || 'Tout le Burkina'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Du / Au</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{camp.startDate}</span>
                    </div>
                    <button className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NEW CAMPAIGN WIZARD */}
      {activeTab === 'new_campaign' && (
        <CampaignWizard 
          onSuccess={() => setActiveTab('campaigns')}
          onCancel={() => setActiveTab('overview')}
        />
      )}

      {/* TAB 4: PAYMENTS & INVOICES */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 animate-in fade-in duration-200">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
            Historique des Règlements & Factures
          </h3>

          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {adPayments.map(p => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-gray-900 dark:text-white block">
                    {p.packName || 'Campagne Pub'}
                  </span>
                  <span className="text-gray-500">
                    {p.method} • {p.phoneUsed || 'N/A'} • {p.createdAt}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-orange-600 dark:text-orange-400">
                    {p.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                    p.status === 'valide' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Packs */}
      {showPacksModal && (
        <ZakaAdsPacksModal onClose={() => setShowPacksModal(false)} />
      )}

    </div>
  );
};
