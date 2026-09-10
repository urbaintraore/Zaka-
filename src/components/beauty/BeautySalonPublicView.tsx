import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BeautySalon,
  BeautyService,
  BeautyReview
} from '../../types';
import {
  fetchBeautySalonById,
  fetchSalonServices,
  fetchSalonReviews,
  submitBeautyReview,
  formatFcfa,
  BEAUTY_TYPE_LABELS,
  BEAUTY_CATEGORY_LABELS
} from '../../lib/beautyService';
import { useBeautyBooking } from '../../hooks/useBeautyBooking';
import { useAppStore } from '../../store';
import { HeartButton } from '../HeartButton';
import {
  MapPin,
  Star,
  Calendar,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Store,
  Home,
  Clock,
  ChevronLeft,
  Share2,
  CheckCircle2,
  X,
  Plus,
  Send,
  User,
  Heart,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

interface BeautySalonPublicViewProps {
  salon?: BeautySalon;
  onBack?: () => void;
}

export function BeautySalonPublicView({ salon: propSalon, onBack }: BeautySalonPublicViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, favorites, toggleFavorite } = useAppStore();

  const [salon, setSalon] = useState<BeautySalon | null>(propSalon || null);
  const [services, setServices] = useState<BeautyService[]>([]);
  const [reviews, setReviews] = useState<BeautyReview[]>([]);
  const [loading, setLoading] = useState(!propSalon);
  const [activeTab, setActiveTab] = useState<'services' | 'galerie' | 'horaires' | 'avis'>('services');
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Favorites state and action
  const isFavorite = Boolean(salon && Array.isArray(favorites) && favorites.includes(salon.id));

  const handleToggleFavorite = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!salon) return;
    toggleFavorite(salon.id);
    const willBeFav = !isFavorite;
    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: {
          message: willBeFav
            ? `❤️ "${salon.nom}" ajouté à vos favoris ZAKA+ !`
            : `"${salon.nom}" retiré de vos favoris.`,
          type: willBeFav ? 'success' : 'info'
        }
      })
    );
  };

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | undefined>();

  // Review Form State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewName, setReviewName] = useState(currentUser?.name || '');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Copied feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Load salon if not passed as prop
  useEffect(() => {
    if (propSalon) {
      setSalon(propSalon);
    } else if (id) {
      loadSalonData(id);
    }
  }, [id, propSalon]);

  // Load services and reviews when salon is available
  useEffect(() => {
    if (salon?.id) {
      loadServicesAndReviews(salon.id);
    }
  }, [salon?.id]);

  const loadSalonData = async (salonId: string) => {
    setLoading(true);
    try {
      const data = await fetchBeautySalonById(salonId);
      setSalon(data);
    } catch (e) {
      console.error('Erreur chargement salon:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadServicesAndReviews = async (salonId: string) => {
    try {
      const [srvs, revs] = await Promise.all([
        fetchSalonServices(salonId),
        fetchSalonReviews(salonId)
      ]);
      setServices(srvs);
      setReviews(revs);
    } catch (e) {
      console.error('Erreur services & avis:', e);
    }
  };

  // Wire up the useBeautyBooking hook
  const {
    selectedServiceId,
    setSelectedServiceId,
    selectedService,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    availableTimeSlots,
    isClosedDay,
    daySchedule,
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    clientNotes,
    setClientNotes,
    aDomicile,
    setADomicile,
    adresseDomicile,
    setAdresseDomicile,
    isSubmitting: isBookingSubmitting,
    error: bookingError,
    success: bookingSuccess,
    whatsappUrl: bookingWhatsappUrl,
    submitBooking,
    resetBooking
  } = useBeautyBooking({
    salon,
    services,
    preselectedServiceId,
    onSuccess: () => {
      // Keep modal open to show success state with WhatsApp link
    }
  });

  const handleOpenBooking = (serviceId?: string) => {
    resetBooking();
    if (serviceId) {
      setPreselectedServiceId(serviceId);
      setSelectedServiceId(serviceId);
    }
    setIsBookingOpen(true);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    if (!reviewName.trim()) return;

    setIsSubmittingReview(true);
    try {
      const newRev = await submitBeautyReview({
        salonId: salon.id,
        clientId: currentUser?.id,
        nomClient: reviewName.trim(),
        note: reviewRating,
        commentaire: reviewComment.trim() || undefined
      });
      setReviews(prev => [newRev, ...prev]);
      setReviewSuccess(true);
      setIsReviewFormOpen(false);
      setReviewComment('');
      setTimeout(() => setReviewSuccess(false), 4000);
    } catch (e) {
      console.error('Erreur envoi avis:', e);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filter services by category
  const categories = Array.from(new Set(services.map(s => s.categorie)));
  const filteredServices = services.filter(s => {
    if (!s.estActif) return false;
    if (selectedCategory === 'tous') return true;
    return s.categorie === selectedCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-500">Chargement de l'institut de beauté...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <Store className="w-16 h-16 text-gray-300 mb-3" />
        <h2 className="text-xl font-black text-gray-800 dark:text-white">Salon introuvable</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Le salon que vous recherchez n'existe pas ou n'est plus accessible.
        </p>
        <button
          onClick={() => onBack ? onBack() : navigate('/beauty')}
          className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
        >
          Retourner aux salons
        </button>
      </div>
    );
  }

  const cleanPhone = (salon.telephone || '').replace(/\D/g, '');
  const cleanWhatsApp = (salon.whatsapp || salon.telephone || '').replace(/\D/g, '');
  const whatsAppDirectUrl = `https://wa.me/${cleanWhatsApp.startsWith('226') ? cleanWhatsApp : `226${cleanWhatsApp}`}?text=${encodeURIComponent(`Bonjour ${salon.nom}, je vous contacte depuis ZAKA+ au sujet de vos prestations.`)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Top Header / Back Bar */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => onBack ? onBack() : navigate('/beauty')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Tous les Salons</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="beauty-salon-favorite-header-btn"
              type="button"
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold ring-1 ring-rose-300 dark:ring-rose-800'
                  : 'text-gray-600 dark:text-gray-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
              }`}
              title={isFavorite ? "Retirer de vos favoris ZAKA+" : "Ajouter à vos favoris ZAKA+"}
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              <span className="text-xs hidden sm:inline">{isFavorite ? "Favori" : "Sauvegarder"}</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Partager ce salon"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copiedLink && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-md">
                Lien copié !
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-6">
        {/* Hero Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
          {/* Cover Banner */}
          <div className="h-44 sm:h-60 w-full relative bg-gradient-to-r from-rose-900 via-pink-800 to-rose-950">
            {salon.photoCouverture ? (
              <img
                src={salon.photoCouverture}
                alt={salon.nom}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/40">
                <Sparkles className="w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges & HeartButton in hero */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full text-xs font-black text-rose-600 shadow-sm">
                {BEAUTY_TYPE_LABELS[salon.typeEtablissement]?.label || salon.typeEtablissement}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-amber-300">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>{salon.noteMoyenne.toFixed(1)}</span>
                  <span className="text-white/60 text-[10px]">({salon.totalAvis} avis)</span>
                </div>
                <div id="beauty-salon-favorite-hero-container">
                  <HeartButton
                    isFavorite={isFavorite}
                    onClick={handleToggleFavorite}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Header Info */}
          <div className="p-5 sm:p-6 relative pt-0">
            {/* Avatar Profile */}
            <div className="relative -mt-12 sm:-mt-14 mb-4 flex items-end justify-between">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-gray-900 overflow-hidden shadow-md bg-rose-100 dark:bg-rose-950/60 shrink-0">
                {salon.photoProfil ? (
                  <img
                    src={salon.photoProfil}
                    alt={salon.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-rose-500 font-black text-3xl">
                    {salon.nom.charAt(0)}
                  </div>
                )}
              </div>

              {salon.estVerifie && (
                <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salon Certifié</span>
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {salon.nom}
              </h1>

              <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs font-semibold text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{salon.quartier ? `${salon.quartier}, ` : ''}{salon.ville}</span>
                </span>

                {salon.aDomicile && (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                    <Home className="w-3.5 h-3.5" />
                    <span>Déplacement à domicile</span>
                  </span>
                )}

                {salon.accepteSansRdv && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sans rendez-vous accepté</span>
                  </span>
                )}
              </div>

              {salon.description && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed pt-1">
                  {salon.description}
                </p>
              )}
            </div>

            {/* 3 Prominent Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-5 mt-5 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="py-3 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <Calendar className="w-4 h-4" />
                <span>Prendre rendez-vous</span>
              </button>

              <a
                href={whatsAppDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${cleanPhone}`}
                className="py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Phone className="w-4 h-4 text-rose-500" />
                <span>Appeler ({salon.telephone})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-2xl max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm font-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catalogue ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('galerie')}
            className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'galerie'
                ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm font-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Réalisations ({salon.photosGalerie?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('horaires')}
            className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'horaires'
                ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm font-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Horaires</span>
          </button>

          <button
            onClick={() => setActiveTab('avis')}
            className={`flex-1 py-2.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'avis'
                ? 'bg-white dark:bg-gray-900 text-rose-600 shadow-sm font-black'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Avis ({reviews.length})</span>
          </button>
        </div>

        {/* TAB 1: Catalogue de Services */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                <button
                  onClick={() => setSelectedCategory('tous')}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'tous'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
                  }`}
                >
                  Toutes les prestations
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    {BEAUTY_CATEGORY_LABELS[cat as keyof typeof BEAUTY_CATEGORY_LABELS]?.label || cat}
                  </button>
                ))}
              </div>
            )}

            {filteredServices.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Aucun service proposé dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between hover:border-rose-200 dark:hover:border-rose-900/50 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white">
                              {service.nom}
                            </h3>
                            {service.estPopulaire && (
                              <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 text-[10px] font-black rounded-md uppercase tracking-wider">
                                Populaire
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {BEAUTY_CATEGORY_LABELS[service.categorie]?.label || service.categorie}
                          </span>
                        </div>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400 shrink-0">
                          {formatFcfa(service.prixFcfa)}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50 dark:border-gray-800/80">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.dureeMinutes} min</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenBooking(service.id)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Réserver</span>
                        <Calendar className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Galerie de Réalisations */}
        {activeTab === 'galerie' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-rose-500" />
                  <span>Nos Réalisations & Styles</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Découvrez les créations et travaux récents réalisés par l'équipe de {salon.nom}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all active:scale-98"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Prendre rendez-vous</span>
              </button>
            </div>

            {salon.photosGalerie && salon.photosGalerie.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {salon.photosGalerie.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photoUrl)}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 shadow-xs cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`Réalisation ${idx + 1} - ${salon.nom}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white rounded-full text-xs font-black shadow-md flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-rose-500" />
                        <span>Agrandir</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-gray-800 dark:text-white">
                  Galerie en cours de mise à jour
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Le salon n'a pas encore publié de photos de ses réalisations. Vous pouvez toujours réserver l'une de leurs prestations ci-dessous.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('services')}
                  className="mt-4 px-4 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-black rounded-xl cursor-pointer"
                >
                  Voir le catalogue des prestations
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Horaires d'Ouverture & Localisation */}
        {activeTab === 'horaires' && (
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Horaires d'ouverture hebdomadaires</span>
              </h3>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden text-xs">
                {Object.entries(salon.horairesOuverture || {}).map(([day, sched]) => (
                  <div key={day} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-900/50">
                    <span className="font-bold capitalize text-gray-700 dark:text-gray-300">
                      {day}
                    </span>
                    {sched.ouvert ? (
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {sched.ouverture} - {sched.fermeture}
                      </span>
                    ) : (
                      <span className="font-bold text-red-500">Fermé</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Adresse & Emplacement</span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {salon.adresse || 'Adresse précise non renseignée.'}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-1">
                Quartier {salon.quartier || 'Centre-ville'}, {salon.ville}, {salon.pays}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Avis & Commentaires */}
        {activeTab === 'avis' && (
          <div className="space-y-4">
            {reviewSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Merci ! Votre avis a bien été enregistré.</span>
              </div>
            )}

            {/* Header + Add Review Button */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Avis des clients ({reviews.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Note moyenne de {salon.noteMoyenne.toFixed(1)} / 5
                </p>
              </div>

              <button
                onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Laisser un avis</span>
              </button>
            </div>

            {/* Review Form Drawer */}
            {isReviewFormOpen && (
              <form
                onSubmit={handlePostReview}
                className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-md space-y-4"
              >
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Votre note et commentaire
                </h4>

                {/* Rating stars */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 ml-2">
                    {reviewRating} / 5
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Votre nom</label>
                  <input
                    type="text"
                    required
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="Votre prénom ou nom"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Votre commentaire</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Partagez votre expérience avec ce salon..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen(false)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingReview ? 'Envoi...' : 'Publier'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-500">
                  Soyez le premier à donner votre avis sur {salon.nom} !
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold text-xs">
                          {review.nomClient.charAt(0)}
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {review.nomClient}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.note
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-gray-300 dark:text-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.commentaire && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-9">
                        {review.commentaire}
                      </p>
                    )}

                    {review.reponseSalon && (
                      <div className="ml-9 mt-2 p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border-l-2 border-rose-500 text-xs">
                        <span className="font-bold text-rose-600 dark:text-rose-400 block mb-0.5">
                          Réponse du salon :
                        </span>
                        <p className="text-gray-600 dark:text-gray-300">
                          {review.reponseSalon}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE RÉSERVATION (GÉRÉ VIA useBeautyBooking) */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>Prendre rendez-vous</span>
                </h3>
                <p className="text-xs text-gray-500">{salon.nom}</p>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-gray-900 dark:text-white">
                    Rendez-vous enregistré !
                  </h4>
                  <p className="text-xs text-gray-500">
                    Votre demande pour <strong>{selectedService?.nom}</strong> le{' '}
                    <strong>{selectedDate}</strong> à <strong>{selectedTimeSlot}</strong> a bien été transmise au salon.
                  </p>
                </div>

                <div className="pt-3 space-y-2">
                  {bookingWhatsappUrl && (
                    <a
                      href={bookingWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Confirmer immédiatement sur WhatsApp</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  await submitBooking();
                }}
                className="p-5 space-y-4 max-h-[80vh] overflow-y-auto"
              >
                {bookingError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 text-xs font-bold rounded-xl">
                    {bookingError}
                  </div>
                )}

                {/* 1. Sélection de la Prestation */}
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                    Prestation souhaitée *
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold focus:border-rose-500 outline-none"
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nom} — {formatFcfa(s.prixFcfa)} ({s.dureeMinutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Date et Créneaux Horaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Date du rendez-vous *
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Heure / Créneau disponible *
                    </label>
                    {isClosedDay ? (
                      <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 text-xs font-bold rounded-xl text-center">
                        Fermé ce jour-là
                      </div>
                    ) : availableTimeSlots.length === 0 ? (
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 text-xs font-bold rounded-xl text-center">
                        Aucun créneau libre
                      </div>
                    ) : (
                      <select
                        value={selectedTimeSlot}
                        onChange={e => setSelectedTimeSlot(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold focus:border-rose-500 outline-none"
                      >
                        {availableTimeSlots.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Déplacement à domicile option */}
                {salon.aDomicile && (
                  <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800 dark:text-gray-200">
                      <input
                        type="checkbox"
                        checked={aDomicile}
                        onChange={e => setADomicile(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Prestation à mon domicile</span>
                    </label>
                    {aDomicile && (
                      <input
                        type="text"
                        required={aDomicile}
                        placeholder="Votre adresse ou repère précis (ex: Ouaga 2000, près de la pharmacie...)"
                        value={adresseDomicile}
                        onChange={e => setAdresseDomicile(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs outline-none"
                      />
                    )}
                  </div>
                )}

                {/* 3. Vos coordonnées */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Aminata Ouédraogo"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Numéro de téléphone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: 70 12 34 56"
                      value={clientPhone}
                      onChange={e => setClientPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Notes ou instructions particulières
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Type de tresse souhaité, couleur de vernis..."
                    value={clientNotes}
                    onChange={e => setClientNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsBookingOpen(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isBookingSubmitting || isClosedDay || availableTimeSlots.length === 0}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {isBookingSubmitting && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>Confirmer la réservation</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Lightbox for Gallery Photos */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            <img
              src={selectedPhoto}
              alt={`Réalisation - ${salon.nom}`}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
            />

            <div className="mt-4 flex items-center justify-between w-full px-2 text-white">
              <span className="text-xs font-bold text-gray-300">
                Réalisation par {salon.nom}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  handleOpenBooking();
                }}
                className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Prendre RDV pour ce style</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
