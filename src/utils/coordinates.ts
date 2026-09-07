import { Establishment } from '../types';

// Coordinates for neighborhoods, districts and cities across Burkina Faso
export const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  'ouaga 2000': { lat: 12.3167, lng: -1.4983 },
  'ouaga2000': { lat: 12.3167, lng: -1.4983 },
  'gounghin': { lat: 12.3533, lng: -1.5544 },
  'tampouy': { lat: 12.4042, lng: -1.5471 },
  'zone du bois': { lat: 12.3789, lng: -1.4947 },
  'centre-ville': { lat: 12.3686, lng: -1.5275 },
  'centre ville': { lat: 12.3686, lng: -1.5275 },
  'koulouba': { lat: 12.3650, lng: -1.5220 },
  '1200 logements': { lat: 12.3680, lng: -1.4950 },
  '1200 logts': { lat: 12.3680, lng: -1.4950 },
  'somgandé': { lat: 12.4100, lng: -1.4800 },
  'somgande': { lat: 12.4100, lng: -1.4800 },
  'dassasgho': { lat: 12.3700, lng: -1.4700 },
  "patte d'oie": { lat: 12.3350, lng: -1.5120 },
  'patte d oie': { lat: 12.3350, lng: -1.5120 },
  'pissy': { lat: 12.3420, lng: -1.5720 },
  'saaba': { lat: 12.3750, lng: -1.4150 },
  'karpala': { lat: 12.3250, lng: -1.4600 },
  'tanghin': { lat: 12.3950, lng: -1.5150 },
  'larlé': { lat: 12.3780, lng: -1.5360 },
  'larle': { lat: 12.3780, lng: -1.5360 },
  'cissin': { lat: 12.3380, lng: -1.5450 },
  'dagnoën': { lat: 12.3650, lng: -1.4820 },
  'dagnoen': { lat: 12.3650, lng: -1.4820 },
  'kalgondin': { lat: 12.3500, lng: -1.5050 },
  'wemtinga': { lat: 12.3750, lng: -1.4880 },
  'wemtenga': { lat: 12.3750, lng: -1.4880 },
  'zogona': { lat: 12.3800, lng: -1.5000 },
  'wayalghin': { lat: 12.3900, lng: -1.4750 },
  'bobo-dioulasso': { lat: 11.1771, lng: -4.2979 },
  'bobo dioulasso': { lat: 11.1771, lng: -4.2979 },
  'koudougou': { lat: 12.2526, lng: -2.3627 },
  'ouahigouya': { lat: 13.5828, lng: -2.4216 },
  'banfora': { lat: 10.6333, lng: -4.7667 },
  'fada n\'gourma': { lat: 12.0616, lng: 0.3584 }
};

/**
 * Accurately extracts or resolves coordinates for any registered establishment
 */
export function getEstCoords(est: Establishment): { lat: number; lng: number } {
  // 1. Direct lat/lng numeric fields
  if (typeof est.lat === 'number' && typeof est.lng === 'number' && !isNaN(est.lat) && !isNaN(est.lng) && est.lat !== 0 && est.lng !== 0) {
    return { lat: est.lat, lng: est.lng };
  }

  // 2. Parsed from geolocation string e.g. "12.3686, -1.5275" or google maps URL
  if (est.geolocation) {
    const geoStr = est.geolocation;
    // URL containing coordinates e.g. maps?q=12.3686,-1.5275 or @12.3686,-1.5275
    const urlMatch = geoStr.match(/([0-9.-]+)\s*,\s*([0-9.-]+)/);
    if (urlMatch) {
      const pLat = parseFloat(urlMatch[1]);
      const pLng = parseFloat(urlMatch[2]);
      if (!isNaN(pLat) && !isNaN(pLng) && pLat !== 0 && pLng !== 0) {
        return { lat: pLat, lng: pLng };
      }
    }
  }

  // 3. Fallback matching on neighborhood/quarter/city
  const neighborhoodStr = (est.neighborhood || est.quarter || '').toLowerCase().trim();
  if (neighborhoodStr && NEIGHBORHOOD_COORDS[neighborhoodStr]) {
    return NEIGHBORHOOD_COORDS[neighborhoodStr];
  }

  // Partial match on neighborhood
  for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
    if (neighborhoodStr.includes(key) || key.includes(neighborhoodStr)) {
      return coords;
    }
  }

  const cityStr = (est.city || '').toLowerCase().trim();
  if (cityStr && NEIGHBORHOOD_COORDS[cityStr]) {
    return NEIGHBORHOOD_COORDS[cityStr];
  }

  // Default central point (Ouagadougou Centre)
  return { lat: 12.3686, lng: -1.5275 };
}

/**
 * Calculates distance in Kilometers between 2 GPS points (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates distance in Meters between 2 GPS points
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Human readable distance formatting (e.g. "350 m" or "2.4 km")
 */
export function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}
