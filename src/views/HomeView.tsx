import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Tab } from '../components/BottomNav';
import { MapPin, Tag, Flame, Sparkles, Star, MessageSquare, Calendar, Megaphone, X, Users, Heart, ChevronLeft, ChevronRight, Eye, Trophy, TrendingUp, Award, Clock, Share2, AlertCircle, BookOpen, Phone, SlidersHorizontal, Navigation, Compass, Loader2, Wine, Search, RefreshCw, Mic, MicOff, Coins, ArrowUpDown, History, Trash2 } from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { triggerHaptic } from '../utils/haptics';
import { stripHtml } from '../utils/htmlHelpers';
import { shareContent } from '../utils/platform';
import { ReservationModal } from '../components/ReservationModal';
import { Publication, Establishment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { EstablishmentDetailModal } from '../components/EstablishmentDetailModal';
import { StoriesSection } from '../components/StoriesSection';
import { AdPlacementBanner } from '../components/AdPlacementBanner';
import { ParticipationButtons } from '../components/ParticipationButtons';
import { EventAIAnalytics } from '../components/EventAIAnalytics';
import { ChallengePhoto } from '../components/ChallengePhoto';
import { EventSocialMur } from '../components/EventSocialMur';
import { MapView } from '../components/MapView';
import { ShareableVisual } from '../components/ShareableVisual';
import { UserGuideModal } from '../components/UserGuideModal';
import { CrowdStatusBadge } from '../components/CrowdStatusBadge';
import { AdExpressWizard } from '../components/AdExpressWizard';
import { ImageChargementProgressif } from '../components/ImageChargementProgressif';
import { Rocket, Zap } from 'lucide-react';
import { motion } from 'motion/react';

import { NEIGHBORHOOD_COORDS, getEstCoords, calculateDistanceKm, formatDistance } from '../utils/coordinates';

export function HomeViewSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-24 max-w-3xl mx-auto animate-pulse">
      {/* Hero Banner Skeleton */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-600 px-6 pt-10 pb-12 rounded-b-[2rem] shadow-lg text-white">
        <div className="h-8 w-48 bg-white/30 rounded-xl mb-3"></div>
        <div className="h-4 w-72 bg-white/20 rounded-lg mb-6"></div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-white/30 rounded-full"></div>
          <div className="h-9 w-36 bg-white/30 rounded-full"></div>
        </div>
      </div>

      <div className="px-4 space-y-8">
        {/* Stories Skeleton */}
        <div className="flex gap-3 overflow-hidden py-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="w-12 h-2.5 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          ))}
        </div>

        {/* Filter bar Skeleton */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-full flex-shrink-0"></div>
            ))}
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-7 w-24 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
            ))}
          </div>
        </div>

        {/* Establishment cards skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="h-36 bg-gray-200 dark:bg-gray-800 w-full"></div>
              <div className="p-4 flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                  <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EstablishmentCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse transition-all">
      {/* Photo banner skeleton with shimmer */}
      <div className="h-44 sm:h-52 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-850 dark:via-gray-800 dark:to-gray-850 relative p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 bg-white/70 dark:bg-gray-700/70 backdrop-blur-md rounded-full"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/70 dark:bg-gray-700/70 backdrop-blur-md"></div>
            <div className="w-8 h-8 rounded-full bg-white/70 dark:bg-gray-700/70 backdrop-blur-md"></div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-white/70 dark:bg-gray-700/70 backdrop-blur-md rounded-full"></div>
          <div className="h-6 w-16 bg-white/70 dark:bg-gray-700/70 backdrop-blur-md rounded-lg"></div>
        </div>
      </div>

      {/* Content body skeleton */}
      <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="h-5 w-44 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          <div className="h-3.5 w-60 bg-gray-100 dark:bg-gray-800/60 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
          <div className="h-8 w-20 bg-gray-100 dark:bg-gray-850 rounded-xl"></div>
          <div className="h-8 w-24 bg-gray-100 dark:bg-gray-850 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function EmergencyCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expiresAt) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expiré');
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (timeLeft === 'Expiré') {
    return (
      <span className="bg-gray-100 text-gray-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-gray-200">
        ⌛ Expiré
      </span>
    );
  }

  return (
    <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-200 flex items-center gap-1 animate-pulse">
      🚨 URGENT ({timeLeft})
    </span>
  );
}

interface HomeViewProps {
  onStartChat?: (estId: string) => void;
  onNavigate?: (tab: Tab) => void;
}

export function HomeView({ onStartChat, onNavigate }: HomeViewProps) {
  const { publications, establishments, entreprises, currentUser, createServiceRequest, relationshipRequests, setGlobalError, favorites, toggleFavorite, reviews, trackPublicationView, users, loading } = useAppStore();
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [sharingPub, setSharingPub] = useState<Publication | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [filterMemberOnly, setFilterMemberOnly] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [modeMaintenant, setModeMaintenant] = useState(false);
  const [activePubTab, setActivePubTab] = useState<'info' | 'photos' | 'wall'>('info');
  const [mapCategory, setMapCategory] = useState<string>('Tous');

  // Establishment Category, Search & Sorting State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price_asc' | 'price_desc' | 'proximity' | 'now'>('popular');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Search History via localStorage
  const { 
    history: searchHistory, 
    addSearchTerm, 
    removeSearchTerm, 
    clearHistory: clearSearchHistory 
  } = useSearchHistory();

  // Web Speech API Voice Search
  const {
    isListening: isVoiceListening,
    isSupported: isVoiceSupported,
    interimText: voiceInterimText,
    toggleListening: toggleVoiceSearch
  } = useVoiceSearch({
    onTranscript: (text) => {
      setSearchQuery(text);
    },
    onFinalTranscript: (text) => {
      setSearchQuery(text);
      addSearchTerm(text);
    }
  });

  const handleSelectProximity = () => {
    setSortBy('proximity');
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLocating(false);
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: {
              message: "📍 Position GPS détectée ! Établissements classés par proximité.",
              type: "info"
            }
          }));
        },
        (err) => {
          console.warn("Géolocalisation refusée ou non disponible, fallback Ouagadougou", err);
          setUserCoords({ lat: 12.3686, lng: -1.5275 });
          setIsLocating(false);
          window.dispatchEvent(new CustomEvent('app-toast', {
            detail: {
              message: "📍 Position approximative (centre de Ouagadougou) appliquée.",
              type: "warning"
            }
          }));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setUserCoords({ lat: 12.3686, lng: -1.5275 });
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          message: "Géolocalisation non prise en charge. Tri centré sur Ouagadougou.",
          type: "warning"
        }
      }));
    }
  };

  useEffect(() => {
    setActivePubTab('info');
  }, [selectedPub]);

  useEffect(() => {
    if (selectedPub) {
      trackPublicationView(selectedPub.id);
    }
  }, [selectedPub, trackPublicationView]);

  // Rankings state
  const [rankings, setRankings] = useState<{
    mostViewed: { establishmentId: string; count: number }[];
    bestRated: { establishmentId: string; rating: number; reviewsCount: number }[];
    popularEvents: { publicationId: string; count: number }[];
    updatedAt: string | null;
  } | null>(null);
  const [isRankingsLoading, setIsRankingsLoading] = useState(true);
  const [activeRankTab, setActiveRankTab] = useState<'views' | 'rating' | 'events'>('views');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedRankEst, setSelectedRankEst] = useState<Establishment | null>(null);
  const [recalcTrigger, setRecalcTrigger] = useState(0);

  // Community Favorites State (Coups de cœur de la communauté)
  const [popularEstsByFavorites, setPopularEstsByFavorites] = useState<{ id: string; favoritesCount: number }[]>([]);
  const [isPopularLoading, setIsPopularLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchFavoritesAndCalculatePopularity = async () => {
      try {
        setIsPopularLoading(true);
        let counts: Record<string, number> = {};
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from('favorites').select('establishmentIds');
          if (!error && data) {
            data.forEach(row => {
              const estIds = row.establishmentIds || [];
              estIds.forEach((id: string) => {
                counts[id] = (counts[id] || 0) + 1;
              });
            });
          }
        }
        if (Object.keys(counts).length === 0) {
          // Fallback: use establishments list sorted by averageRating (simulating counts using rating)
          const fallback = establishments
            .filter(e => e.status === 'valide')
            .map(e => ({ id: e.id, favoritesCount: Math.round(e.averageRating * 3) }))
            .sort((a, b) => b.favoritesCount - a.favoritesCount);
          if (active) {
            setPopularEstsByFavorites(fallback);
          }
        } else {
          const estsWithCounts = Object.entries(counts)
            .map(([id, count]) => ({ id, favoritesCount: count }))
            .sort((a, b) => b.favoritesCount - a.favoritesCount);
          if (active) {
            setPopularEstsByFavorites(estsWithCounts);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des favoris pour les Coups de cœur:", err);
        const fallback = establishments
          .filter(e => e.status === 'valide')
          .map(e => ({ id: e.id, favoritesCount: Math.round(e.averageRating * 3) }))
          .sort((a, b) => b.favoritesCount - a.favoritesCount);
        if (active) {
          setPopularEstsByFavorites(fallback);
        }
      } finally {
        if (active) {
          setIsPopularLoading(false);
        }
      }
    };

    fetchFavoritesAndCalculatePopularity();

    return () => {
      active = false;
    };
  }, [establishments, reviews]);

  // ZAKA Ads Express State
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressTargetPub, setExpressTargetPub] = useState<Publication | null>(null);
  const [expressTargetEst, setExpressTargetEst] = useState<Establishment | null>(null);

  // Rankings loading & daily recalculation
  useEffect(() => {
    let active = true;
    const fetchRankings = async () => {
      try {
        setIsRankingsLoading(true);
        let cachedData = null;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.from('rankings').select('*').eq('id', 'cache').maybeSingle();
          if (!error && data) {
            cachedData = data;
          }
        }
        
        if (cachedData) {
          if (active) {
            setRankings({
              mostViewed: cachedData.mostViewed || [],
              bestRated: cachedData.bestRated || [],
              popularEvents: cachedData.popularEvents || [],
              updatedAt: cachedData.updatedAt || null,
            });
            setIsRankingsLoading(false);
          }
        }
        
        // Always run the fresh real-time recalculation in the background
        await runRecalculate();
      } catch (err: any) {
        await runRecalculate();
      } finally {
        if (active) setIsRankingsLoading(false);
      }
    };

    const runRecalculate = async () => {
      if (isRecalculating) return;
      setIsRecalculating(true);
      try {
        const nowStr = new Date().toISOString();
        const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = sevenDaysAgoDate.toISOString();
        
        let rawEstViews: any[] = [];
        let rawPubViews: any[] = [];
        let rawParticipations: any[] = [];

        if (isSupabaseConfigured) {
          try {
            const { data: estViews } = await supabase.from('establishment_views').select('*').gte('timestamp', sevenDaysAgo);
            rawEstViews = estViews || [];
            const { data: pubViews } = await supabase.from('publication_views').select('*').gte('timestamp', sevenDaysAgo);
            rawPubViews = pubViews || [];
            const { data: participationsData } = await supabase.from('event_participations').select('*').gte('timestamp', sevenDaysAgo);
            rawParticipations = participationsData || [];
          } catch (e) {
            console.error("Error querying stats from Supabase:", e);
          }
        }

        // --- CALCULATE ESTABLISHMENT VIEWS RANKING (Top des plus vus) ---
        const viewCounts: Record<string, number> = {};
        rawEstViews.forEach(v => {
          const estId = v.establishmentId;
          const est = establishments.find(e => e.id === estId);
          if (!est) return;
          
          // Exclure les vues du propriétaire de l'établissement
          if (v.userId && v.userId === est.ownerId) {
            return;
          }
          // Exclure les vues des utilisateurs ayant le rôle de gérant ou d'administrateur
          if (v.userId) {
            const viewerUser = users?.find(u => u.id === v.userId);
            if (viewerUser && (viewerUser.role === 'gerant' || viewerUser.role === 'admin')) {
              return;
            }
          }
          viewCounts[estId] = (viewCounts[estId] || 0) + 1;
        });

        const mostViewed = Object.entries(viewCounts)
          .map(([establishmentId, count]) => ({ establishmentId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // --- CALCULATE BEST RATED RANKING (Les mieux notés - 7 jours glissants, min 3 avis) ---
        const bestRatedList = establishments
          .map(est => {
            // Filtrer les avis de l'établissement laissés au cours des 7 derniers jours uniquement
            const estReviews = reviews.filter(r => {
              if (r.establishmentId !== est.id) return false;
              const rDate = new Date(r.date || (r as any).createdAt || 0);
              return rDate >= sevenDaysAgoDate;
            });
            
            // Appliquer le seuil minimal de 3 avis récents requis
            if (estReviews.length < 3) return null;
            
            const average = estReviews.reduce((sum, r) => sum + r.rating, 0) / estReviews.length;
            return {
              establishmentId: est.id,
              rating: average,
              reviewsCount: estReviews.length
            };
          })
          .filter((item): item is { establishmentId: string; rating: number; reviewsCount: number } => item !== null)
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return b.reviewsCount - a.reviewsCount; // Tri secondaire par volume d'avis récents
          })
          .slice(0, 10);

        // --- CALCULATE POPULAR EVENTS RANKING (Événements populaires - 7 jours glissants) ---
        const todayStr = new Date().toISOString().split('T')[0];
        const activeEvents = publications.filter(pub => {
          if (pub.type !== 'evenement') return false;
          const dateCheck = pub.endDate || pub.startDate;
          if (!dateCheck) return true;
          return dateCheck.split('T')[0] >= todayStr;
        });

        const eventPopularityCounts: Record<string, number> = {};
        
        // 1. Ajouter les vues de publication de l'événement des 7 derniers jours (en excluant gérants/propriétaires)
        rawPubViews.forEach(v => {
          const pubId = v.publicationId;
          const pub = activeEvents.find(p => p.id === pubId);
          if (!pub) return;
          
          const est = establishments.find(e => e.id === pub.establishmentId);
          if (est && v.userId) {
            if (v.userId === est.ownerId) return;
            const viewerUser = users?.find(u => u.id === v.userId);
            if (viewerUser && (viewerUser.role === 'gerant' || viewerUser.role === 'admin')) return;
          }
          eventPopularityCounts[pubId] = (eventPopularityCounts[pubId] || 0) + 1;
        });

        // 2. Ajouter les participations aux événements des 7 derniers jours (poids de 5 pour leur impact d'enjaillement)
        rawParticipations.forEach(p => {
          const pubId = p.eventId;
          const pub = activeEvents.find(e => e.id === pubId);
          if (!pub) return;
          eventPopularityCounts[pubId] = (eventPopularityCounts[pubId] || 0) + 5;
        });

        const popularEvents = activeEvents
          .map(pub => ({
            publicationId: pub.id,
            count: eventPopularityCounts[pub.id] || 0
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const newRankings = {
          mostViewed,
          bestRated: bestRatedList,
          popularEvents,
          updatedAt: nowStr
        };

        if (isSupabaseConfigured) {
          try {
            await supabase.from('rankings').upsert({ id: 'cache', ...newRankings });
          } catch {
            // Silent when offline or local cache
          }
        }
        
        if (active) {
          setRankings(newRankings);
        }
      } catch (err: any) {
        if (err?.code !== 'unavailable' && !err?.message?.includes('offline')) {
          console.warn("Réévaluation locale des classements terminée.");
        }
      } finally {
        if (active) {
          setIsRecalculating(false);
        }
      }
    };

    fetchRankings();

    return () => {
      active = false;
    };
  }, [establishments, publications, reviews, recalcTrigger, users]);

  // Calendar state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Pre-select today's date format (YYYY-MM-DD)
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayStr());

  const handleReservationSubmit = (data: { reservationType: string, date: string, time: string, guests: number, details: string }) => {
    if (!currentUser || !reservationEst) return;
    const isAnniv = data.reservationType === 'anniversaire';
    createServiceRequest({
      clientId: currentUser.id,
      establishmentId: reservationEst.id,
      type: isAnniv ? 'anniversaire' : 'reservation',
      details: `Date: ${data.date} à ${data.time} | Places: ${data.guests} | Type: ${data.reservationType}${data.details ? ` | Note: ${data.details}` : ''}`
    });
  };

  const getEst = (id: string) => establishments.find(e => e.id === id);

  const getPublisher = (id: string) => {
    const est = establishments.find(e => e.id === id);
    if (est) {
      return {
        name: est.name,
        neighborhood: est.neighborhood,
        isEntreprise: false,
        type: est.category,
        image: est.photos?.[0]
      };
    }
    const ent = entreprises.find(e => e.id === id);
    if (ent) {
      return {
        name: ent.name,
        neighborhood: ent.sector,
        isEntreprise: true,
        type: 'entreprise',
        image: ent.logo
      };
    }
    return {
      name: 'Partenaire',
      neighborhood: 'Zaka+',
      isEntreprise: true,
      type: 'entreprise',
      image: ''
    };
  };

  // Get recent 5-star reviews on popular establishments (based on favorites count calculated via Firestore query)
  const topPopularEstIds = new Set(popularEstsByFavorites.slice(0, 10).map(e => e.id));

  const communityFavoritesReviews = reviews
    .filter(r => r.rating === 5 && (topPopularEstIds.size > 0 ? topPopularEstIds.has(r.establishmentId) : true))
    .sort((a, b) => {
      const dateA = new Date((a as any).createdAt || a.date || 0).getTime();
      const dateB = new Date((b as any).createdAt || b.date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Helper to check if a date is older than X days
  const isOlderThanDays = (dateStr: string, days: number) => {
    const date = new Date(dateStr);
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > days;
  };

  // Helper to check if a publication is considered "New" (< 48 hours)
  const isNewPublication = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48;
  };

  // Helper to check if an event is happening today
  const isEventSoonOrToday = (startDateStr?: string) => {
    if (!startDateStr) return false;
    const start = startDateStr.split('T')[0];
    return start === todayStr;
  };

  // Filter based on member status if active
  const joinedEstIds = currentUser
    ? relationshipRequests
        .filter(r => (r.initiatorId === currentUser.id || r.targetId === currentUser.id) && r.status === 'acceptee')
        .map(r => r.establishmentId)
    : [];

  const basePublications = filterMemberOnly
    ? publications.filter(p => joinedEstIds.includes(p.establishmentId))
    : publications;

  // Process each publication to calculate status, freshness and soon indicators
  const processedPublications = basePublications.map(pub => {
    const isNew = isNewPublication(pub.createdAt);
    let isExpired = pub.status === 'expiree';
    
    // Check emergency promo real-time expiration
    if (pub.isEmergency && pub.expiresAt) {
      if (new Date() > new Date(pub.expiresAt)) {
        isExpired = true;
      }
    }
    
    // Check specific expiration rules
    if (!isExpired) {
      if (pub.type === 'evenement') {
        const dateCheck = pub.endDate || pub.startDate || '';
        if (dateCheck && dateCheck.split('T')[0] < todayStr) {
          isExpired = true;
        }
      } else {
        // Promos and announcements
        if (pub.endDate && pub.endDate.split('T')[0] < todayStr) {
          isExpired = true;
        } else if (!pub.endDate && pub.createdAt && isOlderThanDays(pub.createdAt, 15)) {
          // Automatically expire after 15 days if no end date specified to keep the homepage fresh
          isExpired = true;
        }
      }
    }

    return {
      ...pub,
      isNew,
      isExpired,
      isSoon: pub.type === 'evenement' ? isEventSoonOrToday(pub.startDate) : false
    };
  });

  // Filter based on user preference (show/hide expired)
  const activePublications = showExpired 
    ? processedPublications 
    : processedPublications.filter(p => !p.isExpired);

  // Sort: Boosted first, then descending order of creation (freshness)
  const sortedPublications = [...activePublications].sort((a, b) => {
    if (a.status === 'boostee' && b.status !== 'boostee') return -1;
    if (a.status !== 'boostee' && b.status === 'boostee') return 1;
    
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  type ProcessedPub = Publication & { isNew: boolean; isExpired: boolean; isSoon: boolean };

  // Group by type for rendering
  const events = sortedPublications.filter(p => p.type === 'evenement') as ProcessedPub[];
  const promos = sortedPublications.filter(p => p.type === 'promo' || p.type === 'bon_plan') as ProcessedPub[];
  const annonces = sortedPublications.filter(p => p.type === 'annonce') as ProcessedPub[];
  
  const getCrowdWeight = (e: Establishment) => {
    if (!e.crowdStatus || !e.crowdStatusUpdatedAt) return 0;
    const diffMins = (Date.now() - new Date(e.crowdStatusUpdatedAt).getTime()) / (1000 * 60);
    if (diffMins > 240) return 0; // Expired
    if (e.crowdStatus === 'anime') return 100;
    if (e.crowdStatus === 'complet') return 80;
    if (e.crowdStatus === 'calme') return 50;
    return 10;
  };

  // Helper to identify fictional, test, or placeholder establishments
  const isFictionalEstablishment = (e: Establishment): boolean => {
    const name = (e.name || '').toLowerCase();
    const id = (e.id || '').toLowerCase();
    const desc = (e.description || '').toLowerCase();
    return (
      Boolean((e as any).isFictif) ||
      Boolean((e as any).isDummy) ||
      name.includes('fictif') ||
      name.includes('fictive') ||
      name.includes('dummy') ||
      name.includes('mock') ||
      name.includes('test') ||
      name.includes('exemple') ||
      name.includes('démo') ||
      name.includes('demo') ||
      id.startsWith('dummy') ||
      id.startsWith('test_') ||
      id.startsWith('mock_') ||
      desc.includes('établissement fictif') ||
      desc.includes('etablissement fictif')
    );
  };

  // Base list of real establishments (including user-created and validated ones, excluding pure test placeholders)
  const validEstablishments = establishments
    .filter(e => e.status === 'valide' || e.status === 'en_attente' || (currentUser && e.ownerId === currentUser.id) || Boolean(e.ownerId))
    .filter(e => !isFictionalEstablishment(e));

  // Filter by selected category (Maquis, Restaurant, Bar, Boîte de nuit / Club, etc.)
  const categoryFilteredEstablishments = validEstablishments.filter(e => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'maquis') {
      return e.category === 'maquis';
    }
    if (selectedCategory === 'restaurant') {
      return e.category === 'restaurant' || e.category === 'restaurants' || e.category === 'glacier_pizzeria';
    }
    if (selectedCategory === 'bar') {
      return e.category === 'bar';
    }
    if (selectedCategory === 'boite_de_nuit' || selectedCategory === 'club') {
      return e.category === 'boite_de_nuit' || (e.category as string) === 'club';
    }
    return e.category === selectedCategory;
  });

  // Calculate distance map if userCoords available or fallback to Ouagadougou center
  const establishmentDistances: Record<string, number> = {};
  const activeUserCoords = userCoords || (sortBy === 'proximity' ? { lat: 12.3686, lng: -1.5275 } : null);
  if (activeUserCoords) {
    validEstablishments.forEach(est => {
      const coords = getEstCoords(est);
      if (coords) {
        establishmentDistances[est.id] = calculateDistanceKm(activeUserCoords.lat, activeUserCoords.lng, coords.lat, coords.lng);
      }
    });
  }

  // Helper to compute average price for sorting and displaying
  const getEstablishmentAvgPrice = (est: Establishment): number => {
    if (est.averagePrice && est.averagePrice > 0) return est.averagePrice;
    const anyEst = est as any;
    if (Array.isArray(anyEst.products) && anyEst.products.length > 0) {
      const validPrices = anyEst.products.map((p: any) => p.price).filter((p: any) => typeof p === 'number' && p > 0);
      if (validPrices.length > 0) {
        return Math.round(validPrices.reduce((a: number, b: number) => a + b, 0) / validPrices.length);
      }
    }
    if (est.priceLevel) {
      const levelMap: Record<number, number> = { 1: 2500, 2: 5000, 3: 10000, 4: 20000 };
      return levelMap[est.priceLevel] || 3500;
    }
    if (est.category === 'boite_de_nuit') return 8000;
    if (est.category === 'restaurants') return 5000;
    if (est.category === 'bar') return 3500;
    if (est.category === 'hotel') return 15000;
    if (est.category === 'residence') return 12000;
    if (est.category === 'glacier_pizzeria') return 3000;
    if (est.category === 'maquis') return 2500;
    return 3500;
  };

  // Sort establishments based on user choice: popular, rating, price_asc, price_desc, proximity, now
  const sortedEstablishments = [...categoryFilteredEstablishments].sort((a, b) => {
    if (sortBy === 'now' || modeMaintenant) {
      const weightA = getCrowdWeight(a);
      const weightB = getCrowdWeight(b);
      if (weightB !== weightA) return weightB - weightA;
    }
    if (sortBy === 'proximity') {
      const distA = establishmentDistances[a.id] ?? 9999;
      const distB = establishmentDistances[b.id] ?? 9999;
      if (distA !== distB) return distA - distB;
    }
    if (sortBy === 'rating') {
      return b.averageRating - a.averageRating;
    }
    if (sortBy === 'price_asc') {
      return getEstablishmentAvgPrice(a) - getEstablishmentAvgPrice(b);
    }
    if (sortBy === 'price_desc') {
      return getEstablishmentAvgPrice(b) - getEstablishmentAvgPrice(a);
    }
    // Default 'popular': ranking by favorites count or average rating
    const favA = popularEstsByFavorites.find(p => p.id === a.id)?.favoritesCount || 0;
    const favB = popularEstsByFavorites.find(p => p.id === b.id)?.favoritesCount || 0;
    if (favB !== favA) return favB - favA;
    return b.averageRating - a.averageRating;
  });

  const topEstablishments = sortedEstablishments;

  const filteredEstablishments = topEstablishments.filter(e => {
    if (filterMemberOnly && !joinedEstIds.includes(e.id)) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (e.name || '').toLowerCase().includes(q);
      const descMatch = (e.description || '').toLowerCase().includes(q);
      const neighborhoodMatch = (e.neighborhood || e.quarter || '').toLowerCase().includes(q);
      const cityMatch = (e.city || '').toLowerCase().includes(q);
      
      // Type matching for maquis, restaurant, bar, club / boite de nuit
      const isMaquisQuery = q.includes('maquis');
      const isRestoQuery = q.includes('resto') || q.includes('restaurant') || q.includes('pizz') || q.includes('manger');
      const isBarQuery = q === 'bar' || q.includes('bar ') || q.startsWith('bar') || q.includes('lounge') || q.includes('pub');
      const isClubQuery = q.includes('club') || q.includes('boite') || q.includes('boîte') || q.includes('discotheque') || q.includes('discothèque') || q.includes('night');

      const categoryMatch = 
        (e.category || '').toLowerCase().replace(/_/g, ' ').includes(q) ||
        (isMaquisQuery && e.category === 'maquis') ||
        (isRestoQuery && (e.category === 'restaurant' || e.category === 'restaurants' || e.category === 'glacier_pizzeria')) ||
        (isBarQuery && e.category === 'bar') ||
        (isClubQuery && (e.category === 'boite_de_nuit' || (e.category as string) === 'club'));

      const tagMatch = (e.tags || []).some(t => t.toLowerCase().includes(q));

      if (!nameMatch && !descMatch && !neighborhoodMatch && !cityMatch && !categoryMatch && !tagMatch) {
        return false;
      }
    }
    return true;
  });

  const closestEstId = (sortBy === 'proximity' && filteredEstablishments.length > 0)
    ? filteredEstablishments[0].id
    : null;

  // Calendar helpers
  const MONTHS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // getDay() is 0 for Sunday, 1 for Monday, etc. Adjust to make Monday 0 and Sunday 6
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentMonth);

  const calendarDays: (number | null)[] = [];
  // Offset empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Days slots
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const formatDateKey = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return today.getDate() === day &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getFullYear() === currentMonth.getFullYear();
  };

  // Check if a date has events
  const getEventsForDate = (dateStr: string) => {
    return events.filter(e => {
      if (!e.startDate) return false;
      const start = e.startDate.split('T')[0];
      const end = e.endDate ? e.endDate.split('T')[0] : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Navigate calendar months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get active events based on calendar date filter if in calendar mode
  const displayedEvents = viewMode === 'calendar' && selectedDate
    ? getEventsForDate(selectedDate)
    : events;

  if (loading && establishments.length === 0) {
    return <HomeViewSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 pb-24 max-w-3xl mx-auto">
      {/* Hero Banner Conviviale */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 px-6 pt-10 pb-12 rounded-b-[2rem] shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black mb-3 leading-tight">
            Où s'enjailler <br/>
            <span className="text-orange-200">aujourd'hui ?</span>
          </h2>
          <p className="text-orange-100 mb-6 font-medium text-sm pr-8">
            Découvrez les meilleurs maquis, bars et restaurants près de chez vous.
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button 
              onClick={() => {
                handleSelectProximity();
                const target = document.getElementById('establishments-section');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-5 py-2.5 rounded-full font-extrabold active:scale-95 transition-all text-xs flex items-center gap-2 shadow-md cursor-pointer ${
                sortBy === 'proximity'
                  ? 'bg-emerald-500 text-white ring-2 ring-white/80 shadow-lg'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
              }`}
              title="Trier les établissements par proximité avec ma position GPS"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
              ) : (
                <Compass className="w-4 h-4 text-emerald-300" />
              )}
              <span>Autour de moi</span>
              {sortBy === 'proximity' && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
            </button>
            <button 
              onClick={() => onNavigate?.('explore')}
              className="bg-white text-orange-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4" /> Explorer la carte
            </button>
            <button 
              onClick={() => setShowGuideModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-gray-950 px-5 py-2.5 rounded-full font-extrabold shadow-md active:scale-95 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gray-900" /> Guide d'Utilisation
            </button>
            <button 
              onClick={() => setModeMaintenant(!modeMaintenant)}
              className={`px-5 py-2.5 rounded-full font-extrabold active:scale-95 transition-all text-xs flex items-center gap-2 shadow-md cursor-pointer ${
                modeMaintenant 
                  ? 'bg-amber-300 text-gray-950 ring-2 ring-amber-200 animate-pulse' 
                  : 'bg-black/30 hover:bg-black/40 text-white border border-white/30'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" /> 
              {modeMaintenant ? "⚡ Mode Maintenant Actif !" : "⚡ Mode Maintenant"}
            </button>
          </div>
        </div>

        {/* Barre de Recherche Rapide (Quick Search Bar) */}
        <div className="relative z-20 mt-5 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md rounded-3xl p-3 shadow-xl border border-white/40 dark:border-gray-800 text-gray-900 dark:text-white">
          <div className="relative flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-orange-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  addSearchTerm(searchQuery);
                  (e.target as HTMLElement).blur();
                  setIsSearchFocused(false);
                }
              }}
              placeholder="Rechercher par nom ou par type (maquis, restaurant, bar, club)..."
              className="w-full pl-11 pr-20 py-3 bg-gray-50 dark:bg-gray-900 rounded-2xl text-xs sm:text-sm font-medium border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded-lg"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isVoiceListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-400'
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800'
                }`}
                title={
                  !isVoiceSupported
                    ? "Recherche vocale non supportée sur ce navigateur"
                    : isVoiceListening
                    ? "Arrêter l'écoute vocale"
                    : "Rechercher par commande vocale"
                }
                aria-label="Recherche vocale"
              >
                {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Menu déroulant d'historique des recherches */}
          {isSearchFocused && searchHistory.length > 0 && !searchQuery && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-3 z-50 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-1 pb-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-orange-500" />
                  Dernières recherches
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    clearSearchHistory();
                  }}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer tout
                </button>
              </div>

              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                {searchHistory.map((term) => (
                  <div
                    key={term}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-orange-50 dark:hover:bg-gray-800/80 group transition-colors cursor-pointer"
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchQuery(term);
                        addSearchTerm(term);
                        setIsSearchFocused(false);
                        triggerHaptic('light');
                      }}
                      className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 flex-1 text-left"
                    >
                      <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 shrink-0" />
                      <span className="truncate">{term}</span>
                    </button>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeSearchTerm(term);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                      title="Supprimer cette recherche"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isVoiceListening && (
            <div className="flex items-center justify-between gap-2 mt-2 px-3 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="truncate">
                  {voiceInterimText ? `🎙️ « ${voiceInterimText} »` : "🎙️ Écoute vocale active... Dites par ex. Maquis, Resto, Bar"}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                Arrêter
              </button>
            </div>
          )}

          {/* Filtres Rapides par Type : Tous, Maquis, Restaurant, Bar, Club + Autour de moi */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-2.5 pb-0.5">
            <button
              type="button"
              onClick={() => {
                handleSelectProximity();
                const target = document.getElementById('establishments-section');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                sortBy === 'proximity'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
              title="Trouver les établissements les plus proches de moi"
            >
              {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              <span>Autour de moi</span>
            </button>
            {[
              { id: 'all', label: 'Tous', icon: '🌟' },
              { id: 'maquis', label: 'Maquis', icon: '🔥' },
              { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
              { id: 'bar', label: 'Bar', icon: '🍹' },
              { id: 'boite_de_nuit', label: 'Club', icon: '🪩' },
            ].map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id === 'all') setMapCategory('Tous');
                    else if (cat.id === 'maquis') setMapCategory('Maquis');
                    else if (cat.id === 'restaurant') setMapCategory('Restaurant');
                    else if (cat.id === 'bar') setMapCategory('Bar');
                    else if (cat.id === 'boite_de_nuit') setMapCategory('Discothèque');
                  }}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-850 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xs">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {/* Compteur de résultats & Saut vers la liste */}
            <button
              type="button"
              onClick={() => {
                const target = document.getElementById('establishments-section');
                target?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="ml-auto shrink-0 text-[11px] font-extrabold text-orange-700 dark:text-orange-300 bg-orange-100/80 dark:bg-orange-950/60 hover:bg-orange-200 dark:hover:bg-orange-900/60 px-3 py-1.5 rounded-full border border-orange-200/80 dark:border-orange-900/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Voir les résultats"
            >
              <span>{filteredEstablishments.length} lieu{filteredEstablishments.length > 1 ? 'x' : ''}</span>
              <span className="text-orange-600 dark:text-orange-400 font-black">↓</span>
            </button>
          </div>

          {/* Puces de recherches récentes rapides */}
          {searchHistory.length > 0 && !searchQuery && (
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-2 border-t border-gray-100/80 dark:border-gray-800/80 mt-1">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3 text-orange-500" />
                Récents :
              </span>
              {searchHistory.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item);
                    addSearchTerm(item);
                    triggerHaptic('light');
                  }}
                  className="shrink-0 px-2.5 py-1 bg-gray-100 hover:bg-orange-50 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-orange-600 rounded-lg text-xs font-medium border border-gray-200/60 dark:border-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{item}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearSearchHistory}
                className="text-[10px] text-gray-400 hover:text-red-500 font-bold shrink-0 ml-1 px-1 transition-colors cursor-pointer"
                title="Vider l'historique de recherche"
              >
                Effacer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ad Placement Banner on Home Header */}
      <div className="px-4">
        <AdPlacementBanner placement="home_banner" />
      </div>

      {/* Map Interactive */}
      <div className="px-4">
        <MapView 
          establishments={validEstablishments} 
          onEstClick={(id) => {
            const est = validEstablishments.find(e => e.id === id);
            if (est) setSelectedRankEst(est);
          }}
          selectedCategory={mapCategory}
        />
      </div>

      {/* Ephemeral Stories (Style Instagram) */}
      <StoriesSection onStartChat={onStartChat} />

      {/* Bannière d'accès direct au Guide d'Utilisation */}
      <div className="px-4">
        <div 
          onClick={() => setShowGuideModal(true)}
          className="bg-gradient-to-r from-slate-900 via-orange-950 to-orange-900 text-white rounded-2xl p-4 shadow-md border border-orange-500/30 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0 group-hover:rotate-6 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-orange-400">Guide Complet Zaka+</span>
                <span className="bg-orange-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">Mise à jour</span>
              </div>
              <h4 className="text-sm font-bold text-white leading-snug">Découvrez le Guide d'Utilisation & Nouveautés 📖</h4>
              <p className="text-[11px] text-gray-300">Gérants, Clients, Annonceurs, Entreprises : Affluence, Points, Sorties de groupe...</p>
            </div>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0 transition-colors shadow-sm">
            Ouvrir
          </button>
        </div>
      </div>

      {/* Dynamic Widget: Coups de cœur de la communauté */}
      {communityFavoritesReviews.length > 0 && (
        <div className="px-4" id="community-favorites-widget">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Coups de cœur de la communauté 💖</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Derniers avis 5★ sur les adresses les plus populaires</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3.5 px-0.5">
            {communityFavoritesReviews.map(review => {
              const est = getEst(review.establishmentId);
              if (!est) return null;
              
              // Resolve reviewer name and avatar from users list
              const reviewerUser = users?.find(u => u.id === review.clientId);
              const reviewerName = reviewerUser?.name || 'Initié Club';
              const reviewerAvatar = reviewerUser?.avatar || '';

              // Find the favorites count for this establishment
              const favData = popularEstsByFavorites.find(p => p.id === review.establishmentId);
              const favCount = favData ? favData.favoritesCount : 0;
              
              return (
                <motion.div
                  key={review.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => setSelectedRankEst(est)}
                  className="min-w-[300px] max-w-[320px] bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                >
                  {/* Subtle decorative background gradient */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-bl-full pointer-events-none"></div>

                  <div className="space-y-3">
                    {/* Header: User & Stars */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-[1.5px] flex-shrink-0">
                          {reviewerAvatar ? (
                            <img src={reviewerAvatar} alt={reviewerName} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-white dark:bg-gray-950 rounded-full flex items-center justify-center font-black text-orange-600 dark:text-orange-400 text-xs">
                              {reviewerName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors">
                            {reviewerName}
                          </div>
                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            {new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-950/40 px-2 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-[10px] font-black text-yellow-700 dark:text-yellow-400">5.0</span>
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed italic line-clamp-3 pl-1 relative">
                      “ {review.comment} ”
                    </p>
                  </div>

                  {/* Footer: Establishment & Popularity Badge */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-900 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {est.name}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
                        📍 {est.neighborhood || 'Burkina'}
                      </div>
                    </div>
                    {favCount > 0 && (
                      <span className="shrink-0 text-[8px] font-black uppercase bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/30 flex items-center gap-0.5">
                        <Heart className="w-2 h-2 fill-current text-orange-600 dark:text-orange-400" />
                        <span>{favCount} favori{favCount > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-8">
        {/* SECTION PALMARÈS ET CLASSEMENTS DYNAMIQUES */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Le Palmarès de la Semaine</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Calculs dynamiques en temps réel sur un intervalle glissant de 7 jours
              </p>
            </div>
            {rankings?.updatedAt && (
              <span className="text-[10px] self-start sm:self-center font-bold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40">
                ⚡ Mis à jour en direct
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Widget 1: Top des plus vus */}
            <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
                    <Eye className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Top des plus vus</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Exclut les vues des gérants/propriétaires</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-100 dark:border-orange-900/20">
                  7j glissants
                </span>
              </div>

              {isRankingsLoading ? (
                <div className="py-6 text-center text-xs text-gray-400 animate-pulse">Chargement des visites...</div>
              ) : (!rankings?.mostViewed || rankings.mostViewed.length === 0) ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  Aucune visite récente de gérants non-propriétaires enregistrée.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {rankings.mostViewed.slice(0, 5).map((item, index) => {
                    const est = getEst(item.establishmentId);
                    if (!est) return null;
                    const imageUrl = est.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400';
                    return (
                      <div
                        key={est.id}
                        onClick={() => setSelectedRankEst(est)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-orange-50/10 transition-all cursor-pointer group"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                        }`}>
                          {index === 0 ? '👑' : index + 1}
                        </div>
                        <img src={imageUrl} alt={est.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 bg-gray-100" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm group-hover:text-orange-600 transition-colors truncate">{est.name}</h4>
                          <p className="text-[10px] text-gray-500 capitalize truncate mt-0.5">
                            {est.category.replace(/_/g, ' ')} • {est.neighborhood}
                          </p>
                        </div>
                        <span className="text-[11px] font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-lg flex-shrink-0">
                          {item.count} vue{item.count > 1 ? 's' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget 2: Les mieux notés */}
            <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-950/30 flex items-center justify-center text-yellow-600">
                    <Trophy className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Les mieux notés</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Minimum de 3 avis récents requis</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/20">
                  7j glissants
                </span>
              </div>

              {isRankingsLoading ? (
                <div className="py-6 text-center text-xs text-gray-400 animate-pulse">Chargement des avis récents...</div>
              ) : (!rankings?.bestRated || rankings.bestRated.length === 0) ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  Aucun établissement n'a reçu 3 avis au cours des 7 derniers jours.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {rankings.bestRated.slice(0, 5).map((item, index) => {
                    const est = getEst(item.establishmentId);
                    if (!est) return null;
                    const imageUrl = est.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400';
                    return (
                      <div
                        key={est.id}
                        onClick={() => setSelectedRankEst(est)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-orange-50/10 transition-all cursor-pointer group"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                        }`}>
                          {index === 0 ? '👑' : index + 1}
                        </div>
                        <img src={imageUrl} alt={est.name} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 bg-gray-100" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm group-hover:text-orange-600 transition-colors truncate">{est.name}</h4>
                          <p className="text-[10px] text-gray-500 capitalize truncate mt-0.5">
                            {est.category.replace(/_/g, ' ')} • {est.neighborhood}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className="text-[11px] font-extrabold text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-0.5 rounded-lg flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {Number(item.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-tight">
                            {item.reviewsCount} avis
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget 3: Événements populaires */}
            <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-gray-900">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
                    <Flame className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Événements populaires</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Vues de l'événement + participations récentes</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/20">
                  7j glissants
                </span>
              </div>

              {isRankingsLoading ? (
                <div className="py-6 text-center text-xs text-gray-400 animate-pulse">Chargement de l'enjaillement...</div>
              ) : (!rankings?.popularEvents || rankings.popularEvents.length === 0) ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  Aucun événement populaire enregistré cette semaine.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {rankings.popularEvents.slice(0, 5).map((item, index) => {
                    const pub = publications.find(p => p.id === item.publicationId);
                    if (!pub) return null;
                    const est = getEst(pub.establishmentId);
                    const imageUrl = pub.imageUrl || (est?.photos?.[0]) || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400';
                    return (
                      <div
                        key={pub.id}
                        onClick={() => setSelectedPub(pub)}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-orange-50/10 transition-all cursor-pointer group"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-400' :
                          index === 1 ? 'bg-slate-100 text-slate-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                        }`}>
                          {index === 0 ? '👑' : index + 1}
                        </div>
                        <img src={imageUrl} alt={pub.title} className="w-9 h-9 rounded-xl object-cover flex-shrink-0 bg-gray-100" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm group-hover:text-orange-600 transition-colors truncate">{pub.title}</h4>
                          <p className="text-[10px] text-gray-500 truncate mt-0.5">
                            Chez {est?.name || 'Partenaire'} • {pub.startDate ? new Date(pub.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Cette semaine'}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg flex-shrink-0">
                          🔥 {item.count} pop
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtres de flux */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setFilterMemberOnly(false)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${!filterMemberOnly ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Tous les flux
            </button>
            <button
              onClick={() => {
                if (!currentUser) {
                  setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour filtrer par vos établissements membres.", type: 'info' });
                  return;
                }
                setFilterMemberOnly(true);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterMemberOnly ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Mes clubs membres
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExpired(!showExpired)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-all flex items-center gap-1 cursor-pointer ${
                showExpired 
                  ? 'bg-purple-100 border-purple-200 text-purple-700 hover:bg-purple-200' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
              title={showExpired ? "Masquer le contenu obsolète/expiré" : "Afficher toutes les publications, y compris obsolètes"}
            >
              <Clock className="w-3 h-3 animate-spin" style={{ animationDuration: '6s' }} />
              <span>{showExpired ? "Flux Complet" : "Fraîcheur Activée"}</span>
            </button>

            {filterMemberOnly && (
              <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 font-bold px-2.5 py-1 rounded-full animate-pulse">
                Filtre membre actif
              </span>
            )}
          </div>
        </div>

        {filterMemberOnly && sortedPublications.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm max-w-sm mx-auto my-4">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Aucune publication membre</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {joinedEstIds.length === 0 
                ? "Vous n'avez pas encore rejoint d'établissement. Allez dans l'onglet 'Explorer' pour envoyer des demandes d'adhésion !"
                : "Les établissements dont vous êtes membre n'ont publié aucune annonce ou promo pour le moment."}
            </p>
          </div>
        )}

        {/* Section Événements ("À la une") */}
        {events.length > 0 && (
          <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-black text-gray-900 tracking-tight">À la une</h2>
              </div>

              {/* Toggle Vue Liste vs Calendrier */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Liste
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${viewMode === 'calendar' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Calendrier
                </button>
              </div>
            </div>

            {/* VUE CALENDRIER INTERACTIVE */}
            {viewMode === 'calendar' && (
              <div className="mb-6 animate-in fade-in duration-200">
                {/* Calendrier Widget */}
                <div className="border border-orange-100 rounded-2xl bg-orange-50/25 p-4 mb-4">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-600 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
                      {MONTHS_FR[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-600 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Week days Header */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {WEEKDAYS.map(day => (
                      <span key={day} className="text-[10px] font-black text-orange-600/70 uppercase">
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {calendarDays.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} />;
                      }

                      const dateKey = formatDateKey(day);
                      const isSelected = selectedDate === dateKey;
                      const hasEvents = getEventsForDate(dateKey).length > 0;
                      const isToday = isTodayDate(day);

                      return (
                        <button
                          key={`day-${day}`}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`h-9 w-9 mx-auto rounded-xl flex flex-col items-center justify-center relative cursor-pointer font-bold text-xs transition-all active:scale-95 ${
                            isSelected 
                              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
                              : isToday
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'hover:bg-orange-50 text-gray-700'
                          }`}
                        >
                          <span>{day}</span>
                          {hasEvents && (
                            <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-orange-500 animate-pulse'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter Date details */}
                {selectedDate && (
                  <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 text-xs font-black text-orange-800 mb-4">
                    <span>
                      🗓️ Événements du {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="text-[10px] bg-white border border-orange-200 text-orange-600 font-bold px-2.5 py-1 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Tout afficher
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RENDER EVENT LIST (CALENDRIER FILTRÉ OU LISTE HORIZONTALE COMPLÈTE) */}
            {viewMode === 'list' ? (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar -mx-4 px-4">
                {displayedEvents.map(event => {
                  const publisher = getPublisher(event.establishmentId);
                  const imageUrl = event.imageUrl || 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&q=80&w=800';
                  return (
                    <div key={event.id} onClick={() => setSelectedPub(event)} className="min-w-[280px] w-[280px] snap-start bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md hover:border-gray-200 transition-all">
                      <div className="h-48 relative overflow-hidden">
                        <ImageChargementProgressif src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute top-3 left-3 flex gap-1.5 items-center flex-wrap max-w-[90%]">
                          <span className="bg-red-500 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg shadow-xs">
                            Événement
                          </span>
                          {event.isNew && (
                            <span className="bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-black px-2 py-1.5 rounded-lg shadow-xs animate-pulse">
                              ✨ Nouveau
                            </span>
                          )}
                          {event.isSoon && (
                            <span className="bg-orange-500 text-white text-[10px] uppercase tracking-wider font-black px-2 py-1.5 rounded-lg shadow-xs">
                              ⚡ Ce soir
                            </span>
                          )}
                          {event.isExpired && (
                            <span className="bg-gray-500 text-white text-[10px] uppercase tracking-wider font-black px-2 py-1.5 rounded-lg shadow-xs">
                              🔒 Archivé
                            </span>
                          )}
                          {publisher.isEntreprise && (
                            <span className="bg-amber-500 text-white text-[10px] uppercase tracking-wider font-black px-2.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1">
                              🤝 Partenaire
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-3 left-4 right-4 text-white">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2">{event.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-gray-300 mt-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate font-medium">{publisher.name} • {publisher.neighborhood}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // GRID VIEW FOR FILTERED CALENDAR EVENTS
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayedEvents.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-gray-800">Aucun événement prévu</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">Aucun événement n'est programmé pour cette date.</p>
                  </div>
                ) : (
                  displayedEvents.map(event => {
                    const publisher = getPublisher(event.establishmentId);
                    const imageUrl = event.imageUrl || 'https://images.unsplash.com/photo-1470229722913-7c090be5c520?auto=format&fit=crop&q=80&w=800';
                    return (
                      <div key={event.id} onClick={() => setSelectedPub(event)} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden group cursor-pointer hover:shadow-md hover:border-gray-200 transition-all flex flex-col">
                        <div className="h-36 relative overflow-hidden flex-shrink-0">
                          <ImageChargementProgressif src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                          <div className="absolute top-2.5 left-2.5 flex gap-1 items-center flex-wrap max-w-[90%]">
                            <span className="bg-red-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs">
                              Événement
                            </span>
                            {event.isNew && (
                              <span className="bg-emerald-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs animate-pulse">
                                Nouveau
                              </span>
                            )}
                            {event.isSoon && (
                              <span className="bg-orange-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs">
                                Ce soir
                              </span>
                            )}
                            {event.isExpired && (
                              <span className="bg-gray-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs">
                                Archivé
                              </span>
                            )}
                            {publisher.isEntreprise && (
                              <span className="bg-amber-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs">
                                🤝 Partenaire
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-extrabold text-sm text-gray-900 leading-tight line-clamp-2 mb-1">{event.title}</h3>
                            <span className="text-[10px] text-orange-600 font-extrabold">{publisher.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{publisher.neighborhood}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        )}

        {annonces.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Communiqués & Annonces</h2>
            </div>
            <div className="flex flex-col gap-3">
              {annonces.map(annonce => {
                const publisher = getPublisher(annonce.establishmentId);
                return (
                  <div key={annonce.id} onClick={() => setSelectedPub(annonce)} className="bg-white rounded-2xl shadow-sm border border-blue-100 hover:border-blue-300 transition-colors p-4 flex gap-4 cursor-pointer relative overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200/50">
                      <Megaphone className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <div className="text-[11px] font-black text-blue-600 uppercase tracking-wide">{publisher.name}</div>
                        {annonce.isNew && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                            ✨ Nouveau
                          </span>
                        )}
                        {annonce.isExpired && (
                          <span className="bg-gray-100 text-gray-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                            🔒 Archivé
                          </span>
                        )}
                        {annonce.status === 'boostee' && (
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5">
                            🔥 En vedette
                          </span>
                        )}
                        {publisher.isEntreprise && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                            🤝 Partenaire
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{annonce.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{stripHtml(annonce.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Native ZAKA Ads Sponsored Feed Card */}
        <AdPlacementBanner placement="home_sponsored" />

        {promos.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Promos & Bons Plans</h2>
            </div>
            <div className="flex flex-col gap-3">
              {promos.map(promo => {
                const publisher = getPublisher(promo.establishmentId);
                return (
                  <div 
                    key={promo.id} 
                    onClick={() => setSelectedPub(promo)} 
                    className={`bg-white rounded-2xl shadow-sm transition-all p-4 flex gap-4 cursor-pointer relative overflow-hidden ${
                      promo.isEmergency && !promo.isExpired
                        ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.12)] ring-1 ring-red-100'
                        : 'border border-orange-100 hover:border-orange-300'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center border ${
                      promo.isEmergency && !promo.isExpired
                        ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200/50'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50'
                    }`}>
                      {promo.isEmergency && !promo.isExpired ? (
                        <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
                      ) : (
                        <Tag className="w-6 h-6 text-orange-500" />
                      )}
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <div className={`text-[11px] font-black uppercase tracking-wide ${
                          promo.isEmergency && !promo.isExpired ? 'text-red-600' : 'text-orange-600'
                        }`}>{publisher.name}</div>
                        {promo.isEmergency && !promo.isExpired && promo.expiresAt && (
                          <EmergencyCountdown expiresAt={promo.expiresAt} />
                        )}
                        {promo.isNew && !promo.isEmergency && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 animate-pulse">
                            ✨ Nouveau
                          </span>
                        )}
                        {promo.isExpired && (
                          <span className="bg-gray-100 text-gray-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                            🔒 Archivé
                          </span>
                        )}
                        {promo.status === 'boostee' && (
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5">
                            🔥 En vedette
                          </span>
                        )}
                        {publisher.isEntreprise && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200">
                            🤝 Partenaire
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{promo.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{stripHtml(promo.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section id="establishments-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                {filterMemberOnly ? "Mes Clubs Membres" : "Lieux & Établissements"}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {filterMemberOnly 
                  ? "Les lieux dont vous êtes membre vérifié" 
                  : `${filteredEstablishments.length} lieu(x) disponible(s)`}
              </p>
            </div>

            {/* Tri / Sort controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSortBy('popular');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Populaires
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSortBy('rating');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'rating'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Star className="w-3.5 h-3.5" /> Mieux notés
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSortBy('price_asc');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'price_asc'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
                title="Trier par prix moyen le plus accessible"
              >
                <Coins className="w-3.5 h-3.5" /> Prix abordable
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSortBy('price_desc');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'price_desc'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
                title="Trier par prix moyen standing"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Prix standing
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  handleSelectProximity();
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'proximity'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
                title="Trier par proximité géographique avec ma position GPS"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Compass className="w-3.5 h-3.5" />
                )}
                <span>Autour de moi</span>
                {sortBy === 'proximity' && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSortBy('now');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                  sortBy === 'now'
                    ? 'bg-amber-400 text-gray-950 font-black shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> En direct
              </button>
            </div>
          </div>

          {/* Text Search Bar for Establishments */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4 text-orange-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  addSearchTerm(searchQuery);
                  (e.target as HTMLElement).blur();
                }
              }}
              placeholder="Rechercher par nom, description, quartier, spécialité..."
              className="w-full pl-10 pr-20 py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-xs sm:text-sm font-medium outline-none transition-all shadow-xs placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded-lg"
                  title="Effacer la recherche"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleVoiceSearch}
                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                  isVoiceListening
                    ? 'bg-red-500 text-white animate-pulse shadow-md ring-2 ring-red-400'
                    : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-800'
                }`}
                title={
                  !isVoiceSupported
                    ? "Recherche vocale non supportée sur ce navigateur"
                    : isVoiceListening
                    ? "Arrêter l'écoute vocale"
                    : "Rechercher par commande vocale"
                }
                aria-label="Recherche vocale"
              >
                {isVoiceListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Type Filter Bar (Maquis, Restaurant, Bar, Boîte de nuit) */}
          <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5">
              {[
                { id: 'all', label: 'Tous', icon: SlidersHorizontal },
                { id: 'maquis', label: 'Maquis', icon: Flame },
                { id: 'restaurant', label: 'Restaurants', icon: Sparkles },
                { id: 'bar', label: 'Bars', icon: Wine },
                { id: 'boite_de_nuit', label: 'Clubs / Boîtes', icon: Trophy }
              ].map(cat => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-400/40 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status banner when Proximity sort is active */}
          {sortBy === 'proximity' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-850 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold">Mode "Autour de moi" actif :</span>
                <span>Établissements classés par distance croissante</span>
              </div>
              <button
                onClick={handleSelectProximity}
                disabled={isLocating}
                className="text-emerald-700 dark:text-emerald-300 font-extrabold hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                title="Réactualiser ma position"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>{isLocating ? 'Actualisation...' : 'Actualiser'}</span>
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="flex flex-col gap-4" aria-label="Chargement des établissements...">
                {[1, 2, 3, 4].map(i => (
                  <EstablishmentCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredEstablishments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100 dark:border-orange-900 animate-bounce">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {searchQuery ? `Aucun établissement trouvé pour "${searchQuery}"` : filterMemberOnly ? "Aucun club membre" : "Aucun établissement trouvé"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                  {searchQuery 
                    ? "Vérifiez l'orthographe ou tentez une recherche plus large."
                    : filterMemberOnly 
                      ? "Vous n'avez pas encore rejoint d'établissement. Allez dans l'onglet Explorer pour demander l'adhésion !"
                      : "Essayez de sélectionner une autre catégorie ou de désactiver les filtres."}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 hover:bg-orange-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Effacer la recherche
                    </button>
                  )}
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="px-4 py-1.5 rounded-full bg-orange-600 text-white font-bold text-xs cursor-pointer"
                    >
                      Voir tous les établissements
                    </button>
                  )}
                </div>
              </div>
            ) : (
              filteredEstablishments.map(est => {
                const imageUrl = est.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800';
                const effectiveUserId = currentUser ? currentUser.id : 'guest';
                const isFav = (favorites[effectiveUserId] || []).includes(est.id);
                const distKm = establishmentDistances[est.id];

                return (
                  <div key={est.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-36 sm:h-44 relative">
                       <ImageChargementProgressif src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"></div>
                       <div className="absolute top-3 left-3">
                         <CrowdStatusBadge establishment={est} showControlForOwner={false} />
                       </div>
                       <div className="absolute bottom-3 right-3 flex items-center gap-1 text-yellow-400 font-bold bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs border border-white/10">
                         <Star className="w-3.5 h-3.5 fill-yellow-400" /> {Number(est.averageRating || 0).toFixed(1)}
                       </div>

                       {/* Proximity badge if available */}
                       {typeof distKm === 'number' && (
                         <div className={`absolute top-3 left-28 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1 border shadow-xs ${
                           est.id === closestEstId 
                             ? 'bg-emerald-600/90 border-emerald-400 text-white' 
                             : 'bg-black/60 border-white/20'
                         }`}>
                           <MapPin className={`w-3 h-3 ${est.id === closestEstId ? 'text-white fill-white' : 'text-orange-400'}`} />
                           <span>{est.id === closestEstId ? `🏆 Plus proche (${formatDistance(distKm)})` : `à ${formatDistance(distKm)}`}</span>
                         </div>
                       )}

                       {/* Quick action buttons on card image (Share & Favorite) */}
                       <div className="absolute top-3 right-3 flex items-center gap-2">
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             await shareContent({
                               title: `${est.name} - Zaka+`,
                               text: `Découvrez ${est.name} (${est.neighborhood || est.city || 'Ouagadougou'}) sur Zaka+ !`,
                               url: `${window.location.origin}/#est-${est.id}`
                             });
                           }}
                           className="p-2 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 text-white transition-all active:scale-90 cursor-pointer"
                           aria-label="Partager cet établissement"
                           title="Partager cet établissement"
                         >
                           <Share2 className="w-4 h-4 text-white" />
                         </button>

                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             const effectiveClientId = currentUser ? currentUser.id : 'guest';
                             await toggleFavorite(effectiveClientId, est.id);
                             const nowFav = !isFav;
                             triggerHaptic(nowFav ? 'success' : 'light');
                             window.dispatchEvent(new CustomEvent('app-toast', {
                               detail: {
                                 message: nowFav 
                                   ? `❤️ ${est.name} ajouté aux favoris${!currentUser ? ' (enregistré localement)' : ''}` 
                                   : `💔 ${est.name} retiré des favoris`,
                                 type: 'info'
                                }
                             }));
                           }}
                           className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                             isFav 
                               ? "bg-red-500 text-white shadow-md" 
                               : "bg-black/40 hover:bg-black/60 text-white"
                           }`}
                           aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                           title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                         >
                           <Heart className={`w-4 h-4 ${isFav ? "fill-white text-white" : "text-white"}`} />
                         </button>
                       </div>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">{est.name}</h3>
                          {isFav && (
                            <span className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-red-100 dark:border-red-900 flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 fill-red-500" /> Favori
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <span>{est.category.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span>{est.neighborhood || est.quarter || 'Ouagadougou'}</span>
                          <span>•</span>
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">~{getEstablishmentAvgPrice(est).toLocaleString('fr-FR')} F</span>
                          {typeof distKm === 'number' && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 dark:text-orange-400 font-bold">à {formatDistance(distKm)}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                        {/* Explicit 'Partager' button on each card */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await shareContent({
                              title: `${est.name} - Zaka+`,
                              text: `Découvrez ${est.name} (${est.neighborhood || est.city || 'Ouagadougou'}) sur Zaka+ !`,
                              url: `${window.location.origin}/#est-${est.id}`
                            });
                          }}
                          className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 active:scale-95 text-gray-700 dark:text-gray-300 font-bold text-xs px-3 py-2 rounded-xl transition-all flex-shrink-0 cursor-pointer"
                          title="Partager la fiche établissement"
                        >
                          <Share2 className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          <span>Partager</span>
                        </button>

                        {/* Explicit 'Ajouter aux favoris' button on each card */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const effectiveClientId = currentUser ? currentUser.id : 'guest';
                            await toggleFavorite(effectiveClientId, est.id);
                            const nowFav = !isFav;
                            triggerHaptic(nowFav ? 'success' : 'light');
                            window.dispatchEvent(new CustomEvent('app-toast', {
                              detail: {
                                message: nowFav 
                                  ? `❤️ ${est.name} ajouté aux favoris${!currentUser ? ' (enregistré localement)' : ''}` 
                                  : `💔 ${est.name} retiré des favoris`,
                                type: 'info'
                              }
                            }));
                          }}
                          className={`flex items-center gap-1.5 font-bold text-xs px-3 py-2 rounded-xl transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                            isFav
                              ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900"
                              : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300"
                          }`}
                          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-red-500 text-red-500" : "text-gray-500 dark:text-gray-400"}`} />
                          <span>{isFav ? "Favori" : "Favoris"}</span>
                        </button>

                        {onStartChat && (
                          <button 
                            onClick={() => onStartChat(est.id)}
                            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex-shrink-0"
                            title="Discuter avec l'établissement"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Discuter</span>
                          </button>
                        )}
                        <button 
                          onClick={() => setReservationEst({ id: est.id, name: est.name })}
                          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex-shrink-0 shadow-sm"
                          title="Réserver une table"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Réserver</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
      
      {reservationEst && (
        <ReservationModal
          establishmentName={reservationEst.name}
          onClose={() => setReservationEst(null)}
          onSubmit={handleReservationSubmit}
        />
      )}

      {/* Publication Details Modal */}
      {selectedPub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-orange-800">
                  {selectedPub.type === 'evenement' ? 'Événement' : selectedPub.type === 'annonce' ? 'Communiqué' : 'Promo / Bon plan'}
                </span>
                <h2 className="text-lg font-black text-gray-900 leading-tight mt-1.5 truncate">{selectedPub.title}</h2>
                <p className="text-xs text-gray-500 font-bold mt-0.5">Par {getPublisher(selectedPub.establishmentId).name}</p>
              </div>
              <button onClick={() => setSelectedPub(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer flex-shrink-0 ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {selectedPub.type === 'evenement' && (
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 border border-gray-150 dark:border-gray-800 flex-shrink-0">
                  {[
                    { id: 'info', label: 'ℹ️ Détails' },
                    { id: 'photos', label: '📸 Challenge' },
                    { id: 'wall', label: '💬 Mur Social' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActivePubTab(tab.id as any)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                        activePubTab === tab.id
                          ? 'bg-orange-600 text-white shadow-sm font-extrabold'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {activePubTab === 'info' ? (
                <>
                  {/* Publisher / Establishment Info Card */}
                  {(() => {
                    const publisher = getPublisher(selectedPub.establishmentId);
                    const targetEst = establishments.find(e => e.id === selectedPub.establishmentId);
                    return (
                      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/60 flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-sm">
                            {publisher.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-gray-900 truncate">{publisher.name}</h4>
                            <p className="text-xs text-gray-600 flex items-center gap-1 font-medium truncate">
                              <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                              {publisher.neighborhood || 'Burkina Faso'}
                            </p>
                          </div>
                        </div>
                        {targetEst && (
                          <button
                            onClick={() => {
                              setSelectedRankEst(targetEst);
                              setSelectedPub(null);
                            }}
                            className="px-3 py-1.5 bg-white border border-orange-300 text-orange-800 hover:bg-orange-100 font-extrabold text-[11px] rounded-xl shrink-0 transition-colors cursor-pointer shadow-xs"
                          >
                            Voir Fiche
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {selectedPub.imageUrl && (
                    <div className="w-full h-56 rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                      <img src={selectedPub.imageUrl} alt={selectedPub.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {(selectedPub.startDate || selectedPub.endDate) && (
                    <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-orange-800 font-bold">
                      <Calendar className="w-4 h-4 text-orange-600 animate-pulse" />
                      <span>
                        {selectedPub.startDate && `Du ${new Date(selectedPub.startDate).toLocaleDateString('fr-FR')}`}
                        {selectedPub.endDate && ` au ${new Date(selectedPub.endDate).toLocaleDateString('fr-FR')}`}
                      </span>
                    </div>
                  )}

                  {/* Detailed Description */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-2">Détails de l'Annonce</h4>
                    <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
                      {selectedPub.description}
                    </div>
                  </div>

                  {/* Contact Methods Card */}
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/60 space-y-3">
                    <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> Options de Contact Direct
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                      {selectedPub.whatsapp && (
                        <a
                          href={`https://wa.me/${selectedPub.whatsapp.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(`Bonjour, je vous contacte sur ZAKA+ à propos de : ${selectedPub.title}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp Direct</span>
                        </a>
                      )}
                      {selectedPub.applyEmail && (
                        <a
                          href={`mailto:${selectedPub.applyEmail}?subject=${encodeURIComponent(`Candidature ZAKA+ : ${selectedPub.title}`)}`}
                          className="flex items-center justify-center gap-2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          <span>📧 Postuler par Email</span>
                        </a>
                      )}
                      {(() => {
                        const targetEst = establishments.find(e => e.id === selectedPub.establishmentId);
                        if (targetEst?.phone) {
                          return (
                            <a
                              href={`tel:${targetEst.phone}`}
                              className="flex items-center justify-center gap-2 p-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shadow-xs"
                            >
                              <Phone className="w-4 h-4" />
                              <span>Appeler ({targetEst.phone})</span>
                            </a>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Guidance for User */}
                  <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                    <div className="font-black flex items-center gap-1.5 text-amber-950">
                      <span>💡 Guide d'action pour les utilisateurs</span>
                    </div>
                    <p className="leading-relaxed font-medium">
                      Consultez attentivement la description ci-dessus. Pour toute demande d'information, de réservation ou de postulation, contactez directement l'établissement ou l'annonceur via les boutons WhatsApp et Téléphone.
                    </p>
                  </div>

                  {selectedPub.type === 'evenement' && (
                    <>
                      <ParticipationButtons
                        event={selectedPub}
                        establishment={establishments.find(e => e.id === selectedPub.establishmentId) || null}
                      />
                      <EventAIAnalytics
                        event={selectedPub}
                        establishment={establishments.find(e => e.id === selectedPub.establishmentId) || null}
                      />
                    </>
                  )}
                </>
              ) : activePubTab === 'photos' ? (
                <ChallengePhoto eventId={selectedPub.id} eventTitle={selectedPub.title} />
              ) : (
                <EventSocialMur 
                  eventId={selectedPub.id} 
                  isOwnerOrDJ={
                    !!(currentUser && (
                      currentUser.id === establishments.find(e => e.id === selectedPub.establishmentId)?.ownerId ||
                      currentUser.role === 'dj'
                    ))
                  } 
                />
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex-shrink-0 flex gap-2">
              <button
                onClick={() => setSelectedPub(null)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs text-center"
              >
                Fermer
              </button>

              <button
                onClick={() => setSharingPub(selectedPub)}
                className="py-3 px-3 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200/60 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
                title="Générer un visuel Story 9:16"
              >
                <Share2 className="w-3.5 h-3.5 text-orange-600" />
                Story 9:16
              </button>

              {/* Booster avec Ads Express si gérant/propriétaire ou créateur */}
              {currentUser && (currentUser.role === 'gerant' || currentUser.role === 'admin' || currentUser.role === 'partenaire') && (
                <button
                  onClick={() => {
                    const est = establishments.find(e => e.id === selectedPub.establishmentId);
                    setExpressTargetEst(est || null);
                    setExpressTargetPub(selectedPub);
                    setShowExpressModal(true);
                  }}
                  className="py-3 px-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white font-black rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
                  title="Booster cette publication en 2 minutes avec l'IA"
                >
                  <Rocket className="w-3.5 h-3.5 fill-white" />
                  <span>Booster</span>
                </button>
              )}

              {onStartChat && (
                <button
                  onClick={() => {
                    const estId = selectedPub.establishmentId;
                    setSelectedPub(null);
                    onStartChat(estId);
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2 truncate"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">{getPublisher(selectedPub.establishmentId).isEntreprise ? "Contacter" : "Contacter"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {sharingPub && (
        <ShareableVisual
          publication={sharingPub}
          establishmentName={getPublisher(sharingPub.establishmentId).name}
          onClose={() => setSharingPub(null)}
        />
      )}

      {selectedRankEst && (
        <EstablishmentDetailModal
          establishment={selectedRankEst}
          onClose={() => setSelectedRankEst(null)}
        />
      )}

      {showGuideModal && (
        <UserGuideModal onClose={() => setShowGuideModal(false)} />
      )}

      {/* ZAKA Ads Express Wizard Modal */}
      {showExpressModal && (
        <AdExpressWizard
          isOpen={showExpressModal}
          onClose={() => {
            setShowExpressModal(false);
            setExpressTargetPub(null);
            setExpressTargetEst(null);
          }}
          prefillEstablishment={expressTargetEst || undefined}
          prefillPublication={expressTargetPub || undefined}
          prefillType={expressTargetPub?.type === 'evenement' ? 'evenement' : expressTargetPub ? 'promotion' : 'etablissement'}
        />
      )}
    </div>
  );
}
