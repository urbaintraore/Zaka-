import React, { useState } from 'react';
import { useAppStore } from '../store';
import { AdPackage, AdPaymentMethod } from '../types';
import { X, Check, Zap, Sparkles, ShieldCheck, CreditCard, PhoneCall, ArrowRight } from 'lucide-react';

interface ZakaAdsPacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPack?: (pack: AdPackage) => void;
}

export const ZAKA_ADS_PACKAGES: (AdPackage & { categoryTarget?: string })[] = [
  {
    id: 'pack_restaurant',
    name: 'Pack Resto & Gourmet',
    price: 35000,
    durationDays: 30,
    estimatedImpressions: 15000,
    categoryTarget: 'restaurants',
    isPopular: true,
    features: [
      'Mise en avant du "Menu du Jour" en tête de feed',
      'Diffusion ciblée heures de repas (11h-13h & 18h-20h)',
      'Bouton d\'action direct "Réserver une Table" & WhatsApp',
      'Geofencing par quartier (Ouaga 2000, Zone du Bois, etc.)',
      'Statistiques de réservations & clics gourmands'
    ]
  },
  {
    id: 'pack_salon_beaute',
    name: 'Pack Salon Beauté & Coiffure',
    price: 30000,
    durationDays: 30,
    estimatedImpressions: 12500,
    categoryTarget: 'salons_beaute',
    features: [
      'Sponsoring de votre Galerie Coiffures & Tresses',
      'Bouton "Prendre RDV" & Appel direct au salon',
      'Ciblage spécifique audience "Coiffure & Esthétique"',
      'Boost spécial créneaux semaine & promos week-end',
      'Génération de rendez-vous en ligne certifiée'
    ]
  },
  {
    id: 'pack_grands_annonceurs',
    name: 'Pack Grands Annonceurs & Marques',
    price: 500000,
    durationDays: 30,
    estimatedImpressions: 200000,
    categoryTarget: 'annonceurs',
    features: [
      'Domination Bannières d\'Accueil & Feed principal',
      'Sponsoring & Co-Branding fiches maquis & lounges',
      'Campagnes Notifications Push geofencées illimitées',
      'Formats Vidéos HD & Pop-ups interactifs',
      'Accompagnement Manager AdTech ZAKA dédié'
    ]
  },
  {
    id: 'business',
    name: 'Pack Business Multi-Secteurs',
    price: 150000,
    durationDays: 30,
    estimatedImpressions: 40000,
    categoryTarget: 'tous',
    features: [
      'Tous les emplacements Starter & Feed',
      'Publications sponsorisées dans le fil principal',
      '1 Notification Push sponsorisée / mois',
      'Ciblage par quartier et tranches d\'âge',
      'Rapports analytiques détaillés & CTR'
    ]
  },
  {
    id: 'boost_express',
    name: 'Boost Événementiel Express',
    price: 5000,
    durationDays: 1,
    estimatedImpressions: 3000,
    categoryTarget: 'tous',
    features: [
      'Boost immédiat 24h pour soirée, concert ou DJ',
      'Mise en tête de liste Événements & Soirées',
      'Diffusion prioritaire le vendredi ou samedi soir'
    ]
  }
];

export const ZakaAdsPacksModal: React.FC<ZakaAdsPacksModalProps> = ({
  isOpen,
  onClose,
  onSelectPack
}) => {
  const { currentUser, processAdPayment } = useAppStore();
  const [selectedPack, setSelectedPack] = useState<AdPackage | null>(ZAKA_ADS_PACKAGES[1]); // Default Business
  const [paymentMethod, setPaymentMethod] = useState<AdPaymentMethod>('orange_money');
  const [phoneNumber, setPhoneNumber] = useState<string>(currentUser?.phone || '');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'packages' | 'payment' | 'success'>('packages');

  const [packCategoryFilter, setPackCategoryFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredPackages = ZAKA_ADS_PACKAGES.filter(p => {
    if (packCategoryFilter === 'all') return true;
    if (packCategoryFilter === 'restaurants') return p.categoryTarget === 'restaurants' || p.categoryTarget === 'tous';
    if (packCategoryFilter === 'salons_beaute') return p.categoryTarget === 'salons_beaute' || p.categoryTarget === 'tous';
    if (packCategoryFilter === 'annonceurs') return p.categoryTarget === 'annonceurs' || p.categoryTarget === 'tous';
    return true;
  });

  const handleProceedToPayment = () => {
    if (!selectedPack) return;
    if (onSelectPack) {
      onSelectPack(selectedPack);
    }
    setStep('payment');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPack || !currentUser) return;

    if (!phoneNumber || phoneNumber.length < 8) {
      alert("Veuillez saisir un numéro de téléphone valide au Burkina Faso (ex: 70000000)");
      return;
    }

    setLoading(true);
    try {
      await processAdPayment({
        advertiserId: currentUser.id,
        advertiserName: currentUser.name || 'Annonceur ZAKA+',
        packName: (selectedPack.id === 'boost_express' ? 'BOOST' : selectedPack.id.toUpperCase()) as any,
        amount: selectedPack.price,
        method: (paymentMethod === 'orange_money' ? 'Orange Money' : paymentMethod === 'moov_money' ? 'Moov Money' : 'Paiement Manuel Admin') as any,
        phoneUsed: phoneNumber,
        transactionRef: transactionRef || `REF-${Math.floor(100000 + Math.random() * 900000)}`
      });

      setStep('success');
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue lors de la validation du paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full border border-orange-500/30 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-orange-950 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Régie Publicitaire ZAKA Ads
            </span>
          </div>

          <h2 className="text-2xl font-black text-white">
            Tarifs & Offres Publicitaires
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
            Boostez la visibilité de votre maquis, club, marque ou événement auprès de milliers de jeunes burkinabès actifs sur ZAKA+.
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'packages' && (
            <div>
              {/* Sector Filter Tabs */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl gap-1.5 mb-6 overflow-x-auto hide-scrollbar">
                {[
                  { id: 'all', label: 'Tous les Packs' },
                  { id: 'restaurants', label: '🍽️ Restaurants & Gastronomie' },
                  { id: 'salons_beaute', label: '✂️ Salons & Beauté' },
                  { id: 'annonceurs', label: '🏢 Annonceurs & Marques' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPackCategoryFilter(tab.id)}
                    className={`py-2 px-3.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      packCategoryFilter === tab.id
                        ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredPackages.map((pkg) => {
                  const isSelected = selectedPack?.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPack(pkg)}
                      className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-500/5 dark:bg-orange-950/20 shadow-lg shadow-orange-500/10 scale-[1.02]' 
                          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/50 hover:border-gray-300'
                      }`}
                    >
                      {pkg.isPopular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          Le Plus Populaire
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {pkg.name}
                          </h3>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>

                        <div className="mb-4">
                          <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                            {pkg.price.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">
                            / {pkg.durationDays === 1 ? '24 heures' : `${pkg.durationDays} jours`}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center justify-between">
                          <span>Portée estimée :</span>
                          <span className="text-orange-600 dark:text-orange-400 font-black">
                            ~{pkg.estimatedImpressions.toLocaleString('fr-FR')} impr.
                          </span>
                        </div>

                        <ul className="space-y-2 mb-6">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                              <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                        }`}
                      >
                        <span>Choisir ce Pack</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Paiement Local Sécurisé & Facture Normalisée
                    </h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Réglement en FCFA via Orange Money ou Moov Money avec validation instantanée et attestation d'achat publicitaire.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'payment' && selectedPack && (
            <form onSubmit={handleSubmitPayment} className="max-w-xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                    Offre Sélectionnée
                  </span>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    {selectedPack.name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    Portée ~{selectedPack.estimatedImpressions.toLocaleString('fr-FR')} impressions
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    {selectedPack.price.toLocaleString('fr-FR')} FCFA
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setStep('packages')} 
                    className="text-[11px] font-bold text-gray-500 underline block mt-0.5 hover:text-orange-500 cursor-pointer"
                  >
                    Changer de pack
                  </button>
                </div>
              </div>

              {/* Payment Methods selection */}
              <div>
                <label className="text-xs font-bold text-gray-900 dark:text-white block mb-2">
                  Choisissez votre Moyen de Paiement :
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('orange_money')}
                    className={`p-4 rounded-2xl border-2 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'orange_money'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-orange-500 text-white font-black flex items-center justify-center text-[11px]">
                      OM
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm">Orange Money</span>
                      <span className="text-[10px] opacity-80">*144# Burkina</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('moov_money')}
                    className={`p-4 rounded-2xl border-2 font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${
                      paymentMethod === 'moov_money'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-[11px]">
                      MOOV
                    </div>
                    <div className="text-left">
                      <span className="block font-black text-sm">Moov Money</span>
                      <span className="text-[10px] opacity-80">*555# Burkina</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Numéro Téléphone Débité (Burkina Faso) :
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="ex: 70 00 00 00"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Référence ou Code SMS de la Transaction (Optionnel) :
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="ex: PP260808.1234.B12345"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('packages')}
                  className="w-1/3 py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-100 cursor-pointer"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Validation du paiement...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Confirmer ({selectedPack.price.toLocaleString('fr-FR')} FCFA)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                Paiement Publicitaire Soumis !
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Votre transaction pour le <strong className="text-orange-500">{selectedPack?.name}</strong> a bien été enregistrée. Les crédits d'impressions sont désormais actifs dans votre espace annonceur ZAKA Ads.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all cursor-pointer"
              >
                Accéder au Dashboard Annonceur
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
