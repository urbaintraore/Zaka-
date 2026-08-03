import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Tab } from '../components/BottomNav';
import { MapPin, Tag, Flame, Sparkles, Star, MessageSquare, Calendar, Megaphone, X, Users, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { stripHtml } from '../utils/htmlHelpers';
import { ReservationModal } from '../components/ReservationModal';
import { Publication, Establishment } from '../types';
import { db } from '../lib/firebase';
import { EstablishmentDetailModal } from '../components/EstablishmentDetailModal';
import { StoriesSection } from '../components/StoriesSection';
import { ParticipationButtons } from '../components/ParticipationButtons';
import { EventAIAnalytics } from '../components/EventAIAnalytics';
import { ChallengePhoto } from '../components/ChallengePhoto';
import { EventSocialMur } from '../components/EventSocialMur';
import { MapView } from '../components/MapView';
import { motion } from 'motion/react';

interface HomeViewProps {
  onStartChat?: (estId: string) => void;
  onNavigate?: (tab: Tab) => void;
}

export function HomeView({ onStartChat, onNavigate }: HomeViewProps) {
  const { publications, establishments, entreprises, currentUser, createServiceRequest, relationshipRequests, setGlobalError, favorites, toggleFavorite, reviews, trackPublicationView, users } = useAppStore();
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [filterMemberOnly, setFilterMemberOnly] = useState(false);
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
        
        let needsRecalculate = false;
        let cachedData = null;
        
        if (docSnap.exists()) {
          cachedData = docSnap.data();
          const updatedAtStr = cachedData.updatedAt;
          if (updatedAtStr) {
            const updatedAt = new Date(updatedAtStr);
            const now = new Date();
            const isSameDay = updatedAt.toDateString() === now.toDateString();
            const diffHours = Math.abs(now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
            if (!isSameDay && diffHours >= 24) {
              needsRecalculate = true;
            }
          } else {
            needsRecalculate = true;
          }
        } else {
          needsRecalculate = true;
        }

        if (needsRecalculate) {
          console.log("[Rankings] Stale or missing cache, recalculating...");
          await runRecalculate();
        } else if (cachedData) {
          if (active) {
            setRankings({
              mostViewed: cachedData.mostViewed || [],
              bestRated: cachedData.bestRated || [],
              popularEvents: cachedData.popularEvents || [],
              updatedAt: cachedData.updatedAt || null,
            });
          }
        }
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
        const { getDocs, collection, setDoc, doc } = await import('firebase/firestore');
        const nowStr = new Date().toISOString();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        let rawEstViews: any[] = [];
        try {
          const estViewsSnap = await getDocs(collection(db, 'establishment_views'));
          estViewsSnap.forEach(d => {
            const data = d.data();
            if (data.timestamp && data.timestamp >= sevenDaysAgo) {
              rawEstViews.push(data);
            }
          });
        } catch (e) {
          console.error("Erreur query establishment_views:", e);
        }

        let rawPubViews: any[] = [];
        try {
          const pubViewsSnap = await getDocs(collection(db, 'publication_views'));
          pubViewsSnap.forEach(d => {
            const data = d.data();
            if (data.timestamp && data.timestamp >= sevenDaysAgo) {
              rawPubViews.push(data);
            }
          });
        } catch (e) {
          console.error("Erreur query publication_views:", e);
        }

        // --- CALCULATE ESTABLISHMENT VIEWS RANKING ---
        const viewCounts: Record<string, number> = {};
        rawEstViews.forEach(v => {
          const estId = v.establishmentId;
          const est = establishments.find(e => e.id === estId);
          if (!est) return;
          if (v.userId && v.userId === est.ownerId) {
            return; // Skip views by owner
          }
          viewCounts[estId] = (viewCounts[estId] || 0) + 1;
        });

        const mostViewed = Object.entries(viewCounts)
          .map(([establishmentId, count]) => ({ establishmentId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // --- CALCULATE BEST RATED RANKING ---
        const bestRatedList = establishments
          .map(est => {
            const estReviews = reviews.filter(r => r.establishmentId === est.id);
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
            return b.reviewsCount - a.reviewsCount;
          })
          .slice(0, 10);

        // --- CALCULATE POPULAR EVENTS RANKING ---
        const todayStr = new Date().toISOString().split('T')[0];
        const activeEvents = publications.filter(pub => {
          if (pub.type !== 'evenement') return false;
          const dateCheck = pub.endDate || pub.startDate;
          if (!dateCheck) return true;
          return dateCheck.split('T')[0] >= todayStr;
        });

        const eventViewCounts: Record<string, number> = {};
        rawPubViews.forEach(v => {
          const pubId = v.publicationId;
          const pub = activeEvents.find(p => p.id === pubId);
          if (!pub) return;
          
          const est = establishments.find(e => e.id === pub.establishmentId);
          if (est && v.userId && v.userId === est.ownerId) {
            return;
          }
          eventViewCounts[pubId] = (eventViewCounts[pubId] || 0) + 1;
        });

        const popularEvents = activeEvents
          .map(pub => ({
            publicationId: pub.id,
            count: eventViewCounts[pub.id] || 0
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
  }, [establishments, publications, reviews, recalcTrigger]);

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

  // Get recent 5-star reviews on popular establishments (averageRating top 6)
  const popularEstsList = [...establishments]
    .filter(e => e.status === 'valide')
    .sort((a, b) => b.averageRating - a.averageRating);
  const popularEstIdsSet = new Set(popularEstsList.slice(0, 6).map(e => e.id));

  const popularFiveStarReviews = reviews
    .filter(r => r.rating === 5 && popularEstIdsSet.has(r.establishmentId))
    .sort((a, b) => {
      const dateA = new Date((a as any).createdAt || a.date || 0).getTime();
      const dateB = new Date((b as any).createdAt || b.date || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 6);

  // Filter based on member status if active
  const joinedEstIds = currentUser
    ? relationshipRequests
        .filter(r => (r.initiatorId === currentUser.id || r.targetId === currentUser.id) && r.status === 'acceptee')
        .map(r => r.establishmentId)
    : [];

  const filteredPublications = filterMemberOnly
    ? publications.filter(p => joinedEstIds.includes(p.establishmentId))
    : publications;

  // Group by type
  const events = filteredPublications.filter(p => p.type === 'evenement');
  const promos = filteredPublications.filter(p => p.type === 'promo' || p.type === 'bon_plan');
  const annonces = filteredPublications.filter(p => p.type === 'annonce');
  
  const topEstablishments = [...establishments]
    .filter(e => e.status === 'valide')
    .sort((a,b) => b.averageRating - a.averageRating)
    .slice(0, 5);

  const filteredEstablishments = filterMemberOnly
    ? establishments.filter(e => e.status === 'valide' && joinedEstIds.includes(e.id))
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
          <button 
            onClick={() => onNavigate?.('explore')}
            className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-sm flex items-center gap-2 mb-6"
          >
            <MapPin className="w-4 h-4" /> Explorer la carte
          </button>
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

      {/* Dynamic Widget: Recent 5-Star Reviews */}
      {popularFiveStarReviews.length > 0 && (
        <div className="px-4" id="popular-reviews-widget">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">La Crème de Zaka 🔥</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Derniers avis 5★ sur les adresses phares</p>
              </div>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3.5 px-0.5">
            {popularFiveStarReviews.map(review => {
              const est = getEst(review.establishmentId);
              if (!est) return null;
              
              // Resolve reviewer name and avatar from users list
              const reviewerUser = users?.find(u => u.id === review.clientId);
              const reviewerName = reviewerUser?.name || 'Initié Club';
              const reviewerAvatar = reviewerUser?.avatar || '';
              
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

                  {/* Footer: Establishment & Popular Badge */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-900 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-gray-900 dark:text-white truncate">
                        {est.name}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
                        📍 {est.neighborhood}
                      </div>
                    </div>
                    <span className="shrink-0 text-[8px] font-black uppercase bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900/30 flex items-center gap-0.5">
                      <span>Populaire</span>
                      <Flame className="w-2.5 h-2.5 fill-current animate-pulse" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-4 flex flex-col gap-8">
        {/* WIDGET DES DERNIERS AVIS 5 ÉTOILES */}
        {(() => {
          const popularEsts = (establishments || [])
            .filter(e => e.status === 'valide' && e.averageRating >= 4.0)
            .map(e => e.id);

          const latestFiveStarReviews = (reviews || [])
            .filter(r => r.rating === 5 && popularEsts.includes(r.establishmentId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

          if (latestFiveStarReviews.length === 0) return null;

          return (
            <section className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-orange-100/60 dark:border-orange-900/30 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-yellow-400 text-white rounded-xl flex items-center justify-center shadow-md shadow-yellow-400/20">
                  <Star className="w-5 h-5 fill-current text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-950 dark:text-white uppercase tracking-wider">Avis d'Exception 🌟</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Les derniers 5★ sur vos adresses populaires</p>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto hide-scrollbar py-1">
                {latestFiveStarReviews.map(review => {
                  const est = establishments.find(e => e.id === review.establishmentId);
                  if (!est) return null;
                  const author = users.find(u => u.id === review.clientId);
                  const authorName = author ? author.name : 'Membre Zaka+';

                  return (
                    <div 
                      key={review.id}
                      className="shrink-0 w-64 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3 cursor-pointer hover:border-orange-200 dark:hover:border-orange-950 transition-all active:scale-[0.98]"
                      onClick={() => {
                        setSelectedRankEst(est);
                      }}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full uppercase">
                            {est.category.replace(/_/g, ' ')}
                          </span>
                          <div className="flex gap-0.5 text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>

                        <h4 className="font-extrabold text-xs text-gray-950 dark:text-white truncate">{est.name}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 font-medium leading-relaxed italic">
                          💬 "{review.comment}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between text-[9px] font-bold text-gray-400">
                        <span className="text-gray-800 dark:text-gray-300 font-extrabold truncate max-w-[120px]">{authorName}</span>
                        <span>
                          {new Date(review.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* SECTION CLASSEMENTS HEBDOMADAIRES */}
        <section className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Le Top de la Semaine</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Découvrez nos classements mis à jour quotidiennement
              </p>
            </div>
            {rankings?.updatedAt && (
              <span className="text-[10px] self-start sm:self-center font-bold px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/40">
                🔄 Mis à jour aujourd'hui
              </span>
            )}
          </div>

          {/* Tabs navigation */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setActiveRankTab('views')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                activeRankTab === 'views'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">👁️</span>
              <span>Plus vus</span>
            </button>
            <button
              onClick={() => setActiveRankTab('rating')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                activeRankTab === 'rating'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">⭐</span>
              <span>Mieux notés</span>
            </button>
            <button
              onClick={() => setActiveRankTab('events')}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                activeRankTab === 'events'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">🔥</span>
              <span>Ça bouge</span>
            </button>
          </div>

          {/* Rankings List */}
          {isRankingsLoading ? (
            <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
              Chargement des classements en cours...
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeRankTab === 'views' && (
                <>
                  {(!rankings?.mostViewed || rankings.mostViewed.length === 0) ? (
                    <div className="text-center py-8 text-xs text-gray-500">
                      Aucune donnée de visite récente pour le moment.
                    </div>
                  ) : (
                    rankings.mostViewed.map((item, index) => {
                      const est = getEst(item.establishmentId);
                      if (!est) return null;
                      const imageUrl = est.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400';
                      return (
                        <div
                          key={est.id}
                          onClick={() => setSelectedRankEst(est)}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 dark:border-gray-900 hover:border-orange-100 hover:bg-orange-50/20 transition-all cursor-pointer group"
                        >
                          {/* Rank badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                            index === 1 ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-300' :
                            index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' :
                            'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                          }`}>
                            {index === 0 ? '👑' : index + 1}
                          </div>

                          {/* Photo */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors truncate text-sm sm:text-base">{est.name}</h4>
                              {index === 0 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 uppercase animate-bounce">
                                  #1 cette semaine
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 capitalize truncate mt-0.5">
                              {est.category.replace(/_/g, ' ')} • {est.neighborhood}
                            </p>
                          </div>

                          {/* Count Metric badge */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                              {item.count} vue{item.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeRankTab === 'rating' && (
                <>
                  {(!rankings?.bestRated || rankings.bestRated.length === 0) ? (
                    <div className="text-center py-8 text-xs text-gray-500">
                      Pas assez d'avis pour établir le classement (seuil : 3 avis minimum).
                    </div>
                  ) : (
                    rankings.bestRated.map((item, index) => {
                      const est = getEst(item.establishmentId);
                      if (!est) return null;
                      const imageUrl = est.photos?.[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400';
                      return (
                        <div
                          key={est.id}
                          onClick={() => setSelectedRankEst(est)}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 dark:border-gray-900 hover:border-orange-100 hover:bg-orange-50/20 transition-all cursor-pointer group"
                        >
                          {/* Rank badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                            index === 1 ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-300' :
                            index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' :
                            'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                          }`}>
                            {index === 0 ? '👑' : index + 1}
                          </div>

                          {/* Photo */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img src={imageUrl} alt={est.name} className="w-full h-full object-cover" />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors truncate text-sm sm:text-base">{est.name}</h4>
                              {index === 0 && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 uppercase">
                                  mieux noté
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 capitalize truncate mt-0.5">
                              {est.category.replace(/_/g, ' ')} • {est.neighborhood}
                            </p>
                          </div>

                          {/* Metric Rating badge */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs font-extrabold text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 font-bold">
                              {item.reviewsCount} avis
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activeRankTab === 'events' && (
                <>
                  {(!rankings?.popularEvents || rankings.popularEvents.length === 0) ? (
                    <div className="text-center py-8 text-xs text-gray-500">
                      Aucun événement en cours ou à venir à afficher cette semaine.
                    </div>
                  ) : (
                    rankings.popularEvents.map((item, index) => {
                      const pub = publications.find(p => p.id === item.publicationId);
                      if (!pub) return null;
                      const est = getEst(pub.establishmentId);
                      const imageUrl = pub.imageUrl || (est?.photos?.[0]) || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=400';
                      return (
                        <div
                          key={pub.id}
                          onClick={() => setSelectedPub(pub)}
                          className="flex items-center gap-4 p-3 rounded-2xl border border-gray-50 dark:border-gray-900 hover:border-orange-100 hover:bg-orange-50/20 transition-all cursor-pointer group"
                        >
                          {/* Rank badge */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                            index === 1 ? 'bg-slate-100 text-slate-700 ring-2 ring-slate-300' :
                            index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' :
                            'bg-gray-50 text-gray-400 dark:bg-gray-900 dark:text-gray-500'
                          }`}>
                            {index === 0 ? '👑' : index + 1}
                          </div>

                          {/* Photo */}
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                            <img src={imageUrl} alt={pub.title} className="w-full h-full object-cover" />
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors truncate text-sm sm:text-base">{pub.title}</h4>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5 font-bold">
                              Chez {est?.name || 'Partenaire'} • {pub.startDate ? new Date(pub.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'Cette semaine'}
                            </p>
                          </div>

                          {/* Metric Pop badge */}
                          <div className="flex flex-col items-end flex-shrink-0">
                            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                              {item.count} clic{item.count > 1 ? 's' : ''}/vue{item.count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          )}

          {/* Simulation/Test panel helper */}
          <div className="mt-6 border-t border-gray-100 dark:border-gray-900 pt-4">
            <button
              onClick={() => {
                setShowSimPanel(!showSimPanel);
                setSimMessage(null);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold flex items-center gap-1.5"
            >
              <span>🛠️</span>
              <span>{showSimPanel ? "Masquer le simulateur de test" : "Afficher le simulateur de test (vues / exclusions Gérant)"}</span>
            </button>

            {showSimPanel && (
              <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Simulateur de Données de Classement</h4>
                <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
                  Utilisez ces boutons pour simuler des vues ou avis conformément aux tests requis, puis cliquez sur "Forcer la mise à jour".
                </p>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => handleSimulateViews(true)}
                    className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    +6 Vues Récentes (&lt;7j)
                  </button>
                  <button
                    onClick={() => handleSimulateViews(false)}
                    className="px-2.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    +6 Vues Anciennes (&gt;7j)
                  </button>
                  <button
                    onClick={handleSimulateOwnerView}
                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    Vue Gérant (Exclue)
                  </button>
                  <button
                    onClick={handleForceRecalculate}
                    className="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    🔄 Forcer la mise à jour
                  </button>
                </div>

                {simMessage && (
                  <div className="p-2 bg-white dark:bg-gray-950 rounded-lg text-[11px] font-semibold text-orange-600 border border-orange-100 dark:border-orange-950/40">
                    {simMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

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
          
          {filterMemberOnly && (
            <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 font-bold px-2.5 py-1 rounded-full animate-pulse">
              Filtre membre actif
            </span>
          )}
        </div>

        {filterMemberOnly && filteredPublications.length === 0 && (
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
                        <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                          <span className="bg-red-500 text-white text-[10px] uppercase tracking-wider font-black px-3 py-1.5 rounded-lg shadow-xs">
                            Événement
                          </span>
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
                          <div className="absolute top-2.5 left-2.5 flex gap-1 items-center">
                            <span className="bg-red-500 text-white text-[9px] uppercase tracking-wider font-black px-2 py-1 rounded-md shadow-xs">
                              Événement
                            </span>
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
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-[11px] font-black text-blue-600 uppercase tracking-wide">{publisher.name}</div>
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
                  <div key={promo.id} onClick={() => setSelectedPub(promo)} className="bg-white rounded-2xl shadow-sm border border-orange-100 hover:border-orange-300 transition-colors p-4 flex gap-4 cursor-pointer relative overflow-hidden">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex-shrink-0 flex items-center justify-center border border-orange-200/50">
                      <Tag className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="text-[11px] font-black text-orange-600 uppercase tracking-wide">{publisher.name}</div>
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

                  <div className="text-gray-600 text-sm mb-5 leading-relaxed prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedPub.description }} />
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

            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex-shrink-0 flex gap-3">
              <button
                onClick={() => setSelectedPub(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs text-center"
              >
                Fermer
              </button>
              {onStartChat && (
                <button
                  onClick={() => {
                    const estId = selectedPub.establishmentId;
                    setSelectedPub(null);
                    onStartChat(estId);
                  }}
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  {getPublisher(selectedPub.establishmentId).isEntreprise ? "Contacter le partenaire" : "Contacter l'établissement"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRankEst && (
        <EstablishmentDetailModal
          establishment={selectedRankEst}
          onClose={() => setSelectedRankEst(null)}
        />
      )}
    </div>
  );
}
