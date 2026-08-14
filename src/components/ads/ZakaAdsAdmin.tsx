import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Building2, DollarSign, CheckCircle2, XCircle, AlertTriangle, Eye, MousePointer, 
  Sparkles, Filter, Search, FileText, ShieldAlert, Sliders, RefreshCw, MessageSquare, 
  Check, Pause, Play, Download, UserCheck, Shield, ChevronRight, Send, Plus
} from 'lucide-react';
import { Campaign, CampaignStatus, AdPlacementType, AdPayment, AdDailyStat } from '../../types';
import { askZakaAiAdsIntelligence, AdminAnalyticsSummary } from '../../utils/zakaAiAdmin';

export function ZakaAdsAdmin() {
  const { 
    campaigns, 
    ads, 
    adPayments, 
    adInvoices, 
    adDailyStats, 
    users, 
    entreprises,
    adOrganizations,
    adAuditLogs,
    adRates,
    adSupportTickets,
    moderateCampaignByAdmin,
    validateAdPayment,
    updateAdRateConfig,
    respondAdSupportTicket,
    addAdAuditLog,
    currentUser
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'moderation' | 'advertisers' | 'rates' | 'finance' | 'fraud' | 'logs' | 'support' | 'ai'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Moderation state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Campaign['rejectionReason']>('non_conforme');
  const [moderationComment, setModerationComment] = useState('');

  // Rate config state
  const [editingPlacement, setEditingPlacement] = useState<AdPlacementType | string>('home_banner');
  const [rateCpm, setRateCpm] = useState<number>(2500);
  const [rateCpc, setRateCpc] = useState<number>(150);
  const [rateDaily, setRateDaily] = useState<number>(10000);
  const [rateMinBudget, setRateMinBudget] = useState<number>(15000);

  // Ticket response state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // AI Intelligence state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Analytics calculation
  const analyticsSummary: AdminAnalyticsSummary = useMemo(() => {
    const validPayments = adPayments.filter(p => p.status === 'valide');
    const totalRevenue = validPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const revenueThisMonth = validPayments.filter(p => {
      const d = new Date(p.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((acc, p) => acc + (p.amount || 0), 0);

    const activeCampaignsCount = campaigns.filter(c => c.status === 'active').length;
    const pendingCampaignsCount = campaigns.filter(c => c.status === 'en_attente').length;

    const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
    const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    // City distribution mock/real
    const cityMap: Record<string, number> = { 'Ouagadougou': 0, 'Bobo-Dioulasso': 0, 'Koudougou': 0, 'Banfora': 0 };
    campaigns.forEach(c => {
      const city = c.targeting?.cities?.[0] || 'Ouagadougou';
      cityMap[city] = (cityMap[city] || 0) + (c.budgetTotal || 0);
    });

    const topCities = Object.entries(cityMap).map(([city, revenue]) => ({ city, revenue })).sort((a, b) => b.revenue - a.revenue);

    // Sector distribution
    const sectorMap: Record<string, number> = {};
    campaigns.forEach(c => {
      const sec = c.advertiserName?.includes('Orange') ? 'Télécom' : c.advertiserName?.includes('Brakina') ? 'Boissons' : 'Commerce / Restauration';
      sectorMap[sec] = (sectorMap[sec] || 0) + (c.budgetTotal || 0);
    });
    const topSectors = Object.entries(sectorMap).map(([sector, revenue]) => ({ sector, revenue }));

    return {
      totalRevenue,
      revenueThisMonth,
      activeCampaignsCount,
      pendingCampaignsCount,
      totalImpressions,
      totalClicks,
      avgCtr,
      topCities,
      topSectors
    };
  }, [adPayments, campaigns, ads]);

  // Revenue chart data by date
  const revenueChartData = useMemo(() => {
    const dates: Record<string, number> = {};
    adPayments.filter(p => p.status === 'valide').forEach(p => {
      const dateStr = p.createdAt.split('T')[0];
      dates[dateStr] = (dates[dateStr] || 0) + p.amount;
    });
    return Object.entries(dates).map(([date, revenue]) => ({ date, revenue })).slice(-10);
  }, [adPayments]);

  // Handle Moderation Action
  const handleModerate = async (status: CampaignStatus) => {
    if (!selectedCampaign) return;
    try {
      await moderateCampaignByAdmin(
        selectedCampaign.id,
        status,
        status === 'refusee' ? rejectionReason : undefined,
        moderationComment
      );
      setSelectedCampaign(null);
      setModerationComment('');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Rate Update
  const handleSaveRate = async () => {
    try {
      await updateAdRateConfig({
        id: editingPlacement,
        placement: editingPlacement,
        placementLabel: editingPlacement.toUpperCase().replace('_', ' '),
        cpmPrice: rateCpm,
        cpcPrice: rateCpc,
        dailyPrice: rateDaily,
        minBudget: rateMinBudget,
        isActive: true
      });
      alert("Tarif enregistré avec succès dans la régie.");
    } catch (err) {
      console.error(err);
    }
  };

  // Handle AI Question
  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    const answer = await askZakaAiAdsIntelligence(aiPrompt, analyticsSummary, campaigns, adPayments);
    setAiResponse(answer);
    setAiLoading(false);
  };

  const pendingQueue = campaigns.filter(c => c.status === 'en_attente');

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Header Régie */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Back-Office Régie Publicitaire Intégrée</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">ZAKA Ads Admin</h1>
            <p className="text-orange-100 text-sm mt-1 max-w-xl">
              Centre de contrôle central pour la modération des campagnes, la gestion de l'inventaire, des tarifs, de la facturation et du suivi anti-fraude.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
            <div className="text-right">
              <p className="text-xs text-orange-200 uppercase tracking-wider font-semibold">Chiffre d'Affaires</p>
              <p className="text-xl font-black">{analyticsSummary.totalRevenue.toLocaleString('fr-FR')} FCFA</p>
            </div>
            <div className="p-2.5 bg-orange-500/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-white/15 pt-4 scrollbar-none">
          {[
            { id: 'dashboard', label: 'Vue d\'Ensemble', icon: BarChart },
            { id: 'moderation', label: `Modération (${pendingQueue.length})`, icon: CheckCircle2, badge: pendingQueue.length },
            { id: 'advertisers', label: 'Annonceurs & Agences', icon: Building2 },
            { id: 'rates', label: 'Tarifs & Inventaire', icon: Sliders },
            { id: 'finance', label: 'Finance & Factures', icon: DollarSign },
            { id: 'fraud', label: 'Monitoring Fraude', icon: ShieldAlert },
            { id: 'logs', label: 'Audit Logs', icon: FileText },
            { id: 'support', label: 'Support & Tickets', icon: MessageSquare },
            { id: 'ai', label: 'ZAKA AI Intelligence', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-white text-orange-700 shadow-md' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold mb-2">
                <span>Revenus du mois</span>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {analyticsSummary.revenueThisMonth.toLocaleString('fr-FR')} <span className="text-xs text-gray-400 font-normal">FCFA</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                +18.4% par rapport au mois dernier
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold mb-2">
                <span>Campagnes Actives</span>
                <Play className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {analyticsSummary.activeCampaignsCount}
              </p>
              <p className="text-[10px] text-amber-500 font-bold mt-1">
                {analyticsSummary.pendingCampaignsCount} en attente de modération
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold mb-2">
                <span>Impressions Réseau</span>
                <Eye className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {analyticsSummary.totalImpressions.toLocaleString('fr-FR')}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Abonnés & Visiteurs ZAKA+
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold mb-2">
                <span>CTR Moyen (Clics)</span>
                <MousePointer className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {analyticsSummary.avgCtr.toFixed(2)} %
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {analyticsSummary.totalClicks.toLocaleString('fr-FR')} clics générés
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Évolution des Revenus Publicitaires</h3>
                  <p className="text-xs text-gray-400">Paiements validés par jour (FCFA)</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData.length > 0 ? revenueChartData : [
                    { date: '01 Aug', revenue: 50000 },
                    { date: '04 Aug', revenue: 120000 },
                    { date: '08 Aug', revenue: 85000 },
                    { date: '12 Aug', revenue: 210000 }
                  ]}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#ea580c" fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Répartition par Ville Cible</h3>
                  <p className="text-xs text-gray-400">Budget engagé par ville (FCFA)</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsSummary.topCities}>
                    <XAxis dataKey="city" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  <span>File de Modération Régie (Campagnes en attente)</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Examinez les visuels, vidéos, ciblage et textes soumis par les annonceurs et agences avant publication.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded-full text-xs font-black">
                {pendingQueue.length} à modérer
              </span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <Check className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-gray-700 dark:text-gray-300">Toutes les campagnes sont à jour !</p>
                <p className="text-xs text-gray-400 mt-1">Aucune campagne en attente de validation pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingQueue.map(camp => (
                  <div 
                    key={camp.id} 
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedCampaign?.id === camp.id 
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCampaign(camp)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded">
                          {camp.objective}
                        </span>
                        <h4 className="font-bold text-sm mt-1 text-gray-900 dark:text-white">{camp.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Par {camp.advertiserName}</p>
                      </div>
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {camp.budgetTotal.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    <div className="mt-3 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      <p><strong>Ciblage :</strong> {camp.targeting?.cities?.join(', ') || 'National'} ({camp.targeting?.interests?.join(', ') || 'Tous thèmes'})</p>
                      <p><strong>Période :</strong> {camp.startDate} au {camp.endDate}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaign(camp);
                        }}
                        className="px-3 py-1.5 bg-orange-600 text-white font-bold text-xs rounded-lg hover:bg-orange-700 transition"
                      >
                        Examiner & Valider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Campaign Examiner Modal */}
          {selectedCampaign && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border-2 border-orange-500 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                <div>
                  <h3 className="font-black text-base text-gray-900 dark:text-white">
                    Examen de la Campagne : {selectedCampaign.title}
                  </h3>
                  <p className="text-xs text-gray-500">ID: {selectedCampaign.id} • Annonceur: {selectedCampaign.advertiserName}</p>
                </div>
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg text-xs"
                >
                  ✕ Fermer
                </button>
              </div>

              {/* Ads visuals preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">Ciblage & Budget</p>
                  <p className="text-sm font-semibold">Budget : {selectedCampaign.budgetTotal.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs">Type Budget : {selectedCampaign.budgetType === 'daily' ? 'Journalier' : 'Campagne'}</p>
                  <p className="text-xs mt-1">Villes : {selectedCampaign.targeting?.cities?.join(', ')}</p>
                  <p className="text-xs">Genres : {selectedCampaign.targeting?.gender || 'Tous'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">Paramètres UTM</p>
                  <p className="text-xs">Source : {selectedCampaign.utmParameters?.utmSource || 'zaka_ads'}</p>
                  <p className="text-xs">Medium : {selectedCampaign.utmParameters?.utmMedium || 'cpm'}</p>
                  <p className="text-xs">Campagne : {selectedCampaign.utmParameters?.utmCampaign || 'launch'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">Créatif publicitaire</p>
                  {selectedCampaign.ads?.[0]?.mediaUrl ? (
                    <img 
                      src={selectedCampaign.ads[0].mediaUrl} 
                      alt="Aperçu visuel" 
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      Aucun média
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col md:flex-row gap-3">
                  <button
                    onClick={() => handleModerate('active')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approuver & Activer Immédiatement</span>
                  </button>

                  <button
                    onClick={() => handleModerate('refusee')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Refuser la Campagne</span>
                  </button>
                </div>

                {/* Reason & Comment for Rejection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Motif de Refus (si refusé)</label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value as any)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="contenu_interdit">Contenu interdit ou inapproprié</option>
                      <option value="publicite_trompeuse">Publicité ou promotion trompeuse</option>
                      <option value="informations_fausses">Informations ou coordonnées inexactes</option>
                      <option value="non_conforme">Non conformité aux règles ZAKA+</option>
                      <option value="droits">Atteinte aux droits d'auteur ou marque</option>
                      <option value="autre">Autre motif spécifié ci-dessous</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Commentaire Administrateur / Équipe Régie</label>
                    <input
                      type="text"
                      placeholder="Ex: Veuillez remplacer l'image de faible résolution..."
                      value={moderationComment}
                      onChange={(e) => setModerationComment(e.target.value)}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RATES & INVENTORY */}
      {activeTab === 'rates' && (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-500" />
              <span>Gestion des Tarifs et Grille Tarifaire Régie</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Configurez dynamiquement les tarifs CPM (pour 1000 impressions), CPC (par clic) et forfaits journaliers par emplacement publicitaire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Sélectionner un Emplacement</h4>
              <select
                value={editingPlacement}
                onChange={(e) => setEditingPlacement(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
              >
                <option value="home_banner">Bannière Entête Accueil (home_banner)</option>
                <option value="home_sponsored">Publication Sponsorisée Feed (home_sponsored)</option>
                <option value="establishment_recommended">Recommandation Fiche Établissement (establishment_recommended)</option>
                <option value="event_sponsored">Bannière Événements (event_sponsored)</option>
                <option value="push_notification">Notification Push Ciblée (push_notification)</option>
                <option value="messaging_native">Format Messagerie Natif (messaging_native)</option>
              </select>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Prix CPM (FCFA / 1000 impressions)</label>
                  <input
                    type="number"
                    value={rateCpm}
                    onChange={(e) => setRateCpm(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Prix CPC (FCFA / Clic)</label>
                  <input
                    type="number"
                    value={rateCpc}
                    onChange={(e) => setRateCpc(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Forfait Journalier (FCFA / Jour)</label>
                  <input
                    type="number"
                    value={rateDaily}
                    onChange={(e) => setRateDaily(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Budget Minimum Accepté (FCFA)</label>
                  <input
                    type="number"
                    value={rateMinBudget}
                    onChange={(e) => setRateMinBudget(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                  />
                </div>

                <button
                  onClick={handleSaveRate}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Enregistrer ces Tarifs Régie</span>
                </button>
              </div>
            </div>

            {/* Existing Rates Summary Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">Grille Tarifaire Active</h4>
              <div className="overflow-x-auto border border-gray-100 dark:border-gray-700 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold uppercase border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="p-3">Emplacement</th>
                      <th className="p-3">CPM</th>
                      <th className="p-3">CPC</th>
                      <th className="p-3">Jour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                      { name: 'Bannière Entête', cpm: '2 500', cpc: '150', daily: '10 000' },
                      { name: 'Feed Sponsorisé', cpm: '3 000', cpc: '200', daily: '15 000' },
                      { name: 'Recommandation Fiche', cpm: '2 000', cpc: '120', daily: '8 000' },
                      { name: 'Bannière Événement', cpm: '2 200', cpc: '130', daily: '9 000' }
                    ].map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <td className="p-3 font-bold">{item.name}</td>
                        <td className="p-3 text-emerald-600 font-bold">{item.cpm} FCFA</td>
                        <td className="p-3 text-blue-600 font-bold">{item.cpc} FCFA</td>
                        <td className="p-3 font-bold">{item.daily} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: ZAKA AI INTELLIGENCE */}
      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white">ZAKA AI Ads Intelligence</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Assistant IA interne connecté en temps réel aux données de revenus, campagnes et performances de la régie.
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-xl border border-orange-100 dark:border-orange-900/40">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
              Posez une question à l'analyste virtuel de la régie ZAKA :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: Quels sont nos 5 meilleurs annonceurs ? Quelle ville génère le plus de clics ?"
                className="flex-1 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                onClick={handleAskAi}
                disabled={aiLoading}
                className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md disabled:opacity-50"
              >
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Analyser</span>
              </button>
            </div>

            {/* Quick Prompt Ideas */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "Quels sont les top secteurs d'activité ?",
                "Quelle est la croissance des revenus ce mois ?",
                "Combien de campagnes sont actuellement actives ?"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAiPrompt(suggestion);
                  }}
                  className="text-[10px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/40 transition"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box */}
          {aiResponse && (
            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs leading-relaxed space-y-2 whitespace-pre-line text-gray-800 dark:text-gray-200 shadow-inner">
              <div className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Rapport d'Analyse ZAKA AI Intelligence :</span>
              </div>
              {aiResponse}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
