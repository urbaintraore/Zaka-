import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Campaign, Ad, AdFormat, AdCTA, CampaignTargeting, CampaignObjective, AdPackage } from '../types';
import { generateZakaAiAdProposal } from '../utils/zakaAiAds';
import { ZakaAdsPacksModal, ZAKA_ADS_PACKAGES } from './ZakaAdsPacksModal';
import { 
  Sparkles, Plus, BarChart3, TrendingUp, Eye, MousePointer, Target, 
  DollarSign, Play, Pause, AlertCircle, FileText, Bot, Layers, CheckCircle2, 
  Calendar, MapPin, Zap, ArrowRight, Share2, HelpCircle, Download
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';

export const ZakaAdsDashboard: React.FC = () => {
  const { currentUser, campaigns, ads, adPayments, adInvoices, adDailyStats, addCampaign, updateCampaignStatus, processAdPayment } = useAppStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'new_campaign' | 'ai_assistant' | 'payments'>('overview');
  const [showPacksModal, setShowPacksModal] = useState<boolean>(false);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiProposal, setAiProposal] = useState<any | null>(null);

  // Campaign Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [campaignName, setCampaignName] = useState<string>('');
  const [advertiserName, setAdvertiserName] = useState<string>(currentUser?.entrepriseData?.name || currentUser?.name || 'Mon Entreprise');
  const [objective, setObjective] = useState<CampaignObjective>('notoriete');
  const [budgetType, setBudgetType] = useState<'daily' | 'total'>('total');
  const [budgetAmount, setBudgetAmount] = useState<number>(50000);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Ad Creative state
  const [adTitle, setAdTitle] = useState<string>('');
  const [adCopy, setAdCopy] = useState<string>('');
  const [adFormat, setAdFormat] = useState<AdFormat>('publication_sponsorisee');
  const [mediaUrl, setMediaUrl] = useState<string>('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80');
  const [ctaText, setCtaText] = useState<AdCTA>('WhatsApp');
  const [ctaLink, setCtaLink] = useState<string>(currentUser?.phone || '+22670000000');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(['home_banner', 'home_sponsored', 'establishment_recommended']);

  // Targeting state
  const [selectedCities, setSelectedCities] = useState<string[]>(['Ouagadougou', 'Bobo-Dioulasso']);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(['Ouaga 2000', 'Zone du Bois', 'Gounghin']);
  const [selectedAges, setSelectedAges] = useState<string[]>(['18-25', '26-35']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['sorties', 'musique', 'restaurants']);
  const [selectedMoments, setSelectedMoments] = useState<string[]>(['vendredi_soir', 'samedi_soir']);

  const [submittingCampaign, setSubmittingCampaign] = useState<boolean>(false);

  // Filter user campaigns if not admin
  const userCampaigns = useMemo(() => {
    if (currentUser?.role === 'admin') return campaigns;
    return campaigns.filter(c => c.advertiserId === currentUser?.id);
  }, [campaigns, currentUser]);

  const userAds = useMemo(() => {
    const campIds = userCampaigns.map(c => c.id);
    return ads.filter(a => campIds.includes(a.campaignId) || a.advertiserId === currentUser?.id);
  }, [ads, userCampaigns, currentUser]);

  // Calculated Stats
  const totalImpressions = useMemo(() => userAds.reduce((acc, a) => acc + (a.impressions || 0), 0), [userAds]);
  const totalClicks = useMemo(() => userAds.reduce((acc, a) => acc + (a.clicks || 0), 0), [userAds]);
  const totalConversions = useMemo(() => userAds.reduce((acc, a) => acc + (a.conversions || 0), 0), [userAds]);
  const totalBudgetSpent = useMemo(() => userCampaigns.reduce((acc, c) => acc + (c.budgetSpent || 0), 0), [userCampaigns]);
  const ctrPercentage = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Chart data simulation / aggregation
  const chartData = useMemo(() => {
    if (adDailyStats.length > 0) {
      return adDailyStats.slice(-7).map(s => ({
        date: s.date.slice(5),
        Impressions: s.impressions || 0,
        Clics: s.clicks || 0
      }));
    }
    // Default 7-day trend placeholder data
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map((day, idx) => ({
      date: day,
      Impressions: (idx + 1) * 1250 + (totalImpressions > 0 ? totalImpressions / 7 : 0),
      Clics: (idx + 1) * 85 + (totalClicks > 0 ? totalClicks / 7 : 0)
    }));
  }, [adDailyStats, totalImpressions, totalClicks]);

  const cityReachData = [
    { city: 'Ouagadougou', reach: Math.round(totalImpressions * 0.65) || 12500 },
    { city: 'Bobo-Dioulasso', reach: Math.round(totalImpressions * 0.25) || 4800 },
    { city: 'Koudougou', reach: Math.round(totalImpressions * 0.06) || 1200 },
    { city: 'Autres Villes', reach: Math.round(totalImpressions * 0.04) || 800 }
  ];

  // AI Assistant trigger
  const handleGenerateAiProposal = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const proposal = await generateZakaAiAdProposal(aiPrompt, advertiserName);
      setAiProposal(proposal);

      // Auto fill wizard fields
      setCampaignName(proposal.title);
      setAdTitle(proposal.title);
      setAdCopy(proposal.copy);
      setAdFormat(proposal.recommendedFormat);
      setCtaText(proposal.ctaText);
      setBudgetAmount(proposal.suggestedBudget);
      if (proposal.targetAudience) {
        setSelectedCities(proposal.targetAudience.cities || []);
        setSelectedNeighborhoods(proposal.targetAudience.neighborhoods || []);
        setSelectedAges(proposal.targetAudience.ageRanges || []);
        setSelectedInterests(proposal.targetAudience.interests || []);
        setSelectedMoments(proposal.targetAudience.keyMoments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiProposal = () => {
    setActiveTab('new_campaign');
    setWizardStep(1);
  };

  // Submit new campaign
  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!campaignName.trim()) {
      alert("Veuillez saisir un nom pour votre campagne.");
      return;
    }

    setSubmittingCampaign(true);
    try {
      const newCampId = await addCampaign(
        {
          advertiserId: currentUser.id,
          advertiserName,
          title: campaignName,
          objective,
          budgetType,
          budgetTotal: budgetAmount,
          startDate,
          endDate,
          targeting: {
            cities: selectedCities,
            neighborhoods: selectedNeighborhoods,
            ageRanges: selectedAges,
            interests: selectedInterests,
            keyMoments: selectedMoments
          },
          status: 'active'
        },
        [
          {
            title: adTitle || campaignName,
            description: adCopy,
            format: adFormat,
            mediaUrl,
            ctaText,
            ctaLink,
            placements: selectedPlacements as any,
            status: 'active',
            advertiserId: currentUser.id,
            advertiserName
          }
        ]
      );

      // Trigger automatic payment registration
      await processAdPayment({
        advertiserId: currentUser.id,
        advertiserName,
        campaignId: newCampId,
        packName: `Campagne ${campaignName}`,
        amount: budgetAmount,
        method: 'orange_money',
        phoneUsed: currentUser.phone || '70000000',
        transactionRef: `CAMPAIGN-REF-${Math.floor(100000 + Math.random() * 900000)}`
      });

      alert("🎉 Félicitations ! Votre campagne publicitaire ZAKA Ads a été créée et activée avec succès !");
      setActiveTab('campaigns');
      setWizardStep(1);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la campagne.");
    } finally {
      setSubmittingCampaign(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Banner Header */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-orange-500/30">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Régie Publicitaire Officielle
                </span>
                <span className="text-xs text-gray-400 font-bold">• ZAKA+ Burkina Faso</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ZAKA Ads Dashboard
              </h1>
              <p className="text-xs md:text-sm text-gray-300 mt-1 max-w-2xl leading-relaxed">
                Créez, gérez et mesurez l'impact de vos campagnes publicitaires auprès d'une audience jeune et ultra-engagée au Burkina Faso.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPacksModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-orange-400 fill-current" />
                <span>Consulter nos Packs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('new_campaign');
                  setWizardStep(1);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Créer une Campagne</span>
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Vue d\'ensemble & Data', icon: BarChart3 },
              { id: 'campaigns', label: `Mes Campagnes (${userCampaigns.length})`, icon: Layers },
              { id: 'new_campaign', label: 'Créer Campagne', icon: Plus },
              { id: 'ai_assistant', label: 'IA ZAKA Ads Assistant', icon: Bot, isNew: true },
              { id: 'payments', label: `Paiements & Factures (${adPayments.length})`, icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.isNew && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-400 text-gray-950 font-black text-[9px] uppercase">
                      IA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 1) OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Budget Consommé</span>
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalBudgetSpent.toLocaleString('fr-FR')} <span className="text-xs font-bold text-orange-500">FCFA</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                  100% sécurisé via Mobile Money
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Impressions Totales</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalImpressions.toLocaleString('fr-FR')}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold mt-1 block">
                  Vues réelles sur l'application
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Clics Générés</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                    <MousePointer className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalClicks.toLocaleString('fr-FR')}
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
                  Taux de Clic (CTR) : {ctrPercentage}%
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Conversions / Contacts</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {totalConversions.toLocaleString('fr-FR')}
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1 block">
                  Appels & messages WhatsApp
                </span>
              </div>
            </div>

            {/* Performance Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Evolution Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                      Évolution Quotidienne des Impressions & Clics
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Performance en temps réel sur les 7 derniers jours au Burkina Faso
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] uppercase">
                    Mise à jour Live
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46', color: '#fff', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="Impressions" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorImp)" />
                      <Area type="monotone" dataKey="Clics" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* City Breakdown Chart */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">
                  Répartition Géographique
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                  Impact par ville cible au Burkina Faso
                </p>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cityReachData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="city" fontSize={10} tickLine={false} />
                      <YAxis fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      <Bar dataKey="reach" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2) CAMPAIGNS TAB */}
        {activeTab === 'campaigns' && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Gestion des Campagnes Publicitaires
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suivez les statuts et performances de chaque annonce
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveTab('new_campaign');
                  setWizardStep(1);
                }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Campagne</span>
              </button>
            </div>

            {userCampaigns.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Aucune campagne créée pour le moment
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                  Lancez votre première publicité ciblée en moins de 2 minutes avec ZAKA Ads.
                </p>
                <button
                  onClick={() => setActiveTab('new_campaign')}
                  className="px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md hover:bg-orange-600 cursor-pointer"
                >
                  Créer ma première campagne
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {userCampaigns.map(camp => {
                  const campAds = ads.filter(a => a.campaignId === camp.id);
                  const campImpressions = campAds.reduce((acc, a) => acc + (a.impressions || 0), 0);
                  const campClicks = campAds.reduce((acc, a) => acc + (a.clicks || 0), 0);

                  return (
                    <div key={camp.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {camp.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            camp.status === 'active' 
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30' 
                              : camp.status === 'pause'
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}>
                            {camp.status === 'active' ? 'Active' : camp.status === 'pause' ? 'En Pause' : camp.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                          <span>Annonceur: <strong>{camp.advertiserName}</strong></span>
                          <span>• Budget: <strong>{camp.budgetTotal.toLocaleString('fr-FR')} FCFA</strong></span>
                          <span>• Villes: <strong>{camp.targeting?.cities?.join(', ') || 'Global'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Vues / Clics</span>
                          <span className="font-black text-xs text-gray-900 dark:text-white">
                            {campImpressions.toLocaleString('fr-FR')} / {campClicks.toLocaleString('fr-FR')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {camp.status === 'active' ? (
                            <button
                              onClick={() => updateCampaignStatus(camp.id, 'pause')}
                              className="p-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Mettre en pause"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => updateCampaignStatus(camp.id, 'active')}
                              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Activer"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3) NEW CAMPAIGN WIZARD TAB */}
        {activeTab === 'new_campaign' && (
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl mx-auto space-y-8">
            
            {/* Wizard Steps Navigation */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              {[
                { step: 1, label: '1. Informations & Budget' },
                { step: 2, label: '2. Création du Visuel / Pub' },
                { step: 3, label: '3. Ciblage & Confirmation' }
              ].map(s => (
                <div 
                  key={s.step} 
                  onClick={() => setWizardStep(s.step)}
                  className={`flex items-center gap-2 cursor-pointer font-extrabold text-xs transition-all ${
                    wizardStep === s.step ? 'text-orange-500 border-b-2 border-orange-500 pb-2 -mb-4' : 'text-gray-400'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                    wizardStep === s.step ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    {s.step}
                  </span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-6">
              
              {/* STEP 1: Basic Info & Budget */}
              {wizardStep === 1 && (
                <div className="space-y-5 animate-fade-in">
                  <div>
                    <label className="text-xs font-extrabold text-gray-900 dark:text-white block mb-1">
                      Nom de la Campagne Publicitaire *
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="ex: Promotion Soirée DJ VIP Vendredi"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Nom de l'Annonceur / Marque / Établissement
                      </label>
                      <input
                        type="text"
                        value={advertiserName}
                        onChange={(e) => setAdvertiserName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Objectif de la Campagne
                      </label>
                      <select
                        value={objective}
                        onChange={(e) => setObjective(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="notoriete">Gagner en Notoriété (Max Impressions)</option>
                        <option value="traffic">Générer du Trafic / Visites</option>
                        <option value="reservations">Générer des Réservations & Contacts WhatsApp</option>
                        <option value="promotions">Promouvoir une Offre Spéciale</option>
                      </select>
                    </div>
                  </div>

                  {/* Budget Allocation */}
                  <div className="p-5 rounded-2xl bg-orange-500/5 dark:bg-orange-950/20 border border-orange-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                        Budget & Durée de Diffusion
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPacksModal(true)}
                        className="text-xs text-orange-500 underline font-bold hover:text-orange-600 cursor-pointer"
                      >
                        Voir les Packs Publicitaires
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Budget Total (FCFA)
                        </label>
                        <input
                          type="number"
                          value={budgetAmount}
                          onChange={(e) => setBudgetAmount(Number(e.target.value))}
                          step={5000}
                          min={5000}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-black text-base"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Date de Début
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Date de Fin
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <span>Étape Suivante : Création du Visuel</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Ad Creative & Copywriting */}
              {wizardStep === 2 && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { id: 'banniere', label: 'Banniere Image', desc: 'Format visuel standard haut de page' },
                      { id: 'publication_sponsorisee', label: 'Post Sponsorisé', desc: 'Format natif dans le fil d\'actualité' },
                      { id: 'video', label: 'Vidéo HD', desc: 'Format dynamique haute conversion' }
                    ].map(f => (
                      <div
                        key={f.id}
                        onClick={() => setAdFormat(f.id as AdFormat)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          adFormat === f.id ? 'border-orange-500 bg-orange-500/10' : 'border-gray-200 dark:border-gray-800'
                        }`}
                      >
                        <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">{f.label}</h4>
                        <p className="text-[11px] text-gray-500 mt-1">{f.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Titre de l'Annonce
                    </label>
                    <input
                      type="text"
                      value={adTitle}
                      onChange={(e) => setAdTitle(e.target.value)}
                      placeholder="ex: Soirée Barbecue & Ambiance Afrobeat"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Texte Publicitaire (Copy)
                    </label>
                    <textarea
                      rows={3}
                      value={adCopy}
                      onChange={(e) => setAdCopy(e.target.value)}
                      placeholder="Décrivez votre offre, vos artistes invités, tarifs ou promotions..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        URL de l'Image / Affiche Publicitaire
                      </label>
                      <input
                        type="url"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Bouton d'Action (Call To Action)
                      </label>
                      <select
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value as AdCTA)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="WhatsApp">WhatsApp (*Direct*)</option>
                        <option value="Appeler">Appeler directement</option>
                        <option value="Réserver">Réserver une table</option>
                        <option value="Découvrir">Découvrir le lieu</option>
                        <option value="Acheter">Acheter Ticket / Pass</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <span>Étape Suivante : Ciblage Cible</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Targeting & Submit */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-4">
                    <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-orange-500" />
                      Ciblage Géographique & Audience au Burkina Faso
                    </h3>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                        Villes Ciblées :
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'].map(city => {
                          const isSel = selectedCities.includes(city);
                          return (
                            <button
                              key={city}
                              type="button"
                              onClick={() => {
                                setSelectedCities(isSel ? selectedCities.filter(c => c !== city) : [...selectedCities, city]);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                isSel ? 'bg-orange-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {city}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                        Moments Clés de Sortie :
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'vendredi_soir', label: 'Vendredi Soir' },
                          { id: 'samedi_soir', label: 'Samedi Soir' },
                          { id: 'dimanche_apres_midi', label: 'Dimanche Après-Midi' },
                          { id: 'fetes_et_feries', label: 'Jours Fériés' }
                        ].map(m => {
                          const isSel = selectedMoments.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedMoments(isSel ? selectedMoments.filter(x => x !== m.id) : [...selectedMoments, m.id]);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                isSel ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCampaign}
                      className="px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm rounded-xl shadow-xl shadow-orange-500/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingCampaign ? (
                        <span>Lancement en cours...</span>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current" />
                          <span>Lancer la Campagne ({budgetAmount.toLocaleString('fr-FR')} FCFA)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

        {/* 4) AI ASSISTANT TAB */}
        {activeTab === 'ai_assistant' && (
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  ZAKA AI Ads Assistant
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Générez automatiquement la stratégie, le texte et le ciblage publicitaire idéal au Burkina Faso.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Exprimez le besoin de votre établissement ou marque :
                </label>
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="ex: Je veux attirer des étudiants pour notre soirée DJ vendredi au Maquis VIP Ouaga 2000 avec une promo sur la Brakina."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAiProposal}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <span>L'intelligence artificielle analyse le marché burkinabè...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Générer la Proposition Publicitaire avec l'IA</span>
                  </>
                )}
              </button>
            </div>

            {aiProposal && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-gray-900/10 border border-orange-500/30 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white font-black text-[10px] uppercase">
                    Proposition ZAKA AI
                  </span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    Budget Recommandé : {aiProposal.suggestedBudget?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1">
                    {aiProposal.title}
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                    "{aiProposal.copy}"
                  </p>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>• <strong>Format :</strong> {aiProposal.recommendedFormat}</p>
                  <p>• <strong>Action Cible :</strong> {aiProposal.ctaText}</p>
                  <p>• <strong>Villes Ciblées :</strong> {aiProposal.targetAudience?.cities?.join(', ')}</p>
                  <p>• <strong>Horaires Optimaux :</strong> {aiProposal.bestSchedule}</p>
                </div>

                <button
                  onClick={handleApplyAiProposal}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Appliquer cette campagne dans le Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5) PAYMENTS & INVOICES TAB */}
        {activeTab === 'payments' && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Historique des Transactions & Factures
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Suivi des paiements Orange Money, Moov Money et téléchargement des pièces justificatives
                </p>
              </div>
            </div>

            {adPayments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">
                Aucune transaction enregistrée.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {adPayments.map(pay => (
                  <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-gray-900 dark:text-white block">
                        {pay.packName || 'Paiement Publicitaire ZAKA Ads'}
                      </span>
                      <span className="text-gray-500">
                        {pay.method.toUpperCase()} ({pay.phoneUsed}) • {pay.transactionRef}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-orange-600 dark:text-orange-400 block">
                        {pay.amount.toLocaleString('fr-FR')} FCFA
                      </span>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase">
                        {pay.status === 'valide' ? 'Payé / Validé' : 'En Attente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Packs Modal */}
      <ZakaAdsPacksModal
        isOpen={showPacksModal}
        onClose={() => setShowPacksModal(false)}
      />
    </div>
  );
};
