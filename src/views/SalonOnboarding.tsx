import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import {
  fetchBeautySalonByUserId,
  saveBeautySalon,
  saveBeautyService,
  saveSalonBusinessHours,
  BEAUTY_TYPE_LABELS,
  BEAUTY_DAYS_CONFIG
} from '../lib/beautyService';
import { BeautySalon, BeautySalonType, BeautyServiceCategory } from '../types';
import {
  Sparkles,
  Store,
  MapPin,
  Phone,
  Clock,
  Scissors,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Home,
  Check,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { uploadToSupabaseStorage } from '../lib/supabaseStorage';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export function SalonOnboarding() {
  const { currentUser, upgradeToSalonCoiffure, addNotification } = useAppStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [existingSalon, setExistingSalon] = useState<BeautySalon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [formData, setFormData] = useState({
    nom: '',
    typeEtablissement: 'coiffure_femme' as BeautySalonType,
    telephone: currentUser?.phone || '',
    whatsapp: currentUser?.phone || '',
    ville: currentUser?.city || 'Ouagadougou',
    quartier: '',
    adresse: '',
    description: '',
    accepteSansRdv: true,
    aDomicile: false,
    photoProfil: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200'
  });

  // Initial Prestation State
  const [services, setServices] = useState<Array<{
    nom: string;
    categorie: BeautyServiceCategory;
    dureeMinutes: number;
    prixFcfa: number;
  }>>([
    { nom: 'Coupe / Coiffure Tendance', categorie: 'coiffure', dureeMinutes: 45, prixFcfa: 3500 },
    { nom: 'Soin / Shampooing & Brushing', categorie: 'soins', dureeMinutes: 30, prixFcfa: 2500 }
  ]);

  const [newService, setNewService] = useState({
    nom: '',
    categorie: 'coiffure' as BeautyServiceCategory,
    dureeMinutes: 30,
    prixFcfa: 2000
  });

  // Check existing salon on mount
  useEffect(() => {
    let isMounted = true;
    const checkSalonStatus = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const salon = await fetchBeautySalonByUserId(currentUser.id);
        if (isMounted) {
          if (salon) {
            setExistingSalon(salon);
            // If salon already exists, redirect directly to dashboard
            navigate('/beauty-dashboard', { replace: true });
            return;
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Erreur vérification salon onboarding:', err);
        if (isMounted) setLoading(false);
      }
    };

    checkSalonStatus();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, navigate]);

  // Handle Role Upgrade if needed
  const handleUpgradeRole = async () => {
    if (!upgradeToSalonCoiffure) return;
    try {
      await upgradeToSalonCoiffure();
      setFormData(prev => ({
        ...prev,
        telephone: currentUser?.phone || prev.telephone,
        whatsapp: currentUser?.phone || prev.whatsapp
      }));
    } catch (err) {
      console.error('Erreur upgrade role:', err);
    }
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.nom.trim() || newService.prixFcfa <= 0) return;
    setServices(prev => [...prev, { ...newService }]);
    setNewService({
      nom: '',
      categorie: 'coiffure',
      dureeMinutes: 30,
      prixFcfa: 2000
    });
  };

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  // Submit and create salon profile
  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) {
      setErrorMsg('Veuillez vous connecter pour créer votre salon.');
      return;
    }

    if (!formData.nom.trim()) {
      setErrorMsg('Veuillez indiquer le nom de votre salon.');
      setStep(1);
      return;
    }

    if (!formData.telephone.trim()) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone pour les réservations.');
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Ensure user role is salon_coiffure
      if (currentUser.role !== 'salon_coiffure' && currentUser.role !== 'admin') {
        if (upgradeToSalonCoiffure) {
          await upgradeToSalonCoiffure();
        }
      }

      // 2. Save Salon to Supabase / Local Store
      const createdSalon = await saveBeautySalon({
        userId: currentUser.id,
        nom: formData.nom.trim(),
        typeEtablissement: formData.typeEtablissement,
        telephone: formData.telephone.trim(),
        whatsapp: formData.whatsapp.trim() || formData.telephone.trim(),
        ville: formData.ville,
        quartier: formData.quartier.trim(),
        adresse: formData.adresse.trim(),
        description: formData.description.trim(),
        accepteSansRdv: formData.accepteSansRdv,
        aDomicile: formData.aDomicile,
        photoProfil: formData.photoProfil,
        photoCouverture: formData.photoCouverture,
        estVerifie: true
      });

      // 3. Save initial services
      if (createdSalon && services.length > 0) {
        for (const s of services) {
          try {
            await saveBeautyService({
              salonId: createdSalon.id,
              nom: s.nom,
              categorie: s.categorie,
              dureeMinutes: s.dureeMinutes,
              prixFcfa: s.prixFcfa,
              estPopulaire: true,
              estActif: true
            });
          } catch (servErr) {
            console.warn('Erreur création service initial:', servErr);
          }
        }
      }

      // 4. Send Confirmation Notification
      if (addNotification) {
        addNotification({
          userId: currentUser.id,
          title: '🎉 Félicitations ! Votre salon est en ligne',
          message: `Votre espace professionnel « ${formData.nom} » a été configuré avec succès sur ZAKA Beauty.`,
          type: 'general',
          data: { salonId: createdSalon.id }
        });
      }

      // 5. Navigate to Beauty Dashboard
      navigate('/beauty-dashboard', { replace: true });
    } catch (err: any) {
      console.error('Erreur Onboarding salon:', err);
      setErrorMsg(err?.message || "Une erreur est survenue lors de la configuration de votre salon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
          Vérification de votre profil Salon de Beauté...
        </p>
      </div>
    );
  }

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
          Connexion requise
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Connectez-vous ou créez un compte professionnel pour configurer votre salon de coiffure ou institut de beauté.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Se connecter / Créer un compte
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-rose-600/15 mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Onboarding Professionnel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Configurez votre Salon de Coiffure & Beauté
          </h1>
          <p className="text-sm text-rose-100 max-w-xl">
            Complétez ces informations en quelques minutes pour activer votre agenda en ligne, recevoir des rendez-vous et attirer de nouveaux clients.
          </p>
        </div>
      </div>

      {/* Role Verification Alert if not salon_coiffure */}
      {currentUser.role !== 'salon_coiffure' && currentUser.role !== 'admin' && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200 font-medium">
              Votre compte actuel est en rôle <strong>{currentUser.role}</strong>. Cliquez pour activer le rôle <strong>Salon de Coiffure / Beauté</strong>.
            </p>
          </div>
          <button
            onClick={handleUpgradeRole}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold whitespace-nowrap hover:bg-amber-700 transition-colors"
          >
            Activer le Rôle Salon
          </button>
        </div>
      )}

      {/* Stepper Indicator */}
      <div className="flex items-center justify-between mb-8 px-2 sm:px-6">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 text-xs font-extrabold transition-colors ${
            step === 1 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
            step === 1 ? 'bg-rose-600 text-white' : step > 1 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
          }`}>
            1
          </div>
          <span className="hidden sm:inline">Établissement</span>
        </button>

        <div className={`flex-1 h-0.5 mx-3 ${step > 1 ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-800'}`} />

        <button
          type="button"
          onClick={() => setStep(2)}
          className={`flex items-center gap-2 text-xs font-extrabold transition-colors ${
            step === 2 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
            step === 2 ? 'bg-rose-600 text-white' : step > 2 ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
          }`}>
            2
          </div>
          <span className="hidden sm:inline">Prestations</span>
        </button>

        <div className={`flex-1 h-0.5 mx-3 ${step > 2 ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-800'}`} />

        <button
          type="button"
          onClick={() => setStep(3)}
          className={`flex items-center gap-2 text-xs font-extrabold transition-colors ${
            step === 3 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
            step === 3 ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            3
          </div>
          <span className="hidden sm:inline">Finalisation</span>
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Onboarding Form Steps */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-rose-600" />
                Informations Principales
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Indiquez les coordonnées et la localisation de votre institut pour que vos clients puissent vous trouver facilement.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nom officiel de l'établissement / Salon *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Glamour Beauté & Spa, Barber VIP, Afro Chic Tresses..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Spécialité / Type d'activité *
                  </label>
                  <select
                    value={formData.typeEtablissement}
                    onChange={e => setFormData({ ...formData, typeEtablissement: e.target.value as BeautySalonType })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  >
                    {Object.entries(BEAUTY_TYPE_LABELS).map(([key, config]) => (
                      <option key={key} value={key}>{config.icon} {config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ville *
                  </label>
                  <select
                    value={formData.ville}
                    onChange={e => setFormData({ ...formData, ville: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  >
                    <option value="Ouagadougou">Ouagadougou</option>
                    <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                    <option value="Koudougou">Koudougou</option>
                    <option value="Ouahigouya">Ouahigouya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Quartier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.quartier}
                    onChange={e => setFormData({ ...formData, quartier: e.target.value })}
                    placeholder="Ex: Ouaga 2000, 1200 Logements, Koulouba..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Adresse ou repère précis
                  </label>
                  <input
                    type="text"
                    value={formData.adresse}
                    onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                    placeholder="Ex: Face pharmacie, Avenue Pascal Zagré..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone de réservation *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="+226 70 00 00 00"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Numéro WhatsApp (RDV & Alertes)
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+226 70 00 00 00"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description / Présentation du Salon
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Présentez votre univers, vos techniques, votre équipe et votre savoir-faire..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-rose-500 focus:bg-white outline-none font-medium text-sm text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex-1">
                  <input
                    type="checkbox"
                    checked={formData.accepteSansRdv}
                    onChange={e => setFormData({ ...formData, accepteSansRdv: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Accepte les clients sans RDV (Walk-in)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex-1">
                  <input
                    type="checkbox"
                    checked={formData.aDomicile}
                    onChange={e => setFormData({ ...formData, aDomicile: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Propose des prestations à domicile
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!formData.nom.trim() || !formData.telephone.trim()) {
                    setErrorMsg('Veuillez remplir le nom et le téléphone du salon.');
                    return;
                  }
                  setErrorMsg(null);
                  setStep(2);
                }}
                className="px-6 py-3 bg-rose-600 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
              >
                <span>Continuer vers les Prestations</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-rose-600" />
                Vos Prestations & Tarifs Initiaux
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Ajoutez vos services principaux. Vous pourrez en ajouter ou modifier d'autres à tout moment depuis votre tableau de bord.
              </p>
            </div>

            {/* List of current services */}
            <div className="space-y-2.5">
              {services.map((srv, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl"
                >
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {srv.nom}
                    </h4>
                    <span className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>⏱️ {srv.dureeMinutes} min</span>
                      <span>•</span>
                      <span className="capitalize">{srv.categorie}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-xl border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
                      {srv.prixFcfa.toLocaleString()} FCFA
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(idx)}
                      className="text-xs text-gray-400 hover:text-red-500 font-bold p-1"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add service form */}
            <form onSubmit={handleAddCustomService} className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-600 dark:text-gray-300">
                + Ajouter une prestation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Nom du service (Ex: Tresses, Dégradé...)"
                  value={newService.nom}
                  onChange={e => setNewService({ ...newService, nom: e.target.value })}
                  className="sm:col-span-2 px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
                <input
                  type="number"
                  placeholder="Prix en FCFA"
                  value={newService.prixFcfa || ''}
                  onChange={e => setNewService({ ...newService, prixFcfa: parseInt(e.target.value) || 0 })}
                  className="px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">Durée :</span>
                  <select
                    value={newService.dureeMinutes}
                    onChange={e => setNewService({ ...newService, dureeMinutes: parseInt(e.target.value) })}
                    className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium outline-none"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 heure</option>
                    <option value={90}>1h30</option>
                    <option value={120}>2 heures</option>
                    <option value={180}>3 heures</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-xs font-black hover:opacity-90 transition-opacity"
                >
                  Ajouter au catalogue
                </button>
              </div>
            </form>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-rose-600 text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
              >
                <span>Finaliser la configuration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
              <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-rose-600" />
                Vérification & Activation
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Relisez les détails avant d'activer votre salon et de commencer à recevoir des réservations en direct.
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 border border-rose-100 dark:border-rose-900/40 rounded-3xl space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={formData.photoProfil}
                  alt="Aperçu Salon"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                />
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    {formData.nom || 'Votre Salon'}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    {BEAUTY_TYPE_LABELS[formData.typeEtablissement]?.icon} {BEAUTY_TYPE_LABELS[formData.typeEtablissement]?.label}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {formData.quartier}, {formData.ville}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-rose-200/50 dark:border-rose-900/40 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">Téléphone</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{formData.telephone}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Prestations</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{services.length} enregistrée(s)</span>
                </div>
                <div>
                  <span className="text-gray-400 font-medium block">Sans RDV</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{formData.accepteSansRdv ? 'Oui' : 'Non'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitOnboarding}
                className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Création du Salon en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Activer Mon Espace Salon</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
