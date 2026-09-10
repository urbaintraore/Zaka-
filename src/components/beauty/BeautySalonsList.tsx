import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BeautySalon,
  BeautySalonType
} from '../../types';
import {
  BEAUTY_TYPE_LABELS
} from '../../lib/beautyService';
import { useBeautySalonsQuery } from '../../hooks/useBeautySalonsQuery';
import { BeautySalonDetailModal } from './BeautySalonDetailModal';
import { BeautyBookingModal } from './BeautyBookingModal';
import {
  Search,
  MapPin,
  Star,
  Calendar,
  Phone,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Store,
  Home,
  SlidersHorizontal,
  ChevronRight,
  Clock,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';

interface BeautySalonsListProps {
  onSelectSalon?: (salon: BeautySalon) => void;
  showHeroHeader?: boolean;
}

export function BeautySalonsList({ onSelectSalon, showHeroHeader = true }: BeautySalonsListProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('tous');
  const [selectedType, setSelectedType] = useState<BeautySalonType | 'tous'>('tous');
  const [filterSansRdv, setFilterSansRdv] = useState(false);
  const [filterADomicile, setFilterADomicile] = useState(false);
  const navigate = useNavigate();

  // Use React Query with local caching and offline fallback
  const {
    data: salons = [],
    isLoading: loading,
    isFetching,
    refetch,
    isPlaceholderData
  } = useBeautySalonsQuery({
    ville: selectedCity,
    type: selectedType,
    searchTerm,
    aDomicile: filterADomicile ? true : undefined,
    sansRdv: filterSansRdv ? true : undefined
  });

  // Selected modals
  const [activeDetailSalon, setActiveDetailSalon] = useState<BeautySalon | null>(null);
  const [activeBookingSalon, setActiveBookingSalon] = useState<BeautySalon | null>(null);
  const [bookingPreselectedServiceId, setBookingPreselectedServiceId] = useState<string | undefined>();

  const handleOpenDetail = (salon: BeautySalon) => {
    if (onSelectSalon) {
      onSelectSalon(salon);
    } else {
      navigate(`/beauty/${salon.id}`);
    }
  };

  const handleOpenBooking = (salon: BeautySalon, serviceId?: string) => {
    setBookingPreselectedServiceId(serviceId);
    setActiveBookingSalon(salon);
  };

  const cities = ['tous', 'Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'];

  const typeOptions: { key: BeautySalonType | 'tous'; label: string; icon: string }[] = [
    { key: 'tous', label: 'Tous les salons', icon: '✨' },
    { key: 'barber', label: 'Barber', icon: '💈' },
    { key: 'spa', label: 'Spa & Bien-être', icon: '🧖‍♀️' },
    { key: 'onglerie', label: 'Onglerie', icon: '💅' },
    { key: 'coiffure_femme', label: 'Coiffure Femmes', icon: '💇‍♀️' },
    { key: 'institut', label: 'Institut de Beauté', icon: '💆‍♀️' },
    { key: 'maquillage', label: 'Make-Up', icon: '💄' },
    { key: 'domicile', label: 'À Domicile', icon: '🏡' },
    { key: 'mixte', label: 'Salon Mixte', icon: '🌟' }
  ];

  const hasActiveFilters = searchTerm !== '' || selectedCity !== 'tous' || selectedType !== 'tous' || filterSansRdv || filterADomicile;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCity('tous');
    setSelectedType('tous');
    setFilterSansRdv(false);
    setFilterADomicile(false);
  };

  return (
    <div className="space-y-6">

      {/* Optional Hero Banner */}
      {showHeroHeader && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl shadow-rose-900/10">
          <div className="relative z-10 max-w-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full backdrop-blur-md">
                Module ZAKA Beauty
              </span>
              <span className="text-xs text-rose-100 font-bold flex items-center gap-1">
                <Sparkles size={13} /> Salons & Soins au Burkina Faso
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Prenez soin de vous en un clic
            </h1>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              Découvrez les meilleurs salons de coiffure, barbershops, ongleries, spas et instituts. Consultez les tarifs en FCFA et réservez votre créneau en ligne ou sur WhatsApp.
            </p>
          </div>

          {/* Decorative blur rings */}
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-40 h-40 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
        </div>
      )}

      {/* Search & Filters Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        {/* 1. BARRE DE RECHERCHE PRINCIPALE PAR NOM OU VILLE */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500"
              />
              <input
                id="beauty-salon-search-input"
                type="text"
                placeholder="Rechercher par nom de salon ou par ville (ex : Prestige, Ouagadougou, Bobo, Sya)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sélecteur de ville rapide */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none shrink-0">
              <span className="text-[11px] font-bold text-gray-400 hidden lg:inline mr-1 flex items-center gap-1">
                <MapPin size={13} className="text-rose-500" /> Ville :
              </span>
              {cities.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    selectedCity === c
                      ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <MapPin size={11} className={selectedCity === c ? 'text-white' : 'text-gray-400'} />
                  <span>{c === 'tous' ? 'Toutes les villes' : c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. PUCES DE FILTRAGE PAR CATÉGORIE (Barber, Spa, Onglerie, etc.) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-rose-500" /> Puces de filtrage par catégorie :
            </span>
            {selectedType !== 'tous' && (
              <button
                type="button"
                onClick={() => setSelectedType('tous')}
                className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Voir toutes les catégories
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {typeOptions.map(t => {
              const isSelected = selectedType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedType(t.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-500/20 scale-[1.02]'
                      : 'bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-white hover:bg-rose-50/50 dark:hover:bg-gray-800 border border-gray-200/80 dark:border-gray-700/60'
                  }`}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. FILTRES RAPIDES (Sans RDV & À Domicile) & RÉSUMÉ */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <SlidersHorizontal size={12} /> Options :
            </span>

            <button
              type="button"
              onClick={() => setFilterSansRdv(!filterSansRdv)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterSansRdv
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Store size={13} />
              <span>Accepte sans RDV</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterADomicile(!filterADomicile)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterADomicile
                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Home size={13} />
              <span>À domicile</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {salons.length} salon{salons.length > 1 ? 's' : ''} disponible{salons.length > 1 ? 's' : ''}
            </span>

            {/* Offline / Cache indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40" title="Données mises en cache localement avec React Query pour chargement instantané">
              <Database size={10} className="text-emerald-600" />
              <span>Cache local actif</span>
            </div>

            {/* Quick Refresh */}
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-colors cursor-pointer"
              title="Rafraîchir les salons"
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin text-rose-500' : ''} />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X size={12} />
                <span>Effacer les filtres</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Salons Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">
          Recherche des professionnels de beauté en cours...
        </div>
      ) : salons.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white">
            Aucun salon ne correspond à vos critères
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Essayez de modifier votre recherche, de choisir "Toutes les villes" ou de désactiver certains filtres.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCity('tous');
              setSelectedType('tous');
              setFilterSansRdv(false);
              setFilterADomicile(false);
            }}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {salons.map(salon => {
            const typeInfo = BEAUTY_TYPE_LABELS[salon.typeEtablissement] || { label: 'Beauté', icon: '✨' };
            const phoneClean = salon.telephone?.replace(/\s+/g, '');
            const whatsappClean = salon.whatsapp?.replace(/[^0-9]/g, '');

            return (
              <div
                key={salon.id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md hover:border-rose-200 dark:hover:border-rose-900/60 transition-all flex flex-col group"
              >
                {/* Cover & Badges */}
                <div
                  onClick={() => handleOpenDetail(salon)}
                  className="relative h-44 w-full bg-gray-100 dark:bg-gray-800 cursor-pointer overflow-hidden"
                >
                  <img
                    src={salon.photoCouverture || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200'}
                    alt={salon.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white px-2.5 py-1 rounded-xl shadow-xs backdrop-blur-md flex items-center gap-1">
                      <span>{typeInfo.icon}</span>
                      <span>{typeInfo.label}</span>
                    </span>

                    {salon.estVerifie && (
                      <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-xs">
                        <ShieldCheck size={11} /> Vérifié
                      </span>
                    )}
                  </div>

                  {/* Bottom info on cover */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-gray-800 shadow-md shrink-0 bg-white">
                        <img
                          src={salon.photoProfil || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600'}
                          alt={salon.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black truncate drop-shadow-sm">
                          {salon.nom}
                        </h3>
                        <p className="text-[10px] text-white/90 flex items-center gap-1 drop-shadow-sm">
                          <MapPin size={10} className="text-rose-400" />
                          <span className="truncate">{salon.quartier ? `${salon.quartier}, ` : ''}{salon.ville}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-black">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>{salon.noteMoyenne.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {salon.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {salon.description}
                    </p>
                  )}

                  {/* Feature Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {salon.accepteSansRdv && (
                      <span className="font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Store size={10} /> Sans RDV
                      </span>
                    )}
                    {salon.aDomicile && (
                      <span className="font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Home size={10} /> À domicile
                      </span>
                    )}
                  </div>

                  {/* Contact & CTA Buttons */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    {/* Quick Call */}
                    <a
                      href={`tel:${phoneClean}`}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                      title="Appeler le salon"
                    >
                      <Phone size={14} />
                    </a>

                    {/* Quick WhatsApp */}
                    {whatsappClean && (
                      <a
                        href={`https://wa.me/${whatsappClean}?text=${encodeURIComponent(`Bonjour ${salon.nom}, je souhaite des informations sur vos prestations via Zaka Beauty.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 transition-colors"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}

                    {/* Details button */}
                    <button
                      onClick={() => handleOpenDetail(salon)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Détails & Tarifs
                    </button>

                    {/* Book button */}
                    <button
                      onClick={() => handleOpenBooking(salon)}
                      className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <Calendar size={13} />
                      <span>Réserver</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {activeDetailSalon && (
        <BeautySalonDetailModal
          salon={activeDetailSalon}
          isOpen={!!activeDetailSalon}
          onClose={() => setActiveDetailSalon(null)}
          onOpenBookingModal={(s, srvId) => {
            setActiveDetailSalon(null);
            handleOpenBooking(s, srvId);
          }}
        />
      )}

      {/* Booking Modal */}
      {activeBookingSalon && (
        <BeautyBookingModal
          salon={activeBookingSalon}
          isOpen={!!activeBookingSalon}
          onClose={() => {
            setActiveBookingSalon(null);
            setBookingPreselectedServiceId(undefined);
          }}
          preselectedServiceId={bookingPreselectedServiceId}
        />
      )}
    </div>
  );
}
