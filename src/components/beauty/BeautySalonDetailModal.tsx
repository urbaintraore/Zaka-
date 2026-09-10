import React, { useState, useEffect } from 'react';
import {
  BeautySalon,
  BeautyService,
  BeautyReview
} from '../../types';
import {
  fetchSalonServices,
  fetchSalonReviews,
  createBeautyReview,
  formatFcfa,
  BEAUTY_TYPE_LABELS,
  BEAUTY_CATEGORY_LABELS
} from '../../lib/beautyService';
import { useAppStore } from '../../store';
import { BeautyBookingModal } from './BeautyBookingModal';
import {
  X,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Share2,
  Sparkles,
  Home,
  Store,
  Send,
  MessageSquareQuote,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface BeautySalonDetailModalProps {
  salon: BeautySalon | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenBookingModal?: (salon: BeautySalon, serviceId?: string) => void;
}

export function BeautySalonDetailModal({
  salon,
  isOpen,
  onClose,
  onOpenBookingModal
}: BeautySalonDetailModalProps) {
  const { currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'services' | 'about' | 'reviews' | 'gallery'>('services');
  const [services, setServices] = useState<BeautyService[]>([]);
  const [reviews, setReviews] = useState<BeautyReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedServiceIdForBooking, setSelectedServiceIdForBooking] = useState<string | undefined>();

  // Add review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  useEffect(() => {
    if (salon && isOpen) {
      setLoading(true);
      Promise.all([
        fetchSalonServices(salon.id, true),
        fetchSalonReviews(salon.id)
      ])
        .then(([servicesData, reviewsData]) => {
          setServices(servicesData);
          setReviews(reviewsData);
        })
        .finally(() => setLoading(false));
    }
  }, [salon, isOpen]);

  if (!isOpen || !salon) return null;

  const typeInfo = BEAUTY_TYPE_LABELS[salon.typeEtablissement] || { label: 'Salon de beauté', icon: '✨' };

  // Group services by category
  const servicesByCategory = services.reduce((acc, s) => {
    if (!acc[s.categorie]) acc[s.categorie] = [];
    acc[s.categorie].push(s);
    return acc;
  }, {} as Record<string, BeautyService[]>);

  const handleStartBooking = (serviceId?: string) => {
    if (onOpenBookingModal) {
      onOpenBookingModal(salon, serviceId);
    } else {
      setSelectedServiceIdForBooking(serviceId);
      setIsBookingOpen(true);
    }
  };

  const handleShare = () => {
    const text = `Découvrez ${salon.nom} sur Zaka Beauty ! Prenez rendez-vous directement en ligne : ${window.location.origin}/#/beauty/${salon.id}`;
    if (navigator.share) {
      navigator.share({ title: salon.nom, text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      alert('Lien du salon copié dans le presse-papier !');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Veuillez vous connecter pour laisser un avis.');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const added = await createBeautyReview({
        salonId: salon.id,
        clientId: currentUser.id,
        nomClient: currentUser.name,
        note: newRating,
        commentaire: newComment.trim()
      });
      setReviews(prev => [added, ...prev]);
      setNewComment('');
      setReviewSuccessMsg('Merci pour votre avis ! Il a été publié.');
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la publication de l'avis");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Determine current day schedule
  const daysOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const currentDayName = daysOfWeek[new Date().getDay()];
  const currentDayHours = (salon.horairesOuverture as any)?.[currentDayName];

  const phoneCallUrl = `tel:${salon.telephone.replace(/\s+/g, '')}`;
  const whatsappUrl = salon.whatsapp
    ? `https://wa.me/${salon.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${salon.nom}, je vous contacte depuis l'application Zaka Beauty.`)}`
    : null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
          
          {/* Header Banner & Profile */}
          <div className="relative shrink-0">
            <div className="h-44 sm:h-52 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
              <img
                src={salon.photoCouverture || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200'}
                alt={salon.nom}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            </div>

            {/* Top action buttons */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                title="Partager ce salon"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Avatar & Title info overlay */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3.5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-900 shadow-xl bg-white shrink-0">
                <img
                  src={salon.photoProfil || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'}
                  alt={salon.nom}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 text-white pb-0.5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                    <span>{typeInfo.icon}</span> {typeInfo.label}
                  </span>
                  {salon.estVerifie && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600/90 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck size={11} /> Vérifié ZAKA
                    </span>
                  )}
                </div>

                <h1 className="text-lg sm:text-xl font-black truncate">{salon.nom}</h1>
                <p className="text-xs text-white/80 flex items-center gap-1">
                  <MapPin size={12} className="shrink-0 text-rose-400" />
                  <span className="truncate">{salon.quartier ? `${salon.quartier}, ` : ''}{salon.ville}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats & Contact Action Bar */}
          <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1 font-black text-gray-900 dark:text-white">
                <Star size={15} className="fill-amber-400 text-amber-400" />
                <span>{salon.noteMoyenne.toFixed(1)}</span>
                <span className="text-gray-400 font-normal">({salon.totalAvis} avis)</span>
              </div>

              {currentDayHours && (
                <div className="hidden sm:flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-bold">
                  <Clock size={13} className="text-rose-500" />
                  <span>
                    {currentDayHours.ouvert
                      ? `Aujourd'hui : ${currentDayHours.ouverture} - ${currentDayHours.fermeture}`
                      : 'Fermé aujourd\'hui'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={phoneCallUrl}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Appeler directement"
              >
                <Phone size={13} />
                <span>Appeler</span>
              </a>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Écrire sur WhatsApp"
                >
                  <MessageCircle size={13} />
                  <span>WhatsApp</span>
                </a>
              )}

              <button
                onClick={() => handleStartBooking()}
                className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                <Calendar size={13} />
                <span>Prendre RDV</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 shrink-0 bg-white dark:bg-gray-900">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Prestations & Tarifs ({services.length})
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'about'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              À propos & Horaires
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'reviews'
                  ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Avis clients ({reviews.length})
            </button>
            {salon.photosGalerie && salon.photosGalerie.length > 0 && (
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-3 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'border-rose-600 text-rose-600 dark:text-rose-400'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                Galerie ({salon.photosGalerie.length})
              </button>
            )}
          </div>

          {/* Tab Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* TAB 1: SERVICES & TARIFS */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Features chips */}
                <div className="flex flex-wrap gap-2">
                  {salon.accepteSansRdv && (
                    <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      <Store size={12} /> Accepte sans rendez-vous
                    </span>
                  )}
                  {salon.aDomicile && (
                    <span className="text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 px-2.5 py-1 rounded-xl flex items-center gap-1">
                      <Home size={12} /> Prestations à domicile disponibles
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-gray-400">Chargement de la carte des services...</div>
                ) : services.length === 0 ? (
                  <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-6">
                    <p className="text-xs font-bold text-gray-500">Aucun tarif enregistré pour le moment.</p>
                    <p className="text-[11px] text-gray-400 mt-1">Vous pouvez contacter le salon directement pour un devis.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(servicesByCategory).map(([catKey, catServices]) => {
                      const catInfo = BEAUTY_CATEGORY_LABELS[catKey as any] || { label: catKey, icon: '✨' };
                      return (
                        <div key={catKey} className="space-y-2.5">
                          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-gray-100 dark:border-gray-800">
                            <span>{catInfo.icon}</span>
                            <span>{catInfo.label}</span>
                          </h3>

                          <div className="grid grid-cols-1 gap-2.5">
                            {catServices.map(service => (
                              <div
                                key={service.id}
                                className="p-3.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100/80 dark:hover:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-3 transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-gray-900 dark:text-white">
                                      {service.nom}
                                    </h4>
                                    {service.estPopulaire && (
                                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                                        ★ Populaire
                                      </span>
                                    )}
                                  </div>
                                  {service.description && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                      {service.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-bold">
                                    <span className="flex items-center gap-1">
                                      <Clock size={10} /> {service.dureeMinutes} min
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400">
                                    {formatFcfa(service.prixFcfa)}
                                  </span>

                                  <button
                                    onClick={() => handleStartBooking(service.id)}
                                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
                                  >
                                    <span>Réserver</span>
                                    <ChevronRight size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ABOUT & OPENING HOURS */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {salon.description && (
                  <div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                      Présentation du salon
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                      {salon.description}
                    </p>
                  </div>
                )}

                {/* Coordonnées */}
                <div>
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2">
                    Coordonnées & Localisation
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-start gap-2.5">
                      <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">Adresse</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {salon.adresse || 'Centre-ville'}
                          {salon.quartier ? `, Quartier ${salon.quartier}` : ''}
                        </span>
                        <span className="text-gray-400 block mt-0.5">{salon.ville}, {salon.pays}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-start gap-2.5">
                      <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">Téléphone direct</span>
                        <span className="text-gray-700 dark:text-gray-300 font-mono font-bold">{salon.telephone}</span>
                        {salon.whatsapp && (
                          <span className="text-emerald-600 dark:text-emerald-400 block mt-0.5 text-[11px] font-bold">
                            WhatsApp : {salon.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horaires d'ouverture */}
                {salon.horairesOuverture && (
                  <div>
                    <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock size={14} className="text-rose-500" />
                      Horaires d'ouverture
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 divide-y divide-gray-200/60 dark:divide-gray-700/60 text-xs">
                      {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map(day => {
                        const dayData = (salon.horairesOuverture as any)?.[day];
                        const isToday = day === currentDayName;
                        return (
                          <div
                            key={day}
                            className={`py-2 flex justify-between items-center ${
                              isToday ? 'font-black text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <span className="capitalize flex items-center gap-1.5">
                              {day} {isToday && <span className="text-[10px] bg-rose-100 dark:bg-rose-950 px-1.5 py-0.2 rounded font-black">Aujourd'hui</span>}
                            </span>
                            <span>
                              {dayData?.ouvert
                                ? `${dayData.ouverture} - ${dayData.fermeture}`
                                : 'Fermé'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Submission Form */}
                <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4 rounded-2xl space-y-3">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquareQuote size={15} className="text-rose-600" />
                    Laisser un avis sur {salon.nom}
                  </h3>

                  {reviewSuccessMsg && (
                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl font-bold">
                      {reviewSuccessMsg}
                    </div>
                  )}

                  <form onSubmit={handleReviewSubmit} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-bold">Votre note :</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              size={18}
                              className={
                                star <= newRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      required
                      placeholder="Racontez votre expérience (accueil, professionnalisme, résultat final)..."
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 resize-none"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !newComment.trim()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Send size={12} />
                        <span>{isSubmittingReview ? 'Envoi...' : 'Publier mon avis'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">
                      Soyez le premier à donner votre avis sur ce salon !
                    </div>
                  ) : (
                    reviews.map(rev => (
                      <div
                        key={rev.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold flex items-center justify-center text-[10px]">
                              {rev.nomClient.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white block">
                                {rev.nomClient}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(rev.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star
                                key={s}
                                size={12}
                                className={s <= rev.note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.commentaire && (
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                            {rev.commentaire}
                          </p>
                        )}

                        {/* Salon's response */}
                        {rev.reponseSalon && (
                          <div className="mt-2 pl-3 border-l-2 border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-r-xl">
                            <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400 block mb-0.5">
                              Réponse du salon :
                            </span>
                            <p className="text-[11px] text-gray-700 dark:text-gray-300 italic">
                              "{rev.reponseSalon}"
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: GALLERY */}
            {activeTab === 'gallery' && salon.photosGalerie && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {salon.photosGalerie.map((photo, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 dark:border-gray-800">
                    <img src={photo} alt={`Galerie ${salon.nom} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">
                Besoin d'un créneau ?
              </span>
              <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                Réservation sans frais d'avance
              </span>
            </div>

            <button
              onClick={() => handleStartBooking()}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Calendar size={14} />
              <span>Prendre RDV maintenant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Booking Modal */}
      {isBookingOpen && (
        <BeautyBookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          salon={salon}
          preselectedServiceId={selectedServiceIdForBooking}
        />
      )}
    </>
  );
}
