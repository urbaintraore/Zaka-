import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Tab } from '../components/BottomNav';
import { MapPin, Tag, Flame, Sparkles, Star, MessageSquare, Calendar, Megaphone, X, Users, Heart, ChevronLeft, ChevronRight, Eye, Trophy, TrendingUp, Award, Clock, Share2, AlertCircle, BookOpen, Phone } from 'lucide-react';
import { stripHtml } from '../utils/htmlHelpers';
import { ReservationModal } from '../components/ReservationModal';
import { Publication, Establishment } from '../types';
import { db } from '../lib/firebase';
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
import { GroupOutingModal } from '../components/GroupOutingModal';
import { motion } from 'motion/react';

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
  const { publications, establishments, entreprises, currentUser, createServiceRequest, relationshipRequests, setGlobalError, favorites, toggleFavorite, reviews, trackPublicationView, users } = useAppStore();
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [sharingPub, setSharingPub] = useState<Publication | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [filterMemberOnly, setFilterMemberOnly] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [modeMaintenant, setModeMaintenant] = useState(false);
  const [showGroupOutingModal, setShowGroupOutingModal] = useState(false);
  const [activePubTab, setActivePubTab] = useState<'info' | 'photos' | 'wall'>('info');
  const [mapCategory, setMapCategory] = useState<string>('Tous');

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
        const { collection, getDocs } = await import('firebase/firestore');
        const favSnap = await getDocs(collection(db, 'favorites'));
        if (!active) return;

        const counts: Record<string, number> = {};
        favSnap.forEach(docSnap => {
          const data = docSnap.data();
          const estIds = data?.establishmentIds || [];
          estIds.forEach((id: string) => {
            counts[id] = (counts[id] || 0) + 1;
          });
        });

        // Map and sort establishments by favorite count
        const estsWithCounts = Object.entries(counts)
          .map(([id, count]) => ({ id, favoritesCount: count }))
          .sort((a, b) => b.favoritesCount - a.favoritesCount);

        setPopularEstsByFavorites(estsWithCounts);
      } catch (err) {
        console.error("Erreur lors de la récupération des favoris pour les Coups de cœur:", err);
        // Fallback: use establishments list sorted by averageRating (simulating counts using rating)
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

  // Simulation Panel state
  const [showSimPanel, setShowSimPanel] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);

  // Rankings loading & daily recalculation
  useEffect(() => {
    let active = true;
    const fetchRankings = async () => {
      try {
        setIsRankingsLoading(true);
        const { getDoc, doc } = await import('firebase/firestore');
        const docRef = doc(db, 'rankings', 'cache');
        const docSnap = await getDoc(docRef);
        
        let cachedData = null;
        if (docSnap.exists()) {
          cachedData = docSnap.data();
          if (active && cachedData) {
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
      } catch (err) {
        console.error("Erreur lors du chargement des classements:", err);
        await runRecalculate();
      } finally {
        if (active) setIsRankingsLoading(false);
      }
    };

    const runRecalculate = async () => {
      if (isRecalculating) return;
      setIsRecalculating(true);
      try {
        const { getDocs, collection, query, where, setDoc, doc } = await import('firebase/firestore');
        const nowStr = new Date().toISOString();
        const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = sevenDaysAgoDate.toISOString();
        
        let rawEstViews: any[] = [];
        try {
          const qEstViews = query(collection(db, 'establishment_views'), where('timestamp', '>=', sevenDaysAgo));
          const estViewsSnap = await getDocs(qEstViews);
          estViewsSnap.forEach(d => {
            rawEstViews.push(d.data());
          });
        } catch (e) {
          console.error("Erreur query establishment_views:", e);
        }

        let rawPubViews: any[] = [];
        try {
          const qPubViews = query(collection(db, 'publication_views'), where('timestamp', '>=', sevenDaysAgo));
          const pubViewsSnap = await getDocs(qPubViews);
          pubViewsSnap.forEach(d => {
            rawPubViews.push(d.data());
          });
        } catch (e) {
          console.error("Erreur query publication_views:", e);
        }

        let rawParticipations: any[] = [];
        try {
          const qParticipations = query(collection(db, 'event_participations'), where('timestamp', '>=', sevenDaysAgo));
          const participationsSnap = await getDocs(qParticipations);
          participationsSnap.forEach(d => {
            rawParticipations.push(d.data());
          });
        } catch (e) {
          console.error("Erreur query event_participations:", e);
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

        await setDoc(doc(db, 'rankings', 'cache'), newRankings);
        
        if (active) {
          setRankings(newRankings);
        }
      } catch (err) {
        console.error("Erreur lors de la réévaluation des classements:", err);
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

  const handleSimulateViews = async (recent: boolean) => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      if (establishments.length === 0) {
        setSimMessage("Aucun établissement disponible pour simuler.");
        return;
      }
      
      const targetEsts = establishments.slice(0, 2);
      const daysOffset = recent ? 2 : 10;
      const timestamp = new Date(Date.now() - daysOffset * 24 * 60 * 60 * 1000).toISOString();
      
      for (const est of targetEsts) {
        for (let i = 0; i < 3; i++) {
          await addDoc(collection(db, 'establishment_views'), {
            establishmentId: est.id,
            userId: 'test-user-' + Math.random().toString(36).substring(2, 6),
            timestamp
          });
        }
      }
      
      setSimMessage(`Succès: 6 vues ${recent ? 'récentes (<7j)' : 'anciennes (>7j)'} ajoutées.`);
    } catch (err) {
      console.error(err);
      setSimMessage("Erreur lors de la simulation des vues.");
    }
  };

  const handleSimulateOwnerView = async () => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      if (establishments.length === 0) {
        setSimMessage("Aucun établissement disponible.");
        return;
      }
      const est = establishments[0];
      await addDoc(collection(db, 'establishment_views'), {
        establishmentId: est.id,
        userId: est.ownerId,
        timestamp: new Date().toISOString()
      });
      setSimMessage(`Succès: Vue Gérant sur sa propre fiche ajoutée pour ${est.name} (exclue du classement).`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateGerantRoleView = async () => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      if (establishments.length === 0) {
        setSimMessage("Aucun établissement disponible.");
        return;
      }
      const est = establishments[0];
      const gerantUser = users?.find(u => u.role === 'gerant') || { id: 'simulated-gerant-id' };
      
      await addDoc(collection(db, 'establishment_views'), {
        establishmentId: est.id,
        userId: gerantUser.id,
        timestamp: new Date().toISOString()
      });
      setSimMessage(`Succès: Vue par un compte de rôle Gérant simulée pour ${est.name} (exclue du classement).`);
    } catch (err) {
      console.error(err);
      setSimMessage("Erreur lors de la simulation.");
    }
  };

  const handleSimulateRecentReviews = async () => {
    try {
      const { addDoc, collection } = await import('firebase/firestore');
      if (establishments.length === 0) {
        setSimMessage("Aucun établissement disponible.");
        return;
      }
      const est = establishments[0];
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      for (let i = 0; i < 3; i++) {
        await addDoc(collection(db, 'reviews'), {
          clientId: 'test-client-' + Math.random().toString(36).substring(2, 6),
          establishmentId: est.id,
          rating: 5,
          comment: `Super expérience récente ! (Simulé #${i + 1})`,
          date: recentDate
        });
      }
      setSimMessage(`Succès: 3 avis récents (5★) ajoutés pour ${est.name} pour valider le seuil de 3 avis sur 7 jours.`);
    } catch (err) {
      console.error(err);
      setSimMessage("Erreur lors de la simulation des avis.");
    }
  };

  const handleForceRecalculate = () => {
    setSimMessage("Mise à jour lancée...");
    setRecalcTrigger(prev => prev + 1);
  };
  
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

  const sortedEstablishments = [...establishments]
    .filter(e => e.status === 'valide')
    .sort((a, b) => {
      if (modeMaintenant) {
        const weightA = getCrowdWeight(a);
        const weightB = getCrowdWeight(b);
        if (weightB !== weightA) return weightB - weightA;
      }
      return b.averageRating - a.averageRating;
    });

  const topEstablishments = sortedEstablishments.slice(0, modeMaintenant ? 12 : 5);

  const filteredEstablishments = filterMemberOnly
    ? sortedEstablishments.filter(e => joinedEstIds.includes(e.id))
    : topEstablishments;

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
              onClick={() => onNavigate?.('explore')}
              className="bg-white text-orange-600 px-5 py-2.5 rounded-full font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-xs flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" /> Explorer la carte
            </button>
            <button 
              onClick={() => setShowGuideModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-gray-950 px-5 py-2.5 rounded-full font-extrabold shadow-md active:scale-95 transition-all text-xs flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-gray-900" /> Guide d'Utilisation
            </button>
            <button 
              onClick={() => setModeMaintenant(!modeMaintenant)}
              className={`px-5 py-2.5 rounded-full font-extrabold active:scale-95 transition-all text-xs flex items-center gap-2 shadow-md ${
                modeMaintenant 
                  ? 'bg-amber-300 text-gray-950 ring-2 ring-amber-200 animate-pulse' 
                  : 'bg-black/30 hover:bg-black/40 text-white border border-white/30'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" /> 
              {modeMaintenant ? "⚡ Mode Maintenant Actif !" : "⚡ Mode Maintenant"}
            </button>
            <button 
              onClick={() => setShowGroupOutingModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-5 py-2.5 rounded-full font-bold active:scale-95 transition-all text-xs flex items-center gap-1.5"
            >
              <Users className="w-4 h-4 text-orange-200" /> Sortie de Groupe
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="relative z-10 -mx-6 px-6 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2 pb-2">
            {['Tous', 'Maquis', 'Restaurant', 'Bar', 'Discothèque'].map((cat) => (
              <button
                key={cat}
                onClick={() => setMapCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  mapCategory.toLowerCase() === cat.toLowerCase()
                ? 'bg-white text-orange-600 shadow-sm'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Placement Banner on Home Header */}
      <div className="px-4">
        <AdPlacementBanner placement="home_banner" />
      </div>

      {/* Map Interactive */}
      <div className="px-4">
        <MapView 
          establishments={establishments} 
          onEstClick={(id) => {
            const est = establishments.find(e => e.id === id);
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
                <div className="text-center py-6 text-xs text-gray-400 flex flex-col gap-1.5 items-center">
                  <span>Aucun établissement n'a reçu 3 avis au cours des 7 derniers jours.</span>
                  <span className="text-[10px] text-orange-500 font-bold">💡 Utilisez le simulateur en bas de page pour ajouter 3 avis récents en 1 clic !</span>
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
                            {item.rating.toFixed(1)}
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

          {/* Simulation/Test panel helper */}
          <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-xs">
            <button
              onClick={() => {
                setShowSimPanel(!showSimPanel);
                setSimMessage(null);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>🛠️</span>
              <span>{showSimPanel ? "Masquer le simulateur de test" : "Afficher le simulateur de test (vues / exclusions Gérant / seuil 3 avis)"}</span>
            </button>

            {showSimPanel && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Simulateur de Données de Classement</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-4">
                  Testez la conformité de l'exclusion des gérants et du seuil d'avis de 7j glissants. Ajoutez des actions fictives, puis cliquez sur "Forcer la mise à jour".
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => handleSimulateViews(true)}
                    className="px-3 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 rounded-xl text-xs font-bold cursor-pointer text-left"
                  >
                    ➕ +6 Vues Récentes (&lt;7j)
                  </button>
                  <button
                    onClick={() => handleSimulateViews(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer text-left"
                  >
                    ➕ +6 Vues Anciennes (&gt;7j)
                  </button>
                  <button
                    onClick={handleSimulateOwnerView}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded-xl text-xs font-bold cursor-pointer text-left"
                  >
                    🚫 Vue Propriétaire (Exclue d'office)
                  </button>
                  <button
                    onClick={handleSimulateGerantRoleView}
                    className="px-3 py-2 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 rounded-xl text-xs font-bold cursor-pointer text-left"
                  >
                    🚫 Vue Compte Gérant (Exclue d'office)
                  </button>
                  <button
                    onClick={handleSimulateRecentReviews}
                    className="px-3 py-2 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 rounded-xl text-xs font-bold cursor-pointer text-left col-span-1 sm:col-span-2"
                  >
                    ⭐ Simuler 3 avis récents (Seuil pour "Les mieux notés")
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleForceRecalculate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    🔄 Recalculer les widgets en direct
                  </button>
                </div>

                {simMessage && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-950 rounded-xl text-xs font-semibold text-orange-600 border border-orange-100 dark:border-orange-950/40">
                    {simMessage}
                  </div>
                )}
              </div>
            )}
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
                      <div className="h-48 bg-gray-200 relative overflow-hidden">
                        <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                        <div className="h-36 bg-gray-200 relative overflow-hidden flex-shrink-0">
                          <img src={imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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

        <section>
          <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight">
            {filterMemberOnly ? "Mes Clubs Membres" : "Lieux Populaires"}
          </h2>
          <div className="flex flex-col gap-4">
            {filteredEstablishments.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-orange-100 animate-bounce">
                  <Users className="w-6 h-6 text-orange-500" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Aucun club membre</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                  Vous n'avez pas encore rejoint d'établissement. Allez dans l'onglet <strong className="text-orange-600 font-bold">Explorer</strong> pour demander l'adhésion à des établissements !
                </p>
              </div>
            ) : (
              filteredEstablishments.map(est => {
                const imageUrl = est.photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800';
                return (
                  <div key={est.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-32 relative">
                       <img src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute top-3 left-3">
                         <CrowdStatusBadge establishment={est} showControlForOwner={false} />
                       </div>
                       <div className="absolute bottom-3 right-3 flex items-center gap-1 text-yellow-400 font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-sm">
                         <Star className="w-4 h-4 fill-yellow-400" /> {est.averageRating.toFixed(1)}
                       </div>
                       {currentUser && (
                         <button
                           onClick={async (e) => {
                             e.stopPropagation();
                             await toggleFavorite(currentUser.id, est.id);
                           }}
                           className="absolute top-3 right-3 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all active:scale-90 text-white"
                           title={(favorites[currentUser.id] || []).includes(est.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                         >
                           <Heart className={`w-4 h-4 ${(favorites[currentUser.id] || []).includes(est.id) ? "fill-red-500 text-red-500" : "text-white"}`} />
                         </button>
                       )}
                    </div>
                    <div className="p-4 flex gap-4 items-center justify-between">
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-lg mb-0.5 truncate">{est.name}</h3>
                        <p className="text-sm text-gray-500 capitalize font-medium truncate">{est.category.replace(/_/g, ' ')} • {est.neighborhood}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {onStartChat && (
                          <button 
                            onClick={() => onStartChat(est.id)}
                            className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-shrink-0"
                            title="Discuter"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setReservationEst({ id: est.id, name: est.name })}
                          className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex-shrink-0"
                          title="Réserver"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
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
                    <div className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedPub.description }} />
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

      {showGroupOutingModal && (
        <GroupOutingModal onClose={() => setShowGroupOutingModal(false)} />
      )}
    </div>
  );
}
