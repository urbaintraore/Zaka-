import React, { useEffect, useRef, useState } from 'react';
import { GroupOuting, User, GroupOutingLocation } from '../types';
import { Navigation, MapPin, Radio, Clock, ShieldCheck, AlertCircle, RefreshCw, Compass, UserCheck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDistanceMeters, formatDistance } from './MapView';

interface GroupOutingLiveLocationProps {
  outing: GroupOuting;
  currentUser: User | null;
  updateGroupOutingLocation: (outingId: string, location: { lat: number; lng: number; isSharing: boolean }) => Promise<void>;
  venueLat?: number;
  venueLng?: number;
}

export function GroupOutingLiveLocation({
  outing,
  currentUser,
  updateGroupOutingLocation,
  venueLat = 12.3714, // Default Ouagadougou center
  venueLng = -1.5197
}: GroupOutingLiveLocationProps) {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Time window calculation: 30 minutes before until 4 hours after
  const checkTimeWindow = (): { isOpen: boolean; reason: 'too_early' | 'open' | 'ended'; minutesLeftToStart: number } => {
    try {
      const now = new Date();
      const [year, month, day] = outing.date.split('-').map(Number);
      const [hours, minutes] = (outing.time || '20:00').split(':').map(Number);

      const startDate = new Date(year, month - 1, day, hours, minutes);
      const windowOpenDate = new Date(startDate.getTime() - 30 * 60 * 1000); // 30 mins before
      const windowCloseDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000); // 4 hrs after

      if (now < windowOpenDate) {
        const diffMs = windowOpenDate.getTime() - now.getTime();
        return { isOpen: false, reason: 'too_early', minutesLeftToStart: Math.ceil(diffMs / 60000) };
      } else if (now > windowCloseDate) {
        return { isOpen: false, reason: 'ended', minutesLeftToStart: 0 };
      } else {
        return { isOpen: true, reason: 'open', minutesLeftToStart: 0 };
      }
    } catch (e) {
      return { isOpen: true, reason: 'open', minutesLeftToStart: 0 };
    }
  };

  const timeStatus = checkTimeWindow();
  const canShare = timeStatus.isOpen || testMode;

  // Active locations map
  const rawLocations = outing.liveLocations || {};
  const activeSharers: GroupOutingLocation[] = Object.values(rawLocations).filter(
    loc => loc.isSharing
  );

  // Sync my sharing state from store
  useEffect(() => {
    if (currentUser && rawLocations[currentUser.id]) {
      setIsSharing(rawLocations[currentUser.id].isSharing);
    }
  }, [outing.id, currentUser]);

  // Clean up geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [venueLat, venueLng],
        zoom: 14,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;

    if (layer) {
      layer.clearLayers();

      // 1. Destination / Venue Marker
      const venueIcon = L.divIcon({
        className: 'custom-venue-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-9 h-9 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white">
              📍
            </div>
            <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              ${outing.establishmentName || 'Lieu R-V'}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([venueLat, venueLng], { icon: venueIcon }).addTo(layer);

      // 2. Active Participants Markers
      activeSharers.forEach(sharer => {
        const isMe = currentUser?.id === sharer.userId;
        const dist = calculateDistanceMeters(sharer.lat, sharer.lng, venueLat, venueLng);
        const distText = formatDistance(dist);

        const participantIcon = L.divIcon({
          className: 'custom-participant-icon',
          html: `
            <div class="relative group">
              <div class="w-8 h-8 rounded-full ${isMe ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'} flex items-center justify-center font-extrabold text-xs shadow-md border-2 border-white">
                ${sharer.userName.charAt(0).toUpperCase()}
              </div>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-ping"></span>
              <span class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <span>${isMe ? 'Moi' : sharer.userName}</span>
                <span class="text-emerald-600 font-bold">(${distText})</span>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        L.marker([sharer.lat, sharer.lng], { icon: participantIcon }).addTo(layer);
      });

      // Fit bounds if we have sharers
      if (activeSharers.length > 0) {
        const bounds = L.latLngBounds([[venueLat, venueLng]]);
        activeSharers.forEach(s => bounds.extend([s.lat, s.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    }
  }, [outing.id, activeSharers.length, venueLat, venueLng]);

  // Handle GPS start/stop
  const handleToggleSharing = async () => {
    if (!currentUser) return;
    setGeoError(null);

    if (isSharing) {
      // Stop sharing
      setLoading(true);
      try {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        await updateGroupOutingLocation(outing.id, {
          lat: myCoords?.lat || venueLat,
          lng: myCoords?.lng || venueLng,
          isSharing: false
        });
        setIsSharing(false);
      } catch (err: any) {
        setGeoError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Start sharing
      if (!navigator.geolocation) {
        setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
        return;
      }

      setLoading(true);

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMyCoords({ lat, lng });

          try {
            await updateGroupOutingLocation(outing.id, { lat, lng, isSharing: true });
            setIsSharing(true);

            // Start continuous watch
            watchIdRef.current = navigator.geolocation.watchPosition(
              async (watchPos) => {
                const wLat = watchPos.coords.latitude;
                const wLng = watchPos.coords.longitude;
                setMyCoords({ lat: wLat, lng: wLng });
                await updateGroupOutingLocation(outing.id, { lat: wLat, lng: wLng, isSharing: true });
              },
              (err) => console.warn("Watch position err:", err.message),
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
          } catch (err: any) {
            setGeoError("Erreur d'enregistrement : " + err.message);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setLoading(false);
          setGeoError("Impossible d'obtenir votre position GPS. Activer la localisation sur votre appareil.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Simulation trigger for demo testing
  const handleSimulatePosition = async () => {
    if (!currentUser) return;
    setLoading(true);
    // Offset slightly around venue
    const simLat = venueLat + (Math.random() - 0.5) * 0.008;
    const simLng = venueLng + (Math.random() - 0.5) * 0.008;
    setMyCoords({ lat: simLat, lng: simLng });

    try {
      await updateGroupOutingLocation(outing.id, {
        lat: simLat,
        lng: simLng,
        isSharing: true
      });
      setIsSharing(true);
    } catch (err: any) {
      setGeoError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              Partage de position GPS en direct
              {isSharing && (
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Actif
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              30 min avant et pendant la sortie pour faciliter le rassemblement
            </p>
          </div>
        </div>

        {/* Test Mode Toggle */}
        <button
          onClick={() => setTestMode(!testMode)}
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all ${
            testMode
              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
          }`}
        >
          {testMode ? '🧪 Mode Test Actif' : '🧪 Tester le GPS'}
        </button>
      </div>

      {/* Time window status notice */}
      {!timeStatus.isOpen && !testMode ? (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl flex items-start gap-3 text-xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900 dark:text-amber-200">
              {timeStatus.reason === 'too_early'
                ? `Ouverture du GPS dans ${timeStatus.minutesLeftToStart} minutes`
                : 'Partage de position terminé pour cette sortie'}
            </p>
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              {timeStatus.reason === 'too_early'
                ? `Le partage de position s'activera automatiquement 30 minutes avant le début de la sortie (${outing.date} à ${outing.time}). Utilisez l'option "Tester le GPS" ci-dessus pour simuler dès maintenant.`
                : 'La fenêtre de rassemblement en direct est clôturée.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
          <span className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Rassemblement ouvert ! Position partageable en direct
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
            📍 {outing.establishmentName || 'Lieu r-v'}
          </span>
        </div>
      )}

      {/* Action Controls */}
      {canShare && (
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={handleToggleSharing}
            disabled={loading}
            className={`flex-1 w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSharing
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            <Navigation className="w-4 h-4" />
            {loading
              ? 'Mise à jour GPS...'
              : isSharing
              ? 'Arrêter le partage de ma position'
              : 'Partager ma position en direct'}
          </button>

          {testMode && (
            <button
              onClick={handleSimulatePosition}
              disabled={loading}
              className="px-3 py-2.5 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 text-xs font-extrabold rounded-xl transition-all border border-amber-300 shrink-0"
            >
              Simuler position GPS (+50m)
            </button>
          )}
        </div>
      )}

      {geoError && (
        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200">
          ⚠️ {geoError}
        </p>
      )}

      {/* Interactive Leaflet Radar / Map */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        <div ref={mapRef} className="w-full h-56 sm:h-64 z-10" />

        {/* Floating Active Sharers Badge */}
        <div className="absolute top-2 left-2 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          {activeSharers.length} membre(s) en direct
        </div>
      </div>

      {/* List of Sharers with Distances */}
      <div className="space-y-2">
        <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-amber-500" />
          Membres en route & distances au lieu de rendez-vous :
        </p>

        {activeSharers.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700">
            Aucun membre ne partage sa position en direct pour l'instant. Soyez le premier à activer votre position GPS !
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeSharers.map(s => {
              const isMe = currentUser?.id === s.userId;
              const dist = calculateDistanceMeters(s.lat, s.lng, venueLat, venueLng);
              const distStr = formatDistance(dist);
              const updatedTime = new Date(s.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={s.userId}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                        {s.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {s.userName} {isMe && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">(Moi)</span>}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        MAJ à {updatedTime}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                      📍 {distStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
