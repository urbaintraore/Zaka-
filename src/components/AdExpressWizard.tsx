import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { AdCTA, AdFormat, CampaignObjective, CampaignStatus, Establishment, Publication } from '../types';
import { 
  Sparkles, Zap, Image as ImageIcon, Camera, ArrowRight, ArrowLeft, Check, 
  MapPin, DollarSign, Calendar, Clock, Bot, Star, ShieldCheck, AlertCircle, 
  X, CheckCircle2, Phone, MessageSquare, Flame, Utensils, Music, Scissors, 
  Building2, Tag, Layers, Share2, Upload, AlertTriangle
} from 'lucide-react';
import { generateExpressAdWithAI, ZakaAiExpressAdResult } from '../utils/zakaAiExpress';
import { compressImage } from '../utils/imageCompressor';

interface AdExpressWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  prefillEstablishment?: Establishment | null;
  prefillPublication?: Publication | null;
  prefillType?: 'etablissement' | 'evenement' | 'promotion' | 'produit' | 'dj';
}

type PromoCategory = 'etablissement' | 'evenement' | 'promotion' | 'produit' | 'dj' | 'publication' | 'autre';

const BUDGET_OPTIONS = [
  { amount: 5000, days: 1, label: 'Pack Start', subtitle: '1 jour • Idéal pour un coup de boost rapide' },
  { amount: 10000, days: 3, label: 'Pack Boost', isPopular: true, subtitle: '3 jours • Le plus populaire pour les week-ends' },
  { amount: 25000, days: 7, label: 'Pack Pro', subtitle: '7 jours • Visibilité renforcée continue' },
  { amount: 50000, days: 14, label: 'Pack VIP', subtitle: '14 jours • Priorité maximale & multidiffusion' }
];

export const AdExpressWizard: React.FC<AdExpressWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
  prefillEstablishment,
  prefillPublication,
  prefillType = 'etablissement'
}) => {
  const { currentUser, establishments, publications, addCampaign, processAdPayment } = useAppStore();

  // Step state: 1 (Content & Type) -> 2 (AI Proposal & Score) -> 3 (Budget & Targeting) -> 4 (Payment & Confirmation)
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isSuccessDone, setIsSuccessDone] = useState<boolean>(false);

  // Form selections
  const [category, setCategory] = useState<PromoCategory>(prefillType);
  const [selectedEstId, setSelectedEstId] = useState<string>(prefillEstablishment?.id || '');
  const [selectedPubId, setSelectedPubId] = useState<string>(prefillPublication?.id || '');
  
  // Content inputs
  const [rawText, setRawText] = useState<string>(prefillPublication?.description ? prefillPublication.description.replace(/<[^>]*>?/gm, '') : '');
  const [mediaUrl, setMediaUrl] = useState<string>(
    prefillPublication?.imageUrl || 
    (prefillEstablishment?.photos && prefillEstablishment.photos[0]) || 
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // AI Generated output
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [adTitle, setAdTitle] = useState<string>(prefillPublication?.title || prefillEstablishment?.name ? `🔥 Soirée Spéciale chez ${prefillEstablishment?.name}` : '🔥 Soirée Inoubliable ZAKA+');
  const [adDescription, setAdDescription] = useState<string>('');
  const [ctaText, setCtaText] = useState<AdCTA>('WhatsApp');
  const [ctaLink, setCtaLink] = useState<string>(prefillEstablishment?.phone || currentUser?.phone || '+22670000000');
  const [adScore, setAdScore] = useState<number>(88);
  const [scoreTips, setScoreTips] = useState<string[]>([]);
  const [format, setFormat] = useState<AdFormat>('publication_sponsorisee');

  // Targeting & Budget
  const [selectedCity, setSelectedCity] = useState<string>(prefillEstablishment?.city || 'Ouagadougou');
  const [targetingZone, setTargetingZone] = useState<'city' | 'around_me'>('city');
  const [useAiTargeting, setUseAiTargeting] = useState<boolean>(true);
  const [selectedBudget, setSelectedBudget] = useState<number>(10000);
  const [selectedDays, setSelectedDays] = useState<number>(3);
  const [customBudget, setCustomBudget] = useState<string>('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Orange Money' | 'Moov Money'>('Orange Money');
  const [paymentPhone, setPaymentPhone] = useState<string>(currentUser?.phone || '');
  const [transactionOtp, setTransactionOtp] = useState<string>('');
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Find associated establishment
  const currentEst = establishments.find(e => e.id === selectedEstId) || prefillEstablishment || (establishments.length > 0 ? establishments[0] : null);

  // Sync if establishment or publication is chosen
  useEffect(() => {
    if (prefillEstablishment) {
      setSelectedEstId(prefillEstablishment.id);
      if (prefillEstablishment.photos && prefillEstablishment.photos[0]) {
        setMediaUrl(prefillEstablishment.photos[0]);
      }
      if (prefillEstablishment.phone) {
        setCtaLink(prefillEstablishment.phone);
      }
    }
  }, [prefillEstablishment]);

  useEffect(() => {
    if (prefillPublication) {
      setSelectedPubId(prefillPublication.id);
      if (prefillPublication.title) setAdTitle(`🔥 ${prefillPublication.title}`);
      if (prefillPublication.imageUrl) setMediaUrl(prefillPublication.imageUrl);
      if (prefillPublication.description) {
        const clean = prefillPublication.description.replace(/<[^>]*>?/gm, '');
        setRawText(clean);
        setAdDescription(clean);
      }
    }
  }, [prefillPublication]);

  if (!isOpen) return null;

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploading(true);
        const base64 = await compressImage(e.target.files[0], 1080, 1080, 0.8);
        setMediaUrl(base64);
      } catch (err) {
        console.error("Upload error", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Trigger ZAKA AI Generation (Step 1 -> Step 2)
  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const result: ZakaAiExpressAdResult = await generateExpressAdWithAI({
        category,
        rawText,
        establishmentName: currentEst?.name || currentUser?.name,
        city: currentEst?.city || selectedCity,
        neighborhood: currentEst?.neighborhood,
        hasImage: !!mediaUrl,
        priceMentioned: rawText.match(/\d+[\s.]*(?:f|cfa|fcfa|frs)/i)?.[0]
      });

      setAdTitle(result.title);
      setAdDescription(result.description);
      setCtaText(result.ctaText);
      setAdScore(result.score);
      setScoreTips(result.scoreTips);
      setSelectedBudget(result.recommendedBudget || 10000);
      setSelectedDays(result.recommendedDays || 3);
      setStep(2);
    } catch (err) {
      console.error(err);
      setStep(2);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Submit and Pay
  const handleFinalSubmit = async () => {
    if (!currentUser) return;
    setIsPaying(true);
    try {
      const finalAmount = customBudget ? parseInt(customBudget, 10) || selectedBudget : selectedBudget;
      const todayStr = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + selectedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // 1. Create Campaign
      const campaignId = await addCampaign(
        {
          advertiserId: currentUser.id,
          advertiserName: currentEst?.name || currentUser.name || 'Annonceur ZAKA+',
          title: adTitle,
          objective: 'promo_evenement' as CampaignObjective,
          budgetType: 'lifetime',
          budgetTotal: finalAmount,
          startDate: todayStr,
          endDate: endDate,
          status: 'en_attente' as CampaignStatus,
          targeting: {
            cities: [selectedCity],
            neighborhoods: currentEst?.neighborhood ? [currentEst.neighborhood] : [],
            ageRanges: ['18-25', '26-35', '36-50'],
            interests: ['sorties', 'musique', 'restaurants', 'événements'],
            keyMoments: ['vendredi_soir', 'samedi_soir']
          }
        },
        [
          {
            advertiserId: currentUser.id,
            advertiserName: currentEst?.name || currentUser.name || 'Annonceur ZAKA+',
            title: adTitle,
            format: 'publication_sponsorisee',
            mediaUrl: mediaUrl,
            description: adDescription,
            ctaText: ctaText,
            ctaLink: ctaLink || currentUser.phone || '+22670000000',
            placements: ['home_banner', 'home_sponsored', 'establishment_recommended', 'event_sponsored'],
            status: 'en_attente'
          }
        ]
      );

      // 2. Process Ad Payment
      await processAdPayment({
        advertiserId: currentUser.id,
        advertiserName: currentEst?.name || currentUser.name || 'Annonceur ZAKA+',
        campaignId: campaignId,
        amount: finalAmount,
        method: paymentMethod,
        phoneUsed: paymentPhone,
        transactionRef: `EXP-${Date.now().toString().slice(-6)}`,
        packName: selectedBudget === 5000 ? 'STARTER' : selectedBudget === 10000 ? 'BOOST' : selectedBudget === 25000 ? 'PREMIUM' : 'BUSINESS'
      });

      setIsSuccessDone(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error creating express ad", err);
      alert("Une erreur est survenue lors de la création de la campagne.");
    } finally {
      setIsPaying(false);
    }
  };

  // Estimated stats calculation
  const currentTotalBudget = customBudget ? parseInt(customBudget, 10) || selectedBudget : selectedBudget;
  const estimatedImpressions = Math.round(currentTotalBudget * 0.85);
  const estimatedReach = Math.round(estimatedImpressions * 0.72);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg leading-tight tracking-tight">ZAKA ADS EXPRESS</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-[10px] font-black uppercase tracking-wider">2 Min</span>
              </div>
              <p className="text-xs text-orange-100 font-medium">Une photo + quelques mots = Votre pub en ligne</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {!isSuccessDone && (
          <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
              <span>Contenu</span>
            </div>
            <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
              <span>Aperçu IA</span>
            </div>
            <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
              <span>Budget</span>
            </div>
            <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center gap-1.5 font-bold text-gray-700 dark:text-gray-300">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step >= 4 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>4</span>
              <span>Paiement</span>
            </div>
          </div>
        )}

        {/* Body Content with smooth scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">

          {/* SUCCESS SCREEN */}
          {isSuccessDone ? (
            <div className="text-center py-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-gray-900 dark:text-white">Publicité Soumise avec Succès !</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Votre annonce a été transmise à l'équipe de modération ZAKA Ads. Dès validation de votre paiement Mobile Money, elle sera diffusée auprès des clients de <strong>{selectedCity}</strong>.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Campagne :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{adTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Budget investi :</span>
                  <span className="font-bold text-orange-600">{currentTotalBudget.toLocaleString('fr-FR')} FCFA ({selectedDays} jours)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode de règlement :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{paymentMethod} ({paymentPhone})</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/20 cursor-pointer text-sm"
              >
                Accéder à mon tableau de bord
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: WHAT TO PROMOTE & CONTENT */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      1. Que voulez-vous promouvoir ?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'etablissement', label: 'Mon Établissement', icon: Building2, desc: 'Lieu, maquis, resto' },
                        { id: 'evenement', label: 'Mon Événement', icon: Music, desc: 'Soirée, concert, live' },
                        { id: 'promotion', label: 'Ma Promotion', icon: Flame, desc: 'Happy hour, remise' },
                        { id: 'dj', label: 'Soirée DJ / Artiste', icon: Music, desc: 'Mix & prestation' },
                        { id: 'produit', label: 'Mon Produit / Menu', icon: Utensils, desc: 'Plat, boisson, pack' },
                        { id: 'coiffure', label: 'Salon de Coiffure', icon: Scissors, desc: 'Coupes, tresses, soins' }
                      ].map(item => {
                        const Icon = item.icon;
                        const isSelected = category === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id as PromoCategory)}
                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                              isSelected 
                                ? 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400 ring-2 ring-orange-500/20 font-bold' 
                                : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                            <div>
                              <div className="text-xs font-bold leading-tight">{item.label}</div>
                              <div className="text-[10px] text-gray-400">{item.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto-filled details from existing establishment */}
                  {currentEst && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-3.5 rounded-2xl border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">{currentEst.name}</span>
                          <span className="text-[11px] text-gray-500">{currentEst.city} • {currentEst.neighborhood || 'Burkina Faso'}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-bold rounded-lg text-[10px]">
                        Pré-rempli
                      </span>
                    </div>
                  )}

                  {/* Photo / Media upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      <span>2. Photo ou visuel de l'annonce</span>
                      <span className="text-[11px] text-orange-600 font-medium">JPEG, PNG, WEBP</span>
                    </label>

                    <div className="flex gap-3 items-center">
                      <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700 relative shrink-0">
                        {mediaUrl ? (
                          <img src={mediaUrl} alt="Visual preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[9px]">Photo</span>
                          </div>
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">
                            Upload...
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs cursor-pointer transition-all border border-gray-200 dark:border-gray-700">
                          <Upload className="w-4 h-4 text-orange-500" />
                          <span>{isUploading ? 'Chargement...' : 'Choisir une photo'}</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <p className="text-[10px] text-gray-400 leading-tight">
                          💡 Une belle photo lumineuse augmente de 60% les prises de contact.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Simple text description */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      3. Décrivez votre offre en quelques mots
                    </label>
                    <textarea
                      rows={3}
                      value={rawText}
                      onChange={e => setRawText(e.target.value)}
                      placeholder="Ex: Grande soirée samedi avec DJ Kader. Entrée 2 000 FCFA. Cocktail offert aux 50 premières personnes !"
                      className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white focus:bg-white focus:border-orange-500 outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-400">
                      Pas besoin de rédiger un long texte : <strong>ZAKA AI</strong> va transformer vos mots en annonce captivante !
                    </p>
                  </div>

                  {/* Button to AI step */}
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 hover:opacity-95 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>ZAKA AI crée votre publicité...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Générer avec ZAKA AI (Moins de 2 min)</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>

                </div>
              )}

              {/* STEP 2: AI AD PROPOSAL & SCORE */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Quality Score Badge */}
                  <div className="bg-gradient-to-r from-emerald-500/10 via-orange-500/10 to-amber-500/10 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">ZAKA AD SCORE :</span>
                        <span className="text-lg font-black text-emerald-600">{adScore}/100 ⭐</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">Score d'attractivité et de lisibilité calculé par l'IA</p>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg">
                      Qualité Optimale
                    </span>
                  </div>

                  {/* AI Preview in-app Native Card */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Aperçu exact de votre annonce dans ZAKA+
                    </label>

                    <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-orange-950 text-white rounded-3xl overflow-hidden shadow-xl border border-orange-500/30">
                      {/* Media Header */}
                      <div className="h-44 bg-gray-800 relative overflow-hidden">
                        <img src={mediaUrl} alt="Ad Visual" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-orange-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-white" />
                          <span>Sponsorisé</span>
                        </div>
                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-orange-400 border border-orange-500/30 text-[10px] font-black rounded-lg">
                          ZAKA ADS EXPRESS
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h4 className="font-black text-base sm:text-lg leading-tight text-white">{adTitle}</h4>
                          <span className="text-[11px] text-orange-300 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {currentEst?.name || 'Établissement'} • {selectedCity}
                          </span>
                        </div>
                      </div>

                      {/* Ad Body */}
                      <div className="p-4 space-y-3">
                        <p className="text-xs text-gray-200 leading-relaxed font-normal">
                          {adDescription}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[11px] text-gray-400">
                            {currentEst?.phone || currentUser?.phone || 'Contact direct'}
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/30"
                          >
                            {ctaText === 'WhatsApp' ? <MessageSquare className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                            <span>{ctaText}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimization Tips from AI */}
                  {scoreTips.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-1.5 text-xs">
                      <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Conseils d'optimisation ZAKA AI</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400 text-[11px]">
                        {scoreTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Modifier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
                    >
                      <span>Continuer vers Budget</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 3: BUDGET & TARGETING */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Budget Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Choisissez votre budget de diffusion
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {BUDGET_OPTIONS.map(opt => {
                        const isSelected = selectedBudget === opt.amount && !customBudget;
                        return (
                          <button
                            key={opt.amount}
                            type="button"
                            onClick={() => {
                              setSelectedBudget(opt.amount);
                              setSelectedDays(opt.days);
                              setCustomBudget('');
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                              isSelected 
                                ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500/20' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {opt.isPopular && (
                              <span className="absolute -top-2 right-3 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-full shadow-xs">
                                🔥 Le plus populaire
                              </span>
                            )}
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm font-black">{opt.label}</span>
                              <span className="text-sm font-black text-orange-600">{opt.amount.toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">{opt.subtitle}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Targeting Area */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Zone géographique de diffusion
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      {['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora'].map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setSelectedCity(city)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                            selectedCity === city
                              ? 'bg-orange-500/10 border-orange-500 text-orange-600'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{city}</span>
                          {selectedCity === city && <Check className="w-3.5 h-3.5 text-orange-600" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Estimation Box */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-wider block">
                      Estimation d'impact ZAKA Ads
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Portée estimée</span>
                        <span className="font-black text-gray-900 dark:text-white text-base">≈ {estimatedReach.toLocaleString('fr-FR')}</span>
                        <span className="text-[10px] text-emerald-600 font-medium block">personnes touchées</span>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
                        <span className="text-[10px] text-gray-400 block">Impressions prévues</span>
                        <span className="font-black text-orange-600 text-base">≈ {estimatedImpressions.toLocaleString('fr-FR')}</span>
                        <span className="text-[10px] text-gray-400 block">affichages in-app</span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
                    >
                      <span>Passer au Paiement</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* STEP 4: MOBILE MONEY PAYMENT */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in">
                  
                  {/* Order Summary */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-4 rounded-2xl border border-orange-500/20 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-300">Publicité :</span>
                      <span className="font-black text-gray-900 dark:text-white truncate max-w-[200px]">{adTitle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-300">Durée :</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{selectedDays} jours de diffusion</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-300">Ville ciblée :</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{selectedCity}</span>
                    </div>
                    <div className="border-t border-orange-200 dark:border-orange-900/40 pt-2 flex justify-between items-center">
                      <span className="font-black text-sm text-gray-900 dark:text-white">TOTAL À RÉGLER :</span>
                      <span className="font-black text-lg text-orange-600">{currentTotalBudget.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  {/* Payment Operator Choice */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Opérateur Mobile Money
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Orange Money')}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'Orange Money'
                            ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-600 ring-2 ring-orange-500/20 font-bold'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-xs">
                          OM
                        </div>
                        <span className="text-xs font-black">Orange Money</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Moov Money')}
                        className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'Moov Money'
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 ring-2 ring-blue-500/20 font-bold'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                          MM
                        </div>
                        <span className="text-xs font-black">Moov Money</span>
                      </button>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Numéro {paymentMethod}
                    </label>
                    <input
                      type="tel"
                      value={paymentPhone}
                      onChange={e => setPaymentPhone(e.target.value)}
                      placeholder="Ex: 70 00 00 00"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Précédent</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={isPaying || !paymentPhone}
                      className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                    >
                      {isPaying ? (
                        <span>Traitement sécurisé...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Payer {currentTotalBudget.toLocaleString('fr-FR')} FCFA & Diffuser</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
