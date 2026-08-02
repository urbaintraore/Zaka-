import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Establishment } from '../types';
import { MapPin, Navigation, Compass, Star, Eye } from 'lucide-react';

// Fix default Leaflet icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapViewProps {
  establishments: Establishment[];
  onEstClick: (id: string) => void;
  selectedCategory?: string;
  userLocation?: { lat: number; lng: number } | null;
}

// Haversine formula to calculate distance in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function MapView({ establishments, onEstClick, selectedCategory }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Real-time user GPS location
  const [userPos, setUserPos] = useState<{ lat: number; lng: number }>({
    lat: 12.3714,
    lng: -1.5197, // Default Ouagadougou center
  });
  const [initialPosSet, setInitialPosSet] = useState(false);
  const [isWatchingLocation, setIsWatchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Start watching position on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }

    setIsWatchingLocation(true);
    
    // Fallback/initial explicit get
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setInitialPosSet(true);
        setLocationError(null);
      },
      (err) => {
        console.warn("Initial geolocation error:", err.message);
        setLocationError("Position par défaut : Ouagadougou");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPos(coords);
        setInitialPosSet(true);
        setLocationError(null);
      },
      (err) => {
        console.warn("Geolocation watchPosition warning:", err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (initialPosSet && mapRef.current) {
       mapRef.current.setView([userPos.lat, userPos.lng], 15);
       setInitialPosSet(false); // Only auto-center once
    }
  }, [initialPosSet, userPos]);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapRef.current) {
      const lat = !isNaN(userPos.lat) ? userPos.lat : 12.3714;
      const lng = !isNaN(userPos.lng) ? userPos.lng : -1.5197;
      
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }
  }, []);

  // Filter establishments and calculate distances
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
      return {
        ...est,
        coords: { lat, lng },
        distance,
      };
    }).sort((a, b) => a.distance - b.distance);
  }, [establishments, selectedCategory, userPos]);

  // Update map markers when establishments or user location change
  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = markersRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // User location pulsing marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `<div style="width: 18px; height: 18px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    if (!isNaN(userPos.lat) && !isNaN(userPos.lng)) {
      L.marker([userPos.lat, userPos.lng], { icon: userIcon })
        .bindPopup('<b>📍 Vous êtes ici</b><br/><span style="font-size:11px; color:#6b7280;">Localisation en temps réel</span>')
        .addTo(layerGroup);
    }

    // Establishment markers
    establishmentsWithDistance.forEach((est) => {
      const typeBadgeColor =
        est.category === 'maquis' ? '#ea580c' :
        est.category === 'restaurant' ? '#16a34a' :
        est.category === 'bar' ? '#2563eb' :
        est.category === 'boite_de_nuit' ? '#9333ea' : '#ea580c';

      const estIcon = L.divIcon({
        className: 'custom-est-marker',
        html: `<div style="background-color: ${typeBadgeColor}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.25); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
                 <span>${est.name}</span>
               </div>`,
        iconSize: [100, 26],
        iconAnchor: [50, 26],
      });

      const marker = L.marker([est.coords.lat, est.coords.lng], { icon: estIcon });
      const popupHtml = `
        <div style="min-width: 180px; font-family: sans-serif;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #111827;">${est.name}</h4>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 6px;">
            📍 À ${formatDistance(est.distance)} de vous
          </div>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #4b5563;">
            ${est.address || est.quarter || 'Ouagadougou'}
          </p>
          <button id="popup-btn-${est.id}" style="width: 100%; background-color: #ea580c; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
            Voir l'établissement
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${est.id}`);
        if (btn) {
          btn.onclick = () => {
            onEstClick(est.id);
          };
        }
      });

      marker.addTo(layerGroup);
    });
  }, [establishmentsWithDistance, userPos, onEstClick]);

  const centerOnUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(newPos);
          setLocationError(null);
          if (mapRef.current && !isNaN(newPos.lat) && !isNaN(newPos.lng)) {
            mapRef.current.flyTo([newPos.lat, newPos.lng], 15, { duration: 1 });
          }
        },
        (err) => {
          console.warn("Manual geolocation error:", err.message);
          setLocationError("Impossible d'obtenir votre position exacte.");
          if (mapRef.current && !isNaN(userPos.lat) && !isNaN(userPos.lng)) {
            mapRef.current.flyTo([userPos.lat, userPos.lng], 15, { duration: 1 });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else if (mapRef.current && !isNaN(userPos.lat) && !isNaN(userPos.lng)) {
      mapRef.current.flyTo([userPos.lat, userPos.lng], 15, { duration: 1 });
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Interactive Map Header with Real-Time Location Status */}
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

        <button
          onClick={centerOnUser}
          className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" /> Ma position
        </button>
      </div>

      {/* Leaflet Map Container */}
      <div className="relative h-[380px] w-full rounded-3xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>

      {/* Nearby establishments sorted by real-time distance */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            📍 Établissements les plus proches
          </h4>
          <span className="text-xs font-medium text-orange-600">
            Trié par distance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {establishmentsWithDistance.slice(0, 4).map((est) => (
            <div
              key={est.id}
              onClick={() => onEstClick(est.id)}
              className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                    {est.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                      {est.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      à {formatDistance(est.distance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-orange-600">
                <Eye className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

