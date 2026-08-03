import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Establishment } from '../types';
import { MapPin, Navigation, Compass, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export function MapView({ establishments, onEstClick, selectedCategory }: MapViewProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({
    lat: 12.3714,
    lng: -1.5197, 
  });
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeDest, setRouteDest] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // 1. Geolocalisation Setup
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

  // 2. Establishments mapping with distance calculation
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

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([userPos.lat, userPos.lng], 14);

      // Add elegant, crisp OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 4. Update map view size and user marker position
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Call invalidateSize on load and layout updates to prevent grey tile gaps
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const userIcon = L.divIcon({
      html: `<div style="width: 18px; height: 18px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
      className: 'bg-transparent border-none',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPos.lat, userPos.lng]);
    } else {
      userMarkerRef.current = L.marker([userPos.lat, userPos.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup("<div class='font-bold text-xs p-1'>Vous êtes ici</div>");
    }

    if (!routeDest) {
      map.setView([userPos.lat, userPos.lng], 14);
    }
  }, [userPos, routeDest]);

  // 5. Render active establishments markers with dynamic badges
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    establishmentsWithDistance.forEach(est => {
      const typeBadgeColor =
        est.category === 'maquis' ? '#ea580c' :
        est.category === 'restaurant' ? '#16a34a' :
        est.category === 'bar' ? '#2563eb' :
        est.category === 'boite_de_nuit' ? '#9333ea' : '#ea580c';

      const estIcon = L.divIcon({
        html: `<div class="font-bold text-[11px] text-white px-2.5 py-1 rounded-xl shadow-md border-2 border-white whitespace-nowrap" style="background-color: ${typeBadgeColor}; transform: translate(-50%, -50%);">
          ${est.name}
        </div>`,
        className: 'bg-transparent border-none'
      });

      const popupContent = `
        <div class="p-1 min-w-[180px] font-sans text-gray-900">
          <h4 class="font-extrabold text-sm m-0 mb-1 text-gray-900">${est.name}</h4>
          <div class="text-[11px] text-gray-500 mb-2">
            📍 À ${formatDistance(est.distance)} de vous
          </div>
          <p class="text-xs text-gray-600 m-0 mb-3">
            ${est.address || est.quarter || 'Ouagadougou'}
          </p>
          <div class="flex gap-2">
            <button id="btn-route-${est.id}" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[11px] py-1.5 rounded-lg cursor-pointer flex items-center justify-center gap-1 border-0 shadow-sm transition-all">
              🧭 Route
            </button>
            <button id="btn-details-${est.id}" class="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-extrabold text-[11px] py-1.5 rounded-lg cursor-pointer border-0 shadow-sm transition-all">
              Détails
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([est.coords.lat, est.coords.lng], { icon: estIcon })
        .addTo(markersLayer)
        .bindPopup(popupContent, { closeButton: false });

      marker.on('popupopen', () => {
        const container = marker.getPopup()?.getElement();
        if (!container) return;

        const routeBtn = container.querySelector(`#btn-route-${est.id}`);
        if (routeBtn) {
          routeBtn.addEventListener('click', () => {
            setRouteDest(est.coords);
            marker.closePopup();
          });
        }

        const detailsBtn = container.querySelector(`#btn-details-${est.id}`);
        if (detailsBtn) {
          detailsBtn.addEventListener('click', () => {
            onEstClick(est.id);
            marker.closePopup();
          });
        }
      });
    });
  }, [establishmentsWithDistance, onEstClick]);

  // 6. Interactive Route Fetching from OSRM (OpenStreetMap Routing)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;

    routeLayer.clearLayers();
    setDistance(null);
    setDuration(null);

    if (!routeDest) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos.lng},${userPos.lat};${routeDest.lng},${routeDest.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("OSRM Routing API Error");
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;
          const latLngs = coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);

          const polyline = L.polyline(latLngs, {
            color: '#ea580c',
            weight: 5,
            opacity: 0.85
          }).addTo(routeLayer);

          setDistance(formatDistance(route.distance));
          setDuration(Math.round(route.duration / 60) + ' min');

          map.fitBounds(polyline.getBounds(), { padding: [45, 45] });
        }
      } catch (err) {
        console.error("OSRM Route fallback triggered:", err);
        // Clean fallback to dotted straight line polyline if offline
        const fallbackLatLngs = [
          [userPos.lat, userPos.lng],
          [routeDest.lat, routeDest.lng]
        ] as [number, number][];
        
        const polyline = L.polyline(fallbackLatLngs, {
          color: '#ea580c',
          dashArray: '5, 10',
          weight: 4
        }).addTo(routeLayer);
        
        const distMeters = calculateDistanceMeters(userPos.lat, userPos.lng, routeDest.lat, routeDest.lng);
        setDistance(formatDistance(distMeters));
        setDuration(Math.round((distMeters / 10) / 60) + ' min'); // Estimate at ~36km/h
        map.fitBounds(polyline.getBounds(), { padding: [45, 45] });
      }
    };

    fetchRoute();
  }, [routeDest, userPos]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Real-time geolocation banner */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping"></div>
          <div>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
              Localisation en temps réel (OpenStreetMap) active
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {locationError || `${establishmentsWithDistance.length} établissement(s) à proximité`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Map Canvas */}
      <div className="relative h-[380px] w-full rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-10">
        <div ref={mapRef} className="w-full h-full z-0" />

        {/* Route Info Overlay Card */}
        {routeDest && distance && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-xl rounded-2xl px-4 py-2 border-2 border-orange-200 z-[1000] flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="text-orange-600">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-wider">Trajet en cours</div>
              <div className="text-xs font-bold text-gray-500">{distance} • {duration}</div>
            </div>
            <button 
              onClick={() => setRouteDest(null)} 
              className="ml-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-full hover:bg-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        )}
      </div>

      {/* List of nearby venues */}
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
