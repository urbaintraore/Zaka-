import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, calculateDistanceKm } from '../store';
import { CATEGORIES_LIST, Category, Establishment, getCategoryLabel, ArtistProfile } from '../types';
import { Search, MapPin, Star, Calendar, MessageSquare, Tag, Phone, Sparkles, Filter, SlidersHorizontal, Map, Grid, Crosshair, HelpCircle, Heart, Users, UserPlus, Check, Clock, X, Mic, Music, ArrowRight, ExternalLink } from 'lucide-react';
import { RateVisitedEstablishmentModal } from '../components/RateVisitedEstablishmentModal';
import { fetchAllArtists } from '../lib/artistService';

export function ExploreView() {
  const navigate = useNavigate();
  const { establishments, toggleFavorite, favorites, currentUser, addReservation, userLocation, setUserLocation, users, relationshipRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest, friendships } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [exploreTab, setExploreTab] = useState<'establishments' | 'members' | 'artists'>('establishments');
  const [artistsList, setArtistsList] = useState<ArtistProfile[]>([]);
  const [artistCategoryFilter, setArtistCategoryFilter] = useState('Tous');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [ratingEstModal, setRatingEstModal] = useState<Establishment | null>(null);
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'rating' | 'distance'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  // Selected map establishment preview
  const [selectedMapEst, setSelectedMapEst] = useState<Establishment | null>(null);

  // Reservation modal state
  const [resModalEst, setResModalEst] = useState<Establishment | null>(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('19:30');
  const [resGuests, setResGuests] = useState(2);
  const [resSuccessMessage, setResSuccessMessage] = useState('');

  // Automatically request geolocation or load saved
  useEffect(() => {
    if (userLocation) {
      setSortBy('distance');
    }
  }, [userLocation]);

  useEffect(() => {
    fetchAllArtists().then(list => setArtistsList(list));
  }, []);

  const handleActivateGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSortBy('distance');
        },
        (error) => {
          console.error("Erreur de géolocalisation:", error);
          // Fallback center of Ouagadougou
          setUserLocation({ lat: 12.368, lng: -1.523 });
          setSortBy('distance');
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const getPriceCategory = (priceStr?: string) => {
    if (!priceStr) return 'medium';
    const clean = priceStr.replace(/\s/g, '').replace('FCFA', '');
    const parts = clean.split('-');
    const minPrice = parseInt(parts[0]) || 0;
    if (minPrice < 5000) return 'low';
    if (minPrice < 15000) return 'medium';
    return 'high';
  };

  // Convert lat/lng to percentage coordinates on map box (bounded for Ouagadougou)
  const getMapCoords = (lat?: number, lng?: number) => {
    const minLat = 12.30;
    const maxLat = 12.42;
    const minLng = -1.56;
    const maxLng = -1.45;
    
    const l = lat || 12.368;
    const g = lng || -1.523;
    
    // Y percentage (lat goes bottom-up, so invert it)
    const y = 100 - ((l - minLat) / (maxLat - minLat)) * 100;
    // X percentage
    const x = ((g - minLng) / (maxLng - minLng)) * 100;
    
    return { 
      x: Math.max(8, Math.min(92, x)), 
      y: Math.max(8, Math.min(92, y)) 
    };
  };

  // Filter establishments
  const filtered = establishments.filter(est => {
    const matchesCategory = selectedCategory === 'all' || est.category === selectedCategory;
    const matchesCity = selectedCity === 'all' || est.city === selectedCity;
    const matchesSearch = 
      est.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (est.tags && est.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
      
    const matchesPrice = priceFilter === 'all' || getPriceCategory(est.priceLevel) === priceFilter;
    const matchesRating = ratingFilter === 'all' || (est.rating || 0) >= Number(ratingFilter);
    
    return matchesCategory && matchesCity && matchesSearch && matchesPrice && matchesRating;
  });

  // Sort establishments
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'distance' && userLocation) {
      const distA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.lat || 12.37, a.lng || -1.52);
      const distB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.lat || 12.37, b.lng || -1.52);
      return distA - distB;
    }
    return 0; // default order
  });

  const handleMakeReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resModalEst) return;

    addReservation({
      establishmentId: resModalEst.id,
      establishmentName: resModalEst.name,
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Visiteur Zaka',
      clientId: currentUser?.id || 'u-1',
      date: resDate || new Date().toISOString().split('T')[0],
      time: resTime,
      guestsCount: resGuests,
      status: 'pending'
    });

    setResSuccessMessage(`Réservation envoyée à ${resModalEst.name} pour le ${resDate} à ${resTime} (${resGuests} pers.) !`);
    setTimeout(() => {
      setResSuccessMessage('');
      setResModalEst(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Search & Hero Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-600/10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} className="animate-pulse" /> Explorer le Burkina Faso
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mb-2">Trouvez les meilleurs maquis, restaurants & hôtels</h1>
          <p className="text-orange-100 text-xs sm:text-sm font-medium mb-6">
            Découvrez les adresses tendances, réservez votre table en direct et profitez des privilèges exclusifs.
          </p>

          {/* Search Bar & Primary Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 bg-white/10 p-1.5 backdrop-blur-md rounded-2xl border border-white/20">
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un lieu, quartier, tag (ex: #Piscine, #Grillades)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl px-3 py-2.5 text-xs font-bold outline-none cursor-pointer border-r border-transparent"
                >
                  <option value="all">📍 Toutes villes</option>
                  <option value="Ouagadougou">Ouagadougou</option>
                  <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                  <option value="Koudougou">Koudougou</option>
                </select>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showFilters 
                      ? 'bg-white text-orange-600 border-white' 
                      : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
                  }`}
                  title="Filtres avancés"
                >
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Filtres</span>
                </button>
              </div>
            </div>

            {/* Geolocation Activation Prompt */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/10 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <MapPin size={16} className="text-amber-300 animate-bounce" />
                <span>
                  {userLocation 
                    ? `Géolocalisation activée (${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)})` 
                    : 'Activez votre position pour voir les établissements les plus proches de vous.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleActivateGeolocation}
                className="px-3 py-1.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-[11px] font-black uppercase transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Crosshair size={13} />
                <span>{userLocation ? 'Mettre à jour' : 'Me géolocaliser'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Sub-Tabs: Establishments vs Members vs Artists */}
      <div className="flex bg-gray-100 dark:bg-gray-850 p-1 rounded-2xl max-w-lg mx-auto">
        <button
          onClick={() => setExploreTab('establishments')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreTab === 'establishments'
              ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-sm font-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <MapPin size={15} />
          <span className="truncate">Lieux</span>
        </button>
        <button
          onClick={() => setExploreTab('members')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreTab === 'members'
              ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-sm font-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Users size={15} />
          <span className="truncate">Membres</span>
        </button>
        <button
          onClick={() => setExploreTab('artists')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            exploreTab === 'artists'
              ? 'bg-white dark:bg-gray-900 text-orange-600 shadow-sm font-black'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Mic size={15} />
          <span className="truncate">Artistes 🎤</span>
        </button>
      </div>

      {exploreTab === 'members' ? (
        <div className="space-y-6">
          {/* Incoming Friend Requests */}
          {(() => {
            const incomingRequests = currentUser ? (relationshipRequests || []).filter(r => r.type === 'friend' && r.toUserId === currentUser.id && r.status === 'pending') : [];
            if (incomingRequests.length === 0) return null;
            return (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-3xl p-5 border border-amber-200 dark:border-amber-800/40 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-orange-600" size={20} />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">Demandes d'amitié reçues ({incomingRequests.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {incomingRequests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {req.fromUserName ? req.fromUserName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{req.fromUserName}</p>
                          <p className="text-[10px] text-gray-500">Souhaite rejoindre votre réseau</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => acceptFriendRequest(req.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Check size={14} />
                          <span>Accepter</span>
                        </button>
                        <button
                          onClick={() => declineFriendRequest(req.id)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X size={14} />
                          <span>Refuser</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Member Directory */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Annuaire des Membres Zaka+</h3>
                <p className="text-xs text-gray-500">Explorez la communauté, envoyez des demandes d'amitié et tissez des liens.</p>
              </div>
              <div className="w-full sm:w-72 flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3.5 py-2.5 rounded-2xl border border-gray-200/80 dark:border-gray-800">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="w-full bg-transparent text-xs font-medium outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {(() => {
                const confirmedFriendIds = new Set(
                  (friendships || [])
                    .filter(f => f.status === 'accepted' && (f.user1Id === currentUser?.id || f.user2Id === currentUser?.id))
                    .map(f => f.user1Id === currentUser?.id ? f.user2Id : f.user1Id)
                );
                const sentRequestUserIds = new Set(
                  (relationshipRequests || [])
                    .filter(r => r.type === 'friend' && r.fromUserId === currentUser?.id && r.status === 'pending')
                    .map(r => r.toUserId)
                );
                const incomingIds = new Set(
                  (relationshipRequests || [])
                    .filter(r => r.type === 'friend' && r.toUserId === currentUser?.id && r.status === 'pending')
                    .map(r => r.fromUserId)
                );

                const filteredMembers = (users || []).filter(u => {
                  if (u.id === currentUser?.id) return false;
                  return (
                    (u.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                    (u.city || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
                    (u.role || '').toLowerCase().includes(memberSearch.toLowerCase())
                  );
                });

                if (filteredMembers.length === 0) {
                  return (
                    <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                      Aucun membre trouvé pour cette recherche.
                    </div>
                  );
                }

                return filteredMembers.map(u => {
                  const isFriend = confirmedFriendIds.has(u.id);
                  const hasSent = sentRequestUserIds.has(u.id);
                  const hasReceived = incomingIds.has(u.id);

                  return (
                    <div key={u.id} className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-800 flex flex-col justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-orange-600/10 shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 capitalize">{u.role || 'client'} • {u.city || 'Ouagadougou'}</p>
                          {u.phone && <p className="text-[10px] text-gray-400 mt-0.5">📞 {u.phone}</p>}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-lg">
                          ⭐ {u.points || 0} pts
                        </span>

                        {isFriend ? (
                          <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] rounded-xl flex items-center gap-1">
                            <Check size={13} />
                            <span>Ami(e)</span>
                          </span>
                        ) : hasSent ? (
                          <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-[11px] rounded-xl flex items-center gap-1">
                            <Clock size={13} />
                            <span>Demande envoyée</span>
                          </span>
                        ) : hasReceived ? (
                          <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 font-bold text-[11px] rounded-xl">
                            Demande reçue
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(u.id)}
                            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <UserPlus size={13} />
                            <span>Ajouter en ami</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      ) : exploreTab === 'artists' ? (
        <div className="space-y-6">
          {/* Artist Promotion / Header Banner */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-6 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full inline-block mb-2">
                🎤 Scène Artistique Zaka+
              </span>
              <h3 className="text-xl sm:text-2xl font-black">Découvrez & Réservez les Talents</h3>
              <p className="text-xs sm:text-sm text-orange-100 mt-1 max-w-xl">
                Chanteurs, DJs, humoristes, groupes live : trouvez les meilleurs artistes pour animer vos événements, soirées privées et établissements.
              </p>
            </div>
            {currentUser?.role === 'artiste' ? (
              <button
                onClick={() => navigate('/artist-dashboard')}
                className="px-5 py-3 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl text-xs font-black uppercase tracking-wide transition-all shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <Mic size={16} />
                <span>Mon Espace Artiste</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/profile')}
                className="px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-2xl text-xs font-black uppercase tracking-wide transition-all border border-white/30 flex items-center gap-2 cursor-pointer flex-shrink-0"
              >
                <span>Vous êtes artiste ? Rejoignez-nous</span>
              </button>
            )}
          </div>

          {/* Artist Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {['Tous', 'Chanteur / Chanteuse', 'DJ', 'Troupe de danse', 'Humoriste', 'Musicien live', 'Slameur / Poète'].map(cat => (
              <button
                key={cat}
                onClick={() => setArtistCategoryFilter(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  artistCategoryFilter === cat
                    ? 'bg-orange-600 text-white shadow-xs font-black'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Artist Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {artistsList
              .filter(a => artistCategoryFilter === 'Tous' || a.categorieArtistique === artistCategoryFilter)
              .filter(a => !searchTerm || a.nomArtiste.toLowerCase().includes(searchTerm.toLowerCase()) || (a.biographie && a.biographie.toLowerCase().includes(searchTerm.toLowerCase())))
              .map(art => (
                <div
                  key={art.id}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-850">
                    <img
                      src={art.photoProfil || art.photoCouverture || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'}
                      alt={art.nomArtiste}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="bg-orange-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-xs flex items-center gap-1">
                        <Mic size={10} />
                        {art.categorieArtistique}
                      </span>
                    </div>

                    {art.verificationStatus === 'verified' && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          ✓ Vérifié
                        </span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h4 className="text-lg font-black tracking-tight">{art.nomArtiste}</h4>
                      <p className="text-xs text-orange-200 flex items-center gap-1">
                        <MapPin size={11} /> {art.ville}, {art.pays}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {art.biographie}
                    </p>

                    {art.genres && art.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {art.genres.slice(0, 3).map((g, idx) => (
                          <span key={idx} className="text-[10px] font-bold bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                        <span className="font-extrabold text-gray-900 dark:text-white">{art.followersCount || 0}</span> abonnés
                      </div>

                      <button
                        onClick={() => navigate(`/artist/${art.id}`)}
                        className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Voir profil</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <>
          {/* Advanced Filters Drawer/Panel */}
      {showFilters && (
        <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm animate-fadeIn">
          {/* Price Level */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Gamme de Prix</label>
            <div className="flex bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border border-gray-200/60 dark:border-gray-800">
              {['all', 'low', 'medium', 'high'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriceFilter(p as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
                    priceFilter === p 
                      ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-2xs font-black' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {p === 'all' ? 'Toutes' : p === 'low' ? 'Éco' : p === 'medium' ? 'Moy' : 'Lux'}
                </button>
              ))}
            </div>
          </div>

          {/* Average Rating */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Note Minimale</label>
            <div className="flex bg-gray-50 dark:bg-gray-950 p-1 rounded-xl border border-gray-200/60 dark:border-gray-800">
              {['all', 4.0, 4.5, 4.8].map(r => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition-all ${
                    ratingFilter === r 
                      ? 'bg-white dark:bg-gray-900 text-orange-600 dark:text-orange-400 shadow-2xs font-black' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {r === 'all' ? 'Toutes' : `★ ${r}`}
                </button>
              ))}
            </div>
          </div>

          {/* Sort selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Trier les résultats</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              disabled={sortBy === 'distance' && !userLocation}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200/60 dark:border-gray-800 focus:outline-none focus:border-orange-500 cursor-pointer disabled:opacity-50"
            >
              <option value="default">🏷️ Par défaut</option>
              <option value="rating">⭐️ Meilleures notes</option>
              <option value="distance" disabled={!userLocation}>🚗 Les plus proches (GPS requis)</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Bar: Layout mode switch (Grid vs Map) & Category Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3">
        {/* Category Horizontal Filter Pills */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50'
              }`}
            >
              🔥 Tout voir
            </button>
            {CATEGORIES_LIST.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-800 hover:bg-gray-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout Switch Option */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Grid size={14} />
            <span>Mosaïque ({sorted.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Map size={14} />
            <span>Carte Interactive</span>
          </button>
        </div>
      </div>

      {/* RENDER GRID MODE */}
      {viewMode === 'grid' ? (
        sorted.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
              <Search size={28} />
            </div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Aucun établissement trouvé</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Essayez de modifier vos filtres, de changer de ville ou de vider votre champ de recherche.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sorted.map(est => {
              const isFav = favorites.includes(est.id);
              const distance = userLocation 
                ? calculateDistanceKm(userLocation.lat, userLocation.lng, est.lat || 12.368, est.lng || -1.523) 
                : null;

              return (
                <div key={est.id} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={est.photoUrl} 
                        alt={est.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                      
                      {/* Category Pill */}
                      <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-full text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wider shadow-xs">
                        {getCategoryLabel(est.category)}
                      </span>

                      {/* Favorite Button */}
                      <button
                        onClick={() => toggleFavorite(est.id)}
                        className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                          isFav 
                            ? 'bg-red-500 text-white shadow-md' 
                            : 'bg-black/30 text-white hover:bg-white hover:text-red-500'
                        }`}
                        title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart size={16} className={isFav ? 'fill-current text-white' : ''} />
                      </button>

                      {/* Location & Distance Badge */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-xs font-bold text-gray-200">
                            <MapPin size={14} className="text-orange-400" />
                            <span>{est.neighborhood}, {est.city}</span>
                          </div>
                          {distance !== null && (
                            <span className="text-[10px] font-extrabold text-orange-400 mt-0.5">
                              🚀 À {distance} km de vous
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-xs px-2.5 py-0.5 rounded-lg text-xs font-black shadow-xs shrink-0 self-end">
                          <Star size={12} className="fill-white" />
                          <span>{est.rating || '4.8'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-base font-black text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                        {est.name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {est.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {est.priceLevel && (
                          <div className="text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-md">
                            💰 {est.priceLevel}
                          </div>
                        )}
                        {est.tags && est.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setResModalEst(est)}
                      className="py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Calendar size={14} />
                      <span>Réserver</span>
                    </button>
                    <button
                      onClick={() => setRatingEstModal(est)}
                      className="py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Laisser un avis</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* RENDER MAP MODE (STYLIZED VECTOR CANVAS MAP) */
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md p-4 space-y-4">
            
            {/* Map Header Instructions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Map size={16} className="text-orange-600" />
                  Carte Interactive de Ouagadougou
                </h3>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
                  Cliquez sur un repère coloré pour voir les détails d'un établissement et faire une réservation.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-orange-600" /> Maquis
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" /> Hôtels
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Piscines
                </span>
              </div>
            </div>

            {/* Interactive Vector Canvas Container */}
            <div className="w-full h-[480px] bg-amber-50/20 dark:bg-gray-950 border border-gray-200/80 dark:border-gray-800 rounded-2xl relative overflow-hidden flex flex-col justify-end">
              
              {/* Outer grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

              {/* Stylized streets as SVG overlays */}
              <svg className="absolute inset-0 w-full h-full text-gray-200/50 dark:text-gray-800/40 pointer-events-none" stroke="currentColor" strokeWidth="2.5" fill="none">
                {/* Blvd Circulaire */}
                <path d="M 50,50 A 40,40 0 1,0 150,150" className="opacity-70" strokeDasharray="4,4" />
                {/* Avenue Kwame Nkrumah */}
                <line x1="10%" y1="10%" x2="90%" y2="90%" />
                <line x1="90%" y1="10%" x2="10%" y2="90%" />
                <line x1="50%" y1="0%" x2="50%" y2="100%" strokeWidth="1.5" />
                <line x1="0%" y1="50%" x2="100%" y2="50%" strokeWidth="1.5" />
              </svg>

              {/* Neighborhoods stylized annotations */}
              <div className="absolute top-12 left-[15%] text-[9px] font-black text-gray-400 uppercase tracking-widest pointer-events-none select-none opacity-40">Somgandé</div>
              <div className="absolute top-1/4 right-[12%] text-[9px] font-black text-gray-400 uppercase tracking-widest pointer-events-none select-none opacity-40">Dassasgho</div>
              <div className="absolute bottom-16 left-[18%] text-[9px] font-black text-gray-400 uppercase tracking-widest pointer-events-none select-none opacity-40">Patte d'Oie</div>
              <div className="absolute bottom-24 right-[15%] text-[9px] font-black text-gray-400 uppercase tracking-widest pointer-events-none select-none opacity-40">Ouaga 2000</div>
              <div className="absolute top-1/2 left-[38%] text-[10px] font-black text-orange-500/50 uppercase tracking-widest pointer-events-none select-none">Koulouba (Centre)</div>

              {/* Pulse Marker for User Geolocation */}
              {userLocation && (() => {
                const { x, y } = getMapCoords(userLocation.lat, userLocation.lng);
                return (
                  <div 
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-30"
                    title="Votre position GPS"
                  >
                    <div className="relative flex items-center justify-center">
                      <span className="absolute inline-flex h-6 w-6 rounded-full bg-blue-500 opacity-45 animate-ping" />
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border border-white shadow-md shadow-blue-500/40" />
                    </div>
                  </div>
                );
              })()}

              {/* Pins for filtered establishments */}
              {sorted.map(est => {
                const { x, y } = getMapCoords(est.lat, est.lng);
                const isSelected = selectedMapEst?.id === est.id;

                const getPinColor = (cat: string) => {
                  switch (cat) {
                    case 'piscine': return 'bg-blue-500 text-white border-blue-600 shadow-blue-500/20';
                    case 'hotel': return 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20';
                    case 'restaurant': return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20';
                    case 'salon_coiffure': return 'bg-pink-500 text-white border-pink-600 shadow-pink-500/20';
                    default: return 'bg-orange-600 text-white border-orange-700 shadow-orange-600/20';
                  }
                };

                const getPinIcon = (cat: string) => {
                  switch (cat) {
                    case 'piscine': return '🏊';
                    case 'hotel': return '🏨';
                    case 'restaurant': return '🍽️';
                    case 'salon_coiffure': return '💇';
                    default: return '🍹';
                  }
                };

                return (
                  <button
                    key={est.id}
                    onClick={() => setSelectedMapEst(est)}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group cursor-pointer transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* Tooltip on hover */}
                    <span className="absolute bottom-full mb-1 bg-gray-900/90 backdrop-blur-xs text-[10px] font-black text-white px-2 py-0.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      {est.name}
                    </span>

                    {/* Styled Pin Marker */}
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm shadow-md transition-all ${getPinColor(est.category)} ${
                      isSelected ? 'ring-4 ring-orange-400/50 scale-110' : ''
                    }`}>
                      {getPinIcon(est.category)}
                    </div>
                  </button>
                );
              })}

              {/* Selected Establishment bottom-sheet preview overlay */}
              {selectedMapEst && (() => {
                const isFav = favorites.includes(selectedMapEst.id);
                const distance = userLocation 
                  ? calculateDistanceKm(userLocation.lat, userLocation.lng, selectedMapEst.lat || 12.368, selectedMapEst.lng || -1.523) 
                  : null;

                return (
                  <div className="absolute left-3 right-3 bottom-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl p-4 flex gap-4 items-center animate-slideUp z-40 max-w-lg mx-auto">
                    <img 
                      src={selectedMapEst.photoUrl} 
                      alt={selectedMapEst.name} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0" 
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-black text-xs text-gray-900 dark:text-white truncate">{selectedMapEst.name}</h4>
                        <button
                          onClick={() => toggleFavorite(selectedMapEst.id)}
                          className={`text-gray-400 hover:text-red-500 cursor-pointer ${isFav ? 'text-red-500' : ''}`}
                        >
                          <Heart size={14} className={isFav ? 'fill-current' : ''} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mb-1.5">{selectedMapEst.neighborhood}, {selectedMapEst.city}</p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded">
                          ★ {selectedMapEst.rating || '4.8'}
                        </span>
                        {distance !== null && (
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                            🚗 À {distance} km
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => setResModalEst(selectedMapEst)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Calendar size={12} />
                        <span>Réserver</span>
                      </button>
                      <button
                        onClick={() => setSelectedMapEst(null)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-850 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl text-[10px] font-black cursor-pointer"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {ratingEstModal && (
        <RateVisitedEstablishmentModal
          isOpen={true}
          establishment={ratingEstModal}
          onClose={() => setRatingEstModal(null)}
        />
      )}

      {/* Quick Table Reservation Modal */}
      {resModalEst && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Réserver une table</h3>
            <p className="text-xs font-bold text-orange-600">{resModalEst.name}</p>

            {resSuccessMessage ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold text-center border border-emerald-200 animate-pulse">
                {resSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleMakeReservation} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">Date de réservation</label>
                  <input
                    type="date"
                    required
                    value={resDate}
                    onChange={e => setResDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Heure</label>
                    <input
                      type="time"
                      required
                      value={resTime}
                      onChange={e => setResTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nombre de personnes</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={resGuests}
                      onChange={e => setResGuests(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResModalEst(null)}
                    className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/15 cursor-pointer"
                  >
                    Confirmer la réservation
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
