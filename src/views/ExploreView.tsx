import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Search, MapPin, MessageSquare, Calendar, Heart, Share2, List, Map as MapIcon, Clock } from 'lucide-react';
import { ReservationModal } from '../components/ReservationModal';
import { EstablishmentDetailModal } from '../components/EstablishmentDetailModal';
import { getDistance } from '../utils/distance';
import { getCurrentUserLocation } from '../utils/geolocation';
import { shareContent } from '../utils/platform';
import { MapView } from '../components/MapView';
import { Establishment } from '../types';
import { HeartButton } from '../components/HeartButton';

function isEstablishmentOpen(openingHours?: string): boolean {
  if (!openingHours) return true;
  try {
    const cleanHours = openingHours.toLowerCase().trim();
    if (cleanHours.includes('24h') || cleanHours.includes('24/7') || cleanHours.includes('toujours')) return true;
    const parts = cleanHours.split(/[-–]/);
    if (parts.length !== 2) return true;
    const parseTime = (str: string): number => {
      const cleanStr = str.replace(/[h:]/g, ' ').trim();
      const timeParts = cleanStr.split(/\s+/);
      const hours = parseInt(timeParts[0]) || 0;
      const minutes = parseInt(timeParts[1]) || 0;
      return hours * 60 + minutes;
    };
    const startMinutes = parseTime(parts[0]);
    const endMinutes = parseTime(parts[1]);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  } catch (e) {
    return true;
  }
}

function getPriceLevel(est: Establishment): 'low' | 'medium' | 'high' {
  const desc = (est.description || '').toLowerCase();
  const name = (est.name || '').toLowerCase();
  const tags = (est.tags || []).map(t => t.toLowerCase());
  if (
    desc.includes('luxe') || 
    desc.includes('vip') || 
    desc.includes('gastronomique') || 
    desc.includes('prestige') ||
    desc.includes('haut de gamme') ||
    tags.includes('luxe') ||
    tags.includes('chic') ||
    est.category === 'hotel' ||
    est.category === 'residence'
  ) {
    return 'high';
  }
  if (
    desc.includes('économique') || 
    desc.includes('populaire') || 
    desc.includes('pas cher') || 
    desc.includes('braisé') || 
    desc.includes('abordable') ||
    name.includes('kiosque') ||
    tags.includes('économique') ||
    tags.includes('abordable') ||
    est.category === 'maquis'
  ) {
    return 'low';
  }
  return 'medium';
}

interface ExploreViewProps {
  onStartChat?: (estId: string, recipient?: 'gerant' | 'dj') => void;
  onNavigate?: (tab: any) => void;
}

export function ExploreView({ onStartChat, onNavigate }: ExploreViewProps) {
  const { establishments, currentUser, relationshipRequests, createRelationshipRequest, createServiceRequest, setGlobalError, users, favorites, toggleFavorite } = useAppStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [selectedEst, setSelectedEst] = useState<Establishment | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [filterByProximity, setFilterByProximity] = useState(false);

  useEffect(() => {
    getCurrentUserLocation()
      .then((loc) => {
        setUserLocation(loc);
      })
      .catch((error) => {
        console.warn("Could not retrieve geolocation:", error.message || error);
      });
  }, []);

  const handleReservationSubmit = (data: { reservationType: string, date: string, time: string, guests: number, details: string }) => {
    if (!currentUser || !selectedEst) return;
    
    const isAnniv = data.reservationType === 'anniversaire';
    
    createServiceRequest({
      clientId: currentUser.id,
      establishmentId: selectedEst.id,
      type: isAnniv ? 'anniversaire' : 'reservation',
      details: `Date: ${data.date} à ${data.time} | Places: ${data.guests} | Type: ${data.reservationType}${data.details ? ` | Note: ${data.details}` : ''}`
    });
  };

  const filtered = establishments.filter(est => {
    if (est.status === 'suspendu') return false;
    if (category !== 'all' && est.category !== category) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = (est.name || '').toLowerCase().includes(searchLower);
      const neighborhoodMatch = (est.neighborhood || '').toLowerCase().includes(searchLower);
      const categoryMatch = (est.category || '').replace(/_/g, ' ').toLowerCase().includes(searchLower);
      const tagsMatch = est.tags && est.tags.some(tag => tag.toLowerCase().includes(searchLower));
      if (!nameMatch && !neighborhoodMatch && !categoryMatch && !tagsMatch) return false;
    }
    
    if (filterByProximity) {
      if (!est.geolocation) return false;
      if (!userLocation) return false;
      const [lat, lng] = est.geolocation.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) return false;
      const dist = getDistance(userLocation.lat, userLocation.lng, lat, lng);
      // Filter within 15 km
      if (dist > 15) return false;
    }

    // New: Open Now filter
    if (openNowFilter) {
      if (!isEstablishmentOpen(est.openingHours)) return false;
    }

    // New: Price filter
    if (priceFilter !== 'all') {
      const level = getPriceLevel(est);
      if (level !== priceFilter) return false;
    }
    
    return true;
  }).sort((a, b) => {
    if (!userLocation) return 0;
    const [aLat, aLng] = a.geolocation ? a.geolocation.split(',').map(Number) : [0, 0];
    const [bLat, bLng] = b.geolocation ? b.geolocation.split(',').map(Number) : [0, 0];
    const distA = getDistance(userLocation.lat, userLocation.lng, aLat, aLng);
    const distB = getDistance(userLocation.lat, userLocation.lng, bLat, bLng);
    return distA - distB;
  });

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher un lieu, quartier..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {['all', 'maquis', 'bar', 'restaurant', 'boite_de_nuit', 'glacier_pizzeria', 'hotel', 'residence', 'autre'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold capitalize transition-colors ${category === cat ? 'bg-orange-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-200'}`}
            >
              {cat === 'all' ? 'Tout' : cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Filtres rapides */}
        <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mr-1 tracking-wider">Filtres:</span>
          
          {/* Ouvert maintenant */}
          <button
            onClick={() => setOpenNowFilter(!openNowFilter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer ${
              openNowFilter 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400 font-black' 
                : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            Ouvert maintenant
          </button>

          {/* Prix Filter Option Group */}
          <div className="flex bg-gray-100 dark:bg-gray-900 p-0.5 rounded-xl border border-gray-150 dark:border-gray-850">
            {[
              { id: 'all', label: 'Prix : Tout' },
              { id: 'low', label: 'Abordable' },
              { id: 'medium', label: 'Moyen' },
              { id: 'high', label: 'Chic' }
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setPriceFilter(lvl.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  priceFilter === lvl.id 
                    ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs font-black' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black text-gray-900">Explorer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!userLocation) {
                try {
                  const loc = await getCurrentUserLocation();
                  setUserLocation(loc);
                  setFilterByProximity(true);
                } catch (error) {
                  alert("Pour utiliser ce filtre, veuillez autoriser l'accès à votre position géographique.");
                }
                return;
              }
              setFilterByProximity(!filterByProximity);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${filterByProximity ? 'bg-orange-50 border-orange-200 text-orange-600 font-black' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'}`}
          >
            <MapPin className="w-3.5 h-3.5" />
            À proximité
          </button>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'map' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'map' ? (
        <MapView establishments={filtered} onEstClick={(id) => console.log(id)} />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(est => {
            const djRequests = relationshipRequests.filter(r => r.establishmentId === est.id && r.status === 'acceptee' && r.isDJ);
            const djs = djRequests.map(r => {
              const djId = r.type === 'client_join' ? r.initiatorId : r.targetId;
              return users.find(u => u.id === djId);
            }).filter(Boolean);

            const handleShare = async () => {
              await shareContent({
                title: est.name,
                text: `Découvrez ${est.name} à ${est.neighborhood}`,
                url: window.location.href
              });
            };

            return (
              <div 
                key={est.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEst(est)}
              >
                <div className="h-40 bg-gray-200 relative">
                  <img src={est.photos[0] || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800'} alt={est.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-sm font-bold text-gray-900 flex items-center gap-1 shadow-sm">
                    <span className="text-yellow-500">★</span> {est.averageRating.toFixed(1)}
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    {currentUser && (
                      <HeartButton
                        isFavorite={(favorites[currentUser.id] || []).includes(est.id)}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await toggleFavorite(currentUser.id, est.id);
                        }}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all active:scale-90 text-white"
                      title="Partager"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">{est.category.replace(/_/g, ' ')}</div>
                      {est.tags && est.tags.length > 0 && (
                        <div className="flex gap-1">
                          {est.tags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[8px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg truncate">{est.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 font-medium truncate">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{est.address || est.city || ''} {est.neighborhood}</span>
                      {(() => {
                        if (!userLocation || !est.geolocation) return null;
                        const [lat, lng] = est.geolocation.split(',').map(Number);
                        if (isNaN(lat) || isNaN(lng)) return null;
                        const dist = getDistance(userLocation.lat, userLocation.lng, lat, lng);
                        return (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-orange-600 font-bold">{dist.toFixed(1)} km</span>
                          </>
                        );
                      })()}
                    </div>
                    {djs.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-purple-700 bg-purple-50/70 border border-purple-100 px-2.5 py-1 rounded-lg w-fit">
                        <span className="text-xs">🎧</span>
                        <span>DJ : {djs.map(dj => dj?.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                  {onStartChat && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end">
                      {(() => {
                        const req = relationshipRequests.find(r => r.establishmentId === est.id && (r.initiatorId === currentUser?.id || r.targetId === currentUser?.id));
                        if (!req) {
                          return (
                            <button
                              onClick={async () => {
                                if (!currentUser) {
                                  setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour rejoindre cet établissement.", type: 'info' });
                                  if (onNavigate) onNavigate('profile');
                                  return;
                                }
                                try {
                                  await createRelationshipRequest({ 
                                    initiatorId: currentUser.id, 
                                    targetId: est.ownerId, 
                                    establishmentId: est.id, 
                                    type: 'client_join' 
                                  });
                                  alert("Demande d'adhésion envoyée avec succès !");
                                } catch (err) {
                                  console.error(err);
                                  alert("Erreur lors de l'envoi de la demande.");
                                }
                              }}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                            >
                              Rejoindre
                            </button>
                          );
                        }
                        if (req.status === 'en_attente') {
                          return (
                            <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-yellow-50 text-yellow-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                              En attente
                            </span>
                          );
                        }
                        if (req.status === 'acceptee') {
                          return (
                            <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-50 text-green-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                              Membre ✓
                            </span>
                          );
                        }
                        return (
                          <span className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-red-50 text-red-600 font-bold text-xs px-3 py-2.5 rounded-xl select-none">
                            Refusé
                          </span>
                        );
                      })()}
                      {djs.length > 0 ? (
                        <>
                          <button
                            onClick={() => onStartChat(est.id, 'gerant')}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                            title="Contacter le Gérant"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Gérant
                          </button>
                          <button
                            onClick={() => onStartChat(est.id, 'dj')}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                            title="Contacter le DJ"
                          >
                            <span>🎧</span>
                            DJ
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onStartChat(est.id, 'gerant')}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Discuter
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            setGlobalError({ message: "Veuillez créer un compte ou vous connecter pour réserver.", type: 'info' });
                            if (onNavigate) onNavigate('profile');
                            return;
                          }
                          setSelectedEst(est);
                        }}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all"
                      >
                        <Calendar className="w-4 h-4" />
                        Réserver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

        {filtered.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
            Aucun résultat trouvé.
          </div>
        )}
      </div>
      )}

      {selectedEst && (
        <EstablishmentDetailModal
          establishment={selectedEst}
          onClose={() => setSelectedEst(null)}
        />
      )}
    </div>
  );
}
