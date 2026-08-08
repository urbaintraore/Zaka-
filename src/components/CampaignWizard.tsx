import React, { useState } from 'react';
import { useAppStore } from '../store';
import { CampaignObjective, AdFormat, AdCTA, AdPlacementType, Category } from '../types';
import { 
  Sparkles, ArrowRight, ArrowLeft, Check, Target, DollarSign, Calendar, 
  MapPin, Layers, Smartphone, Eye, Megaphone, Image as ImageIcon, 
  Phone, MessageSquare, CheckCircle2, ShieldCheck, AlertCircle, Bot
} from 'lucide-react';
import { generateZakaAiAdProposal } from '../utils/zakaAiAds';

interface CampaignWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CITIES = ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'];
const NEIGHBORHOODS = ['Ouaga 2000', 'Zone du Bois', 'Gounghin', 'Tampouy', 'Pissy', 'Koulouba', 'Wemtenga', 'Dassasgho', 'Patte d\'Oie', 'Secteur 15'];
const AGE_RANGES = ['18-24 ans', '25-34 ans', '35-49 ans', '50+ ans'];
const INTERESTS = ['Restauration & Maquis', 'Soirées & Nightlife', 'Salons de Coiffure & Beauté', 'Concerts & Festivals', 'Sport & Fitness', 'Shopping & Mode'];
const KEY_MOMENTS = ['Vendredi soir (Sorties)', 'Samedi soir (Nightlife)', 'Dimanche détente', 'Événements fériés'];

const PLACEMENTS: { id: AdPlacementType; label: string; description: string; icon: string }[] = [
  { id: 'home_banner', label: 'Bannière Entête Accueil', description: 'Emplacement premium visible immédiatement à l\'ouverture de l\'application.', icon: '🏆' },
  { id: 'home_sponsored', label: 'Publication Sponsorisée Feed', description: 'Format natif parfaitement intégré dans le fil d\'actualités principal.', icon: '📲' },
  { id: 'establishment_recommended', label: 'Recommandation Fiche Établissement', description: 'Affiché en haut des fiches de maquis, lounges et lieux tendance.', icon: '🏪' },
  { id: 'event_sponsored', label: 'Bannière Sponsorisée Événements', description: 'Visibilité maximale sur l\'agenda et les pages de billetterie.', icon: '🎟️' },
  { id: 'push_notification', label: 'Notification Push Ciblée', description: 'Message direct envoyé sur les smartphones des utilisateurs ciblés.', icon: '🔔' }
];

const OBJECTIVES: { id: CampaignObjective; label: string; desc: string; icon: any }[] = [
  { id: 'notoriete', label: 'Notoriété & Image de Marque', desc: 'Maximiser les impressions pour faire connaître votre enseigne.', icon: Eye },
  { id: 'promo_evenement', label: 'Promotion d\'Événement / Soirée', desc: 'Remplir votre établissement lors d\'un concert ou soirée spéciale.', icon: Calendar },
  { id: 'acquisition', label: 'Génération de Contacts & Clics', desc: 'Incitations directes vers WhatsApp, Appels téléphoniques ou Site Web.', icon: Target },
  { id: 'vente', label: 'Ventes Directes & Réservations', desc: 'Convertir directement en réservations de tables ou commandes.', icon: DollarSign }
];

export const CampaignWizard: React.FC<CampaignWizardProps> = ({ onSuccess, onCancel }) => {
  const { currentUser, addCampaign, processAdPayment } = useAppStore();

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Step 1: Details
  const [title, setTitle] = useState<string>('');
  const [advertiserName, setAdvertiserName] = useState<string>(currentUser?.entrepriseData?.name || currentUser?.name || 'Mon Entreprise');
  const [objective, setObjective] = useState<CampaignObjective>('notoriete');
  const [budgetTotal, setBudgetTotal] = useState<number>(50000);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Step 2: Content
  const [adTitle, setAdTitle] = useState<string>('');
  const [adDescription, setAdDescription] = useState<string>('');
  const [adFormat, setAdFormat] = useState<AdFormat>('publication_sponsorisee');
  const [mediaUrl, setMediaUrl] = useState<string>('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80');
  const [ctaText, setCtaText] = useState<AdCTA>('WhatsApp');
  const [ctaLink, setCtaLink] = useState<string>(currentUser?.phone || '+22670000000');
  const [selectedPlacements, setSelectedPlacements] = useState<AdPlacementType[]>(['home_banner', 'home_sponsored', 'establishment_recommended']);

  // Step 3: Targeting
  const [selectedCities, setSelectedCities] = useState<string[]>(['Ouagadougou', 'Bobo-Dioulasso']);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(['Ouaga 2000', 'Zone du Bois']);
  const [selectedAges, setSelectedAges] = useState<string[]>(['18-24 ans', '25-34 ans']);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Restauration & Maquis', 'Soirées & Nightlife']);
  const [selectedMoments, setSelectedMoments] = useState<string[]>(['Vendredi soir (Sorties)', 'Samedi soir (Nightlife)']);

  // Step 4: Payment
  const [paymentMethod, setPaymentMethod] = useState<'Orange Money' | 'Moov Money' | 'Paiement Manuel Admin'>('Orange Money');
  const [paymentPhone, setPaymentPhone] = useState<string>(currentUser?.phone || '');

  // AI Assistant fill
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>('');

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const togglePlacement = (p: AdPlacementType) => {
    if (selectedPlacements.includes(p)) {
      if (selectedPlacements.length > 1) {
        setSelectedPlacements(selectedPlacements.filter(i => i !== p));
      }
    } else {
      setSelectedPlacements([...selectedPlacements, p]);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const prop = await generateZakaAiAdProposal(aiPrompt, advertiserName);
      if (prop) {
        setTitle(prop.title || title);
        setAdTitle(prop.title || adTitle);
        setAdDescription(prop.copy || adDescription);
        setBudgetTotal(prop.suggestedBudget || budgetTotal);
        if (prop.ctaText) setCtaText(prop.ctaText as AdCTA);
        if (prop.targetAudience?.cities) setSelectedCities(prop.targetAudience.cities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Veuillez donner un titre à la campagne.");
      setStep(1);
      return;
    }
    if (!currentUser) return;

    setSubmitting(true);
    try {
      const campaignId = await addCampaign(
        {
          advertiserId: currentUser.id,
          advertiserName,
          title,
          objective,
          budgetType: 'total',
          budgetTotal,
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
            title: adTitle || title,
            description: adDescription,
            format: adFormat,
            mediaUrl,
            ctaText,
            ctaLink,
            placements: selectedPlacements,
            status: 'active',
            advertiserId: currentUser.id,
            advertiserName
          }
        ]
      );

      await processAdPayment({
        advertiserId: currentUser.id,
        advertiserName,
        campaignId,
        packName: `Campagne ${title}`,
        amount: budgetTotal,
        method: paymentMethod,
        phoneUsed: paymentPhone || currentUser.phone || '70000000',
        transactionRef: `PUB-${Math.floor(100000 + Math.random() * 900000)}`
      });

      alert("🎉 Votre campagne publicitaire a été créée et activée avec succès !");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Erreur création campagne:", err);
      alert("Une erreur est survenue lors de la validation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden transition-all">
      
      {/* Wizard Header */}
      <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 p-6 text-white relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1.5 w-max mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Créateur de Campagne AdTech
            </span>
            <h2 className="text-xl font-black text-white">Assistant de Création Publicitaire</h2>
            <p className="text-xs text-gray-300 mt-0.5">
              Étapes {step} sur 4 • {step === 1 ? 'Paramètres généraux' : step === 2 ? 'Visuel & Rédaction' : step === 3 ? 'Ciblage d\'audience' : 'Règlement & Lancement'}
            </p>
          </div>

          {onCancel && (
            <button 
              onClick={onCancel}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          )}
        </div>

        {/* Multi-step progress bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-2 rounded-full transition-all ${
                s <= step ? 'bg-orange-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* AI Assistant Quick Generator Banner */}
      {step === 1 && (
        <div className="p-4 bg-orange-50/70 dark:bg-orange-950/20 border-b border-orange-100 dark:border-orange-900/30 flex flex-col sm:flex-row items-center gap-3">
          <Bot className="w-6 h-6 text-orange-500 shrink-0" />
          <div className="flex-1 w-full">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Soirée concert Afro-beat au Maquis Le Jardin ce vendredi, entrée 2000 FCFA..."
              className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="w-full sm:w-auto px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{aiLoading ? 'Génération IA...' : 'Générer avec ZAKA IA'}</span>
          </button>
        </div>
      )}

      {/* Form Content Body */}
      <div className="p-6 space-y-6">

        {/* STEP 1: GENERAL DETAILS */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-orange-500" />
              1. Détails & Objectif de la Campagne
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nom de la campagne *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Campagne Lancement Menu Grillades"
                  className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'Annonceur
                </label>
                <input
                  type="text"
                  value={advertiserName}
                  onChange={(e) => setAdvertiserName(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Objective Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Quel est votre objectif principal ?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OBJECTIVES.map(obj => {
                  const IconComp = obj.icon;
                  const isSelected = objective === obj.id;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setObjective(obj.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/20' 
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                          {obj.label}
                        </span>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {obj.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Budget & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Budget Total (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(Number(e.target.value))}
                    step={5000}
                    min={10000}
                    className="w-full text-xs font-black px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-400">FCFA</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Date de Début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Date de Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CREATIVE & CONTENT */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-orange-500" />
              2. Visuel & Rédaction du Visuel Publicitaire
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Titre de l'Annonce (Accroche)
                  </label>
                  <input
                    type="text"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    placeholder="Ex: Soirée Barbecue & DJ Live ce Vendredi !"
                    className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Texte descriptif
                  </label>
                  <textarea
                    rows={3}
                    value={adDescription}
                    onChange={(e) => setAdDescription(e.target.value)}
                    placeholder="Profitez de nos formules spéciales grillades avec animation DJ jusqu'à l'aube..."
                    className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    URL de l'image / Affiche publicitaire
                  </label>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Bouton Call-to-Action (CTA)
                    </label>
                    <select
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value as AdCTA)}
                      className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Appeler">Appeler</option>
                      <option value="Réserver">Réserver</option>
                      <option value="Découvrir">Découvrir</option>
                      <option value="Acheter">Acheter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Numéro ou Lien Cible
                    </label>
                    <input
                      type="text"
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="+22670000000"
                      className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Placements Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Emplacements de diffusion ZAKA Ads
                  </label>
                  <div className="space-y-2">
                    {PLACEMENTS.map(pl => {
                      const isSel = selectedPlacements.includes(pl.id);
                      return (
                        <div
                          key={pl.id}
                          onClick={() => togglePlacement(pl.id)}
                          className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSel 
                              ? 'border-orange-500 bg-orange-50/40 dark:bg-orange-950/20' 
                              : 'border-gray-200 dark:border-gray-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{pl.icon}</span>
                            <div>
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                                {pl.label}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {pl.description}
                              </span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isSel ? 'bg-orange-500 text-white' : 'border border-gray-300'}`}>
                            {isSel && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Preview Box */}
              <div className="flex flex-col items-center justify-start">
                <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Aperçu Mobile In-App
                </span>

                <div className="w-full max-w-[300px] rounded-3xl border-4 border-gray-900 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden text-left">
                  {/* Banner image */}
                  <div className="relative h-40 bg-gray-200 overflow-hidden">
                    <img 
                      src={mediaUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                      Sponsorisé
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wide block">
                      {advertiserName}
                    </span>
                    <h4 className="font-black text-sm text-gray-900 dark:text-white leading-tight">
                      {adTitle || 'Titre de votre publicité'}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {adDescription || 'Votre message publicitaire s\'affichera ici avec une haute visibilité auprès des clients.'}
                    </p>

                    <button className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 mt-2 cursor-pointer">
                      <span>{ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: TARGETING */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              3. Ciblage Géographique & Audiences du Burkina
            </h3>

            {/* Cities Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" /> Villes cibles
              </label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map(city => {
                  const isSel = selectedCities.includes(city);
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleItem(selectedCities, setSelectedCities, city)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isSel 
                          ? 'bg-orange-500 text-white shadow-sm' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {city}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Neighborhoods */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Quartiers Prioritaires (Ouagadougou / Bobo)
              </label>
              <div className="flex flex-wrap gap-2">
                {NEIGHBORHOODS.map(n => {
                  const isSel = selectedNeighborhoods.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggleItem(selectedNeighborhoods, setSelectedNeighborhoods, n)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        isSel 
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age Ranges & Interests */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Tranche d'Âge
                </label>
                <div className="flex flex-wrap gap-2">
                  {AGE_RANGES.map(age => {
                    const isSel = selectedAges.includes(age);
                    return (
                      <button
                        key={age}
                        type="button"
                        onClick={() => toggleItem(selectedAges, setSelectedAges, age)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                          isSel ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                        }`}
                      >
                        {age}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Centres d'intérêt
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => {
                    const isSel = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleItem(selectedInterests, setSelectedInterests, interest)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer ${
                          isSel ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Moments */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Moments clés de diffusion
              </label>
              <div className="flex flex-wrap gap-2">
                {KEY_MOMENTS.map(moment => {
                  const isSel = selectedMoments.includes(moment);
                  return (
                    <button
                      key={moment}
                      type="button"
                      onClick={() => toggleItem(selectedMoments, setSelectedMoments, moment)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        isSel ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                      }`}
                    >
                      {moment}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PAYMENT & CONFIRMATION */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-orange-500" />
              4. Récapitulatif & Règlement Mobile Money
            </h3>

            {/* Summary Box */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                <div>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
                    {title || 'Nouvelle Campagne Publicitaire'}
                  </span>
                  <span className="text-xs text-gray-500">Annonceur: {advertiserName}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">Budget Total</span>
                  <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                    {budgetTotal.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>• Villes: <strong className="text-gray-900 dark:text-white">{selectedCities.join(', ')}</strong></div>
                <div>• Durée: <strong className="text-gray-900 dark:text-white">{startDate} au {endDate}</strong></div>
                <div>• Cibles: <strong className="text-gray-900 dark:text-white">{selectedAges.join(', ')}</strong></div>
                <div>• Emplacements: <strong className="text-gray-900 dark:text-white">{selectedPlacements.length} sélectionnés</strong></div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                Mode de Paiement Mobile Money
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Orange Money', name: 'Orange Money Burkina', code: '*144*4*2*Montant#' },
                  { id: 'Moov Money', name: 'Moov Money (Flooz)', code: '*155*4*1*Montant#' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      paymentMethod === m.id 
                        ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 ring-2 ring-orange-500/20' 
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div>
                      <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                        {m.name}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">{m.code}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border ${paymentMethod === m.id ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`} />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Numéro de téléphone utilisé pour le paiement
                </label>
                <input
                  type="tel"
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  placeholder="+226 70 00 00 00"
                  className="w-full text-xs px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer Navigation Buttons */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-extrabold text-xs rounded-xl flex items-center gap-1.5 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Précédent</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <span>Suivant</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Validation...' : 'Valider & Lancer la Campagne'}</span>
          </button>
        )}
      </div>

    </div>
  );
};
