import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Establishment } from '../types';
import { MapPin, Navigation, Eye, Compass, X } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapViewProps {
  establishments: Establishment[];
  onEstClick: (id: string) => void;
  selectedCategory?: string;
}

export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function RouteDisplay({ origin, destination, onClear }: {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onClear: () => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (!routesLib || !map) return;
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING' as any,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const route = routes[0] as any;
        if (route.distanceMeters) setDistance(formatDistance(route.distanceMeters));
        if (route.durationMillis) setDuration(Math.round(route.durationMillis / 60000) + ' min');
        
        if (route.createPolylines) {
          const newPolylines = route.createPolylines();
          newPolylines.forEach((p: any) => {
            p.setOptions({ strokeColor: '#ea580c', strokeWeight: 5 });
            p.setMap(map);
          });
          polylinesRef.current = newPolylines;
        } else {
           // fallback if createPolylines doesn't exist
           const path = route.path;
           const polyline = new google.maps.Polyline({
             path,
             strokeColor: '#ea580c',
             strokeWeight: 5
           });
           polyline.setMap(map);
           polylinesRef.current = [polyline];
        }
        if (route.viewport) map.fitBounds(route.viewport, 50);
      }
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, origin, destination]);

  if (!distance) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-xl rounded-2xl px-4 py-2 border-2 border-orange-200 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="text-orange-600">
        <Navigation className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs font-black text-gray-900 dark:text-white uppercase">Trajet en cours</div>
        <div className="text-xs font-bold text-gray-500">{distance} • {duration}</div>
      </div>
      <button onClick={onClear} className="ml-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full hover:bg-gray-200 cursor-pointer">
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

const MarkerWithInfo: React.FC<{
  est: any;
  userPos: any;
  onEstClick: (id: string) => void;
  onRoute: (dest: google.maps.LatLngLiteral) => void;
}> = ({ est, userPos, onEstClick, onRoute }) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  const typeBadgeColor =
    est.category === 'maquis' ? '#ea580c' :
    est.category === 'restaurant' ? '#16a34a' :
    est.category === 'bar' ? '#2563eb' :
    est.category === 'boite_de_nuit' ? '#9333ea' : '#ea580c';

  return (
    <>
      <AdvancedMarker ref={markerRef} position={est.coords} onClick={() => setOpen(true)} title={est.name}>
        <div style={{
          backgroundColor: typeBadgeColor,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
          border: '2px solid white',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {est.name}
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div style={{ minWidth: '180px', fontFamily: 'sans-serif' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#111827' }}>{est.name}</h4>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>
              📍 À {formatDistance(est.distance)} de vous
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4b5563' }}>
              {est.address || est.quarter || 'Ouagadougou'}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => onRoute(est.coords)}
                style={{ flex: 1, backgroundColor: '#f97316', color: 'white', border: 'none', padding: '6px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <Compass style={{width: 14, height: 14}} /> Route
              </button>
              <button 
                onClick={() => onEstClick(est.id)}
                style={{ flex: 1, backgroundColor: '#1f2937', color: 'white', border: 'none', padding: '6px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                Détails
              </button>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function MapView({ establishments, onEstClick, selectedCategory }: MapViewProps) {
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral>({
    lat: 12.3714,
    lng: -1.5197, 
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeDest, setRouteDest] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Géolocalisation non supportée");
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError(null);
      },
      (err) => {
        console.warn("Initial geo error:", err.message);
        setLocationError("Position par défaut : Ouagadougou");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Watch geo error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const establishmentsWithDistance = useMemo(() => {
    const filtered = establishments.filter((est) => {
      if (!selectedCategory || selectedCategory === 'Tous') return true;
      let targetCat = selectedCategory.toLowerCase();
      if (targetCat === 'discothèque') targetCat = 'boite_de_nuit';
      return est.category?.toLowerCase() === targetCat;
    });

    return filtered.map((est) => {
      let lat = 12.3714 + (Math.random() - 0.5) * 0.05;
      let lng = -1.5197 + (Math.random() - 0.5) * 0.05;

      if (est.geolocation) {
        const parts = est.geolocation.split(',');
        if (parts.length === 2) {
          const parsedLat = Number(parts[0].trim());
          const parsedLng = Number(parts[1].trim());
          if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
            lat = parsedLat;
            lng = parsedLng;
          }
        }
      }

      const distance = calculateDistanceMeters(userPos.lat, userPos.lng, lat, lng);
      return { ...est, coords: { lat, lng }, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [establishments, selectedCategory, userPos]);

  if (!hasValidKey) {
    return (
      <div className="flex flex-col gap-4 w-full h-[380px] bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 items-center justify-center text-center">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Clé Google Maps requise</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          Pour afficher la carte et calculer les itinéraires, ajoutez votre clé API Google Maps (<code>GOOGLE_MAPS_PLATFORM_KEY</code>) dans les secrets de votre environnement.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></div>
          <div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Localisation en temps réel active
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {locationError || `${establishmentsWithDistance.length} établissement(s) à proximité`}
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-[380px] w-full rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={userPos}
            defaultZoom={14}
            mapId="ZAKA_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            disableDefaultUI={true}
            zoomControl={true}
          >
            <AdvancedMarker position={userPos} title="Vous êtes ici" zIndex={999}>
              <div style={{ width: 18, height: 18, backgroundColor: '#3b82f6', border: '3px solid white', borderRadius: '50%', boxShadow: '0 0 10px rgba(59,130,246,0.8)' }} />
            </AdvancedMarker>

            {establishmentsWithDistance.map(est => (
              <MarkerWithInfo 
                key={est.id} 
                est={est} 
                userPos={userPos} 
                onEstClick={onEstClick} 
                onRoute={setRouteDest}
              />
            ))}

            {routeDest && (
              <RouteDisplay 
                origin={userPos} 
                destination={routeDest} 
                onClear={() => setRouteDest(null)} 
              />
            )}
          </Map>
        </APIProvider>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">📍 Établissements les plus proches</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {establishmentsWithDistance.slice(0, 4).map((est) => (
            <div key={est.id} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onEstClick(est.id)}>
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center font-bold text-base shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{est.name}</h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 uppercase">
                      {est.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-orange-600">à {formatDistance(est.distance)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setRouteDest(est.coords)} className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 hover:bg-orange-100 cursor-pointer" title="Itinéraire">
                <Compass className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
