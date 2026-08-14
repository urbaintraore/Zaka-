import React, { useState, useMemo } from 'react';
import { useAppStore } from '../../store';
import { 
  Building2, Plus, Sparkles, BarChart2, Calendar, Target, DollarSign, 
  Layers, RefreshCw, Send, CheckCircle2, AlertCircle, FileText, Download, 
  ArrowRight, ShieldCheck, ChevronRight, Eye, MousePointer, Image, Video, 
  Copy, ExternalLink, Settings, Users, Percent, HelpCircle
} from 'lucide-react';
import { 
  Campaign, CampaignObjective, AdFormat, AdCTA, AdPlacementType, 
  AdOrganization, AdCreative 
} from '../../types';
import { askZakaAiCampaignStrategist } from '../../utils/zakaAiAdmin';

export function ZakaAdsManager() {
  const { 
    campaigns, 
    ads, 
    adPayments, 
    adInvoices, 
    adOrganizations, 
    adCreatives, 
    currentUser, 
    addCampaign, 
    createAdOrganization, 
    processAdPayment,
    addAdCreativeLibraryItem 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'campaigns' | 'create' | 'creatives' | 'abtest' | 'invoices' | 'ai'>('campaigns');
  
  // Organization Switcher
  const userOrgs = useMemo(() => {
    if (!currentUser) return [];
    return adOrganizations.filter(o => o.ownerId === currentUser.id || o.members?.some(m => m.userId === currentUser.id));
  }, [adOrganizations, currentUser]);

  const [selectedOrgId, setSelectedOrgId] = useState<string>(userOrgs[0]?.id || 'all');

  // Filtered campaigns for selected organization
  const activeOrgCampaigns = useMemo(() => {
    if (selectedOrgId === 'all') {
      return campaigns.filter(c => c.advertiserId === currentUser?.id || c.organizationId === selectedOrgId);
    }
    return campaigns.filter(c => c.organizationId === selectedOrgId || c.advertiserId === currentUser?.id);
  }, [campaigns, selectedOrgId, currentUser]);

  // Create Campaign Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState<CampaignObjective>('notoriete');
  const [budgetType, setBudgetType] = useState<'daily' | 'lifetime'>('lifetime');
  const [budgetTotal, setBudgetTotal] = useState<number>(50000);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  // Targeting
  const [cities, setCities] = useState<string[]>(['Ouagadougou', 'Bobo-Dioulasso']);
  const [ageRanges, setAgeRanges] = useState<string[]>(['18-25', '26-35', '36-50']);
  const [gender, setGender] = useState<'tous' | 'hommes' | 'femmes'>('tous');
  const [interests, setInterests] = useState<string[]>(['sorties', 'musique', 'restaurants']);
  const [frequencyCap, setFrequencyCap] = useState<number>(3);

  // Creative
  const [adFormat, setAdFormat] = useState<AdFormat>('banniere');
  const [mediaUrl, setMediaUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [ctaText, setCtaText] = useState<AdCTA>('Découvrir');
  const [ctaLink, setCtaLink] = useState('');
  const [selectedPlacements, setSelectedPlacements] = useState<AdPlacementType[]>(['home_banner', 'home_sponsored']);

  // UTM Parameters
  const [utmSource, setUtmSource] = useState('zaka_ads');
  const [utmMedium, setUtmMedium] = useState('cpm');
  const [utmCampaign, setUtmCampaign] = useState('notoriete_2026');

  // AI Assistant State
  const [aiObjective, setAiObjective] = useState('Notoriété Marque');
  const [aiBudget, setAiBudget] = useState(100000);
  const [aiCity, setAiCity] = useState('Ouagadougou');
  const [aiSector, setAiSector] = useState('Boissons / Agroalimentaire');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Handle New Campaign Creation
  const handleCreateCampaign = async () => {
    if (!title.trim() || budgetTotal <= 0) {
      alert("Veuillez remplir le titre et un budget valide.");
      return;
    }

    try {
      const campId = await addCampaign({
        advertiserId: currentUser?.id || 'anon',
        advertiserName: currentUser?.name || 'Entreprise ZAKA',
        title,
        objective,
        startDate,
        endDate,
        budgetTotal,
        status: 'en_attente',
        organizationId: selectedOrgId !== 'all' ? selectedOrgId : undefined,
        budgetType,
        frequencyCap,
        targeting: {
          cities,
          ageRanges,
          gender,
          interests
        },
        utmParameters: {
          utmSource,
          utmMedium,
          utmCampaign
        }
      }, [{
        advertiserId: currentUser?.id || 'anon',
        advertiserName: currentUser?.name || 'Entreprise ZAKA',
        title: adTitle || title,
        format: adFormat,
        mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop',
        description: adDescription,
        ctaText,
        ctaLink,
        placements: selectedPlacements,
        status: 'en_attente'
      }]);

      // Process payment record
      await processAdPayment({
        advertiserId: currentUser?.id || 'anon',
        advertiserName: currentUser?.name || 'Entreprise ZAKA',
        campaignId: campId,
        amount: budgetTotal,
        method: 'Orange Money',
        packName: 'SUR_MESURE'
      });

      alert("Campagne soumise avec succès à la régie ZAKA Ads ! Vous recevrez une notification dès sa validation.");
      setActiveTab('campaigns');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la campagne.");
    }
  };

  // Handle AI Strategy
  const handleGetAiStrategy = async () => {
    setAiLoading(true);
    setAiResult(null);
    const res = await askZakaAiCampaignStrategist(aiObjective, aiBudget, aiCity, aiSector);
    setAiResult(res);
    setAiLoading(false);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 p-4 md:p-6">
      {/* Header ZAKA Ads Manager B2B */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-amber-950 text-white rounded-2xl p-6 shadow-xl mb-6 border border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>ZAKA Ads Manager • Plateforme B2B Grandes Marques & Agences</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Espace Annonceur Pro</h1>
            <p className="text-gray-400 text-sm mt-1 max-w-xl">
              Gérez vos campagnes haute performance, ciblages géolocalisés au Burkina Faso, A/B testing et rapports d'analyse.
            </p>
          </div>

          {/* Switcher Multi-Organisations / Agence */}
          <div className="flex items-center gap-2 bg-gray-800/80 p-2 rounded-xl border border-gray-700">
            <Building2 className="w-4 h-4 text-amber-400 ml-2" />
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
            >
              <option value="all" className="bg-gray-900 text-white">Compte Principal ({currentUser?.name})</option>
              {userOrgs.map(org => (
                <option key={org.id} value={org.id} className="bg-gray-900 text-white">
                  🏢 {org.name} ({org.type})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-gray-800 pt-4 scrollbar-none">
          {[
            { id: 'campaigns', label: 'Mes Campagnes', icon: BarChart2 },
            { id: 'create', label: '+ Créer une Campagne', icon: Plus },
            { id: 'creatives', label: 'Médiathèque Créatifs', icon: Image },
            { id: 'abtest', label: 'A/B Testing', icon: Percent },
            { id: 'invoices', label: 'Factures & Budget', icon: DollarSign },
            { id: 'ai', label: 'ZAKA AI Strategist', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 text-gray-950 shadow-md font-black' 
                    : 'bg-gray-800/60 hover:bg-gray-800 text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Campagnes Actives & Historique ({activeOrgCampaigns.length})
            </h3>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle Campagne</span>
            </button>
          </div>

          {activeOrgCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="font-bold text-gray-700 dark:text-gray-300">Aucune campagne créée pour le moment</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Lancez votre première campagne publicitaire pro sur ZAKA+ en quelques clics.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-5 py-2.5 bg-orange-600 text-white text-xs font-bold rounded-xl"
              >
                Créer une Campagne Pro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrgCampaigns.map(camp => {
                const campAds = ads.filter(a => a.campaignId === camp.id);
                const totalImpressions = campAds.reduce((a, b) => a + (b.impressions || 0), 0);
                const totalClicks = campAds.reduce((a, b) => a + (b.clicks || 0), 0);
                const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

                return (
                  <div key={camp.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          camp.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          camp.status === 'en_attente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {camp.status}
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {camp.budgetTotal.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{camp.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">Objectif: {camp.objective}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl text-center">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Impressions</p>
                        <p className="font-black text-xs text-gray-900 dark:text-white mt-0.5">{totalImpressions.toLocaleString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Clics</p>
                        <p className="font-black text-xs text-gray-900 dark:text-white mt-0.5">{totalClicks.toLocaleString('fr-FR')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">CTR</p>
                        <p className="font-black text-xs text-emerald-600 mt-0.5">{ctr.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADVANCED CREATION WIZARD */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white">
                Tunnel de Création de Campagne Pro (Étape {wizardStep} / 4)
              </h3>
              <p className="text-xs text-gray-500">Configurez vos objectifs, budgets, ciblages affinés et visuels.</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div 
                  key={s} 
                  className={`w-8 h-2 rounded-full ${s <= wizardStep ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`} 
                />
              ))}
            </div>
          </div>

          {/* STEP 1: OBJECTIVE */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Intitulé de la Campagne</label>
              <input
                type="text"
                placeholder="Ex: Campagne Lancement Bière Brakina Spéciale 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold"
              />

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 pt-2">Sélectionnez l'Objectif Stratégique</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'notoriete', title: 'Notoriété & Couverture', desc: 'Maximiser l\'exposition de la marque auprès des Burkinabè.' },
                  { id: 'promo_evenement', title: 'Événement & Promo', desc: 'Générer des inscriptions et présences à un événement.' },
                  { id: 'acquisition', title: 'Clics & WhatsApp', desc: 'Orienter le trafic vers un numéro WhatsApp ou appel direct.' },
                  { id: 'vente', title: 'Vente & Commande', desc: 'Susciter des commandes en ligne directes.' },
                  { id: 'telechargement', title: 'Téléchargement App', desc: 'Promouvoir une application mobile.' }
                ].map(obj => (
                  <div
                    key={obj.id}
                    onClick={() => setObjective(obj.id as any)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      objective === obj.id ? 'border-orange-600 bg-orange-50/50 dark:bg-orange-950/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white">{obj.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-1">{obj.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setWizardStep(2)}
                  disabled={!title.trim()}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl disabled:opacity-50"
                >
                  Étape Suivante (Budget) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET & SCHEDULE */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Type de Budget</label>
                  <select
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value as any)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  >
                    <option value="lifetime">Budget Total Global</option>
                    <option value="daily">Budget Journalier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Montant du Budget (FCFA)</label>
                  <input
                    type="number"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date de Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date de Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-xl"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl"
                >
                  Étape Suivante (Ciblage) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: TARGETING */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Villes Cibles au Burkina Faso</label>
                <div className="flex flex-wrap gap-2">
                  {['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Fada N\'Gourma'].map(city => {
                    const isSelected = cities.includes(city);
                    return (
                      <button
                        key={city}
                        onClick={() => {
                          if (isSelected) setCities(cities.filter(c => c !== city));
                          else setCities([...cities, city]);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                          isSelected ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Plafond d'Impressions / Utilisateur (Frequency Capping)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={frequencyCap}
                  onChange={(e) => setFrequencyCap(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                />
                <p className="text-[10px] text-gray-400 mt-1">Limite le nombre maximal de fois qu'un même utilisateur verra votre publicité par jour.</p>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-xl"
                >
                  ← Retour
                </button>
                <button
                  onClick={() => setWizardStep(4)}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl"
                >
                  Étape Suivante (Créatif) →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CREATIVE & FINAL SUBMIT */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Titre du Visuel</label>
                  <input
                    type="text"
                    placeholder="Ex: Offre Spéciale Brakina 500 FCFA"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">URL de l'image du Visuel</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Texte du Bouton d'Action (CTA)</label>
                <select
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                >
                  <option value="Découvrir">Découvrir</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Appeler">Appeler</option>
                  <option value="Réserver">Réserver</option>
                  <option value="Acheter">Acheter</option>
                </select>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  onClick={() => setWizardStep(3)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-xs font-bold rounded-xl"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleCreateCampaign}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Valider & Soumettre à la Régie</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ZAKA AI STRATEGIST */}
      {activeTab === 'ai' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-xl shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-gray-900 dark:text-white">ZAKA AI Campaign Strategist</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Obtenez des recommandations médias personnalisées basées sur le marché burkinabè.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Objectif</label>
              <input
                type="text"
                value={aiObjective}
                onChange={(e) => setAiObjective(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Budget Estimé (FCFA)</label>
              <input
                type="number"
                value={aiBudget}
                onChange={(e) => setAiBudget(Number(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <button
            onClick={handleGetAiStrategy}
            disabled={aiLoading}
            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Générer la Recommandation Stratégique IA</span>
          </button>

          {aiResult && (
            <div className="p-5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 text-xs leading-relaxed whitespace-pre-line text-gray-800 dark:text-gray-200">
              {aiResult}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
