import { useQuery } from '@tanstack/react-query';
import { fetchAllBeautySalons } from '../lib/beautyService';
import { BeautySalon, BeautySalonType } from '../types';

export interface BeautySalonsFilterParams {
  ville?: string;
  type?: BeautySalonType | 'tous';
  searchTerm?: string;
  aDomicile?: boolean;
  sansRdv?: boolean;
}

const LOCAL_STORAGE_SALONS_CACHE_KEY = 'zaka_beauty_salons_cache';

/**
 * Persist salons in localStorage for instant offline access
 */
function saveSalonsToLocalStorage(salons: BeautySalon[]) {
  try {
    if (salons && salons.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_SALONS_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        salons
      }));
    }
  } catch (e) {
    console.warn('Erreur de sauvegarde locale des salons:', e);
  }
}

/**
 * Retrieve cached salons from localStorage
 */
function getSalonsFromLocalStorage(): BeautySalon[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SALONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.salons) ? parsed.salons : [];
  } catch (e) {
    return [];
  }
}

/**
 * Custom React Query hook for fetching and caching beauty salons list
 * Supports stale-while-revalidate, background refetch on reconnection,
 * and instant offline fallback.
 */
export function useBeautySalonsQuery(filters: BeautySalonsFilterParams) {
  const queryKey = [
    'beauty-salons',
    filters.ville || 'tous',
    filters.type || 'tous',
    filters.searchTerm || '',
    Boolean(filters.aDomicile),
    Boolean(filters.sansRdv)
  ];

  const query = useQuery<BeautySalon[], Error>({
    queryKey,
    queryFn: async () => {
      const data = await fetchAllBeautySalons(filters);
      saveSalonsToLocalStorage(data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    gcTime: 24 * 60 * 60 * 1000, // Keep in memory cache for 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    placeholderData: (previousData) => {
      if (previousData && previousData.length > 0) {
        return previousData;
      }
      // Offline fallback from local storage
      const cached = getSalonsFromLocalStorage();
      if (cached.length > 0) {
        let filtered = cached;
        if (filters.ville && filters.ville !== 'tous') {
          filtered = filtered.filter(s => s.ville?.toLowerCase() === filters.ville!.toLowerCase());
        }
        if (filters.type && filters.type !== 'tous') {
          filtered = filtered.filter(s => s.typeEtablissement === filters.type);
        }
        if (filters.aDomicile) {
          filtered = filtered.filter(s => s.aDomicile);
        }
        if (filters.sansRdv) {
          filtered = filtered.filter(s => s.accepteSansRdv);
        }
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
          const s = filters.searchTerm.toLowerCase();
          filtered = filtered.filter(salon =>
            salon.nom?.toLowerCase().includes(s) ||
            salon.ville?.toLowerCase().includes(s) ||
            salon.quartier?.toLowerCase().includes(s) ||
            salon.description?.toLowerCase().includes(s)
          );
        }
        return filtered;
      }
      return undefined;
    }
  });

  return query;
}
