import { Establishment, User } from '../types';

const DB_NAME = 'zaka_offline_db';
const DB_VERSION = 2;
const ESTABLISHMENTS_STORE = 'establishments';
const FAVORITES_STORE = 'favorites';
const PROFILE_STORE = 'user_profile';
const METADATA_STORE = 'metadata';

/**
 * Open and initialize the IndexedDB instance for offline storage.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté sur ce navigateur'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create establishments store with 'id' as keyPath
      if (!db.objectStoreNames.contains(ESTABLISHMENTS_STORE)) {
        const estStore = db.createObjectStore(ESTABLISHMENTS_STORE, { keyPath: 'id' });
        estStore.createIndex('category', 'category', { unique: false });
        estStore.createIndex('status', 'status', { unique: false });
        estStore.createIndex('neighborhood', 'neighborhood', { unique: false });
      }

      // Create favorites store with 'userId' as keyPath
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: 'userId' });
      }

      // Create user profile store with 'id' as keyPath
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }

      // Create metadata store for tracking sync times and status
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Impossible d\'ouvrir la base IndexedDB'));
    };
  });
}

/**
 * Saves a list of establishments into IndexedDB for full offline accessibility.
 */
export async function saveEstablishmentsToIndexedDB(establishments: Establishment[]): Promise<void> {
  if (!establishments || establishments.length === 0) return;

  try {
    const db = await openDB();
    const tx = db.transaction([ESTABLISHMENTS_STORE, METADATA_STORE], 'readwrite');
    const estStore = tx.objectStore(ESTABLISHMENTS_STORE);
    const metaStore = tx.objectStore(METADATA_STORE);

    // Save/update each establishment
    for (const est of establishments) {
      if (est && est.id) {
        estStore.put(est);
      }
    }

    // Update metadata info
    metaStore.put({
      key: 'establishments_info',
      count: establishments.length,
      lastSyncedAt: new Date().toISOString()
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log(`[IndexedDB] ${establishments.length} établissements mis en cache hors-ligne avec succès.`);
        resolve();
      };
      tx.onerror = () => {
        console.warn('[IndexedDB] Erreur lors de l\'enregistrement des établissements :', tx.error);
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de la sauvegarde locale :', err);
  }
}

/**
 * Retrieves all cached establishments from IndexedDB.
 */
export async function getEstablishmentsFromIndexedDB(): Promise<Establishment[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(ESTABLISHMENTS_STORE, 'readonly');
    const store = tx.objectStore(ESTABLISHMENTS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as Establishment[];
        console.log(`[IndexedDB] ${results.length} établissements récupérés depuis le cache hors-ligne.`);
        resolve(results || []);
      };
      request.onerror = () => {
        console.warn('[IndexedDB] Erreur lors de la lecture des établissements :', request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de lecture du cache hors-ligne :', err);
    return [];
  }
}

/**
 * Saves favorite establishment IDs for a specific user into IndexedDB.
 */
export async function saveFavoritesToIndexedDB(userId: string, favoriteIds: string[]): Promise<void> {
  if (!userId) return;

  try {
    const db = await openDB();
    const tx = db.transaction(FAVORITES_STORE, 'readwrite');
    const store = tx.objectStore(FAVORITES_STORE);
    store.put({ userId, favoriteIds, updatedAt: new Date().toISOString() });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de la sauvegarde des favoris :', err);
  }
}

/**
 * Retrieves cached favorite establishment IDs for a specific user from IndexedDB.
 */
export async function getFavoritesFromIndexedDB(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const db = await openDB();
    const tx = db.transaction(FAVORITES_STORE, 'readonly');
    const store = tx.objectStore(FAVORITES_STORE);
    const request = store.get(userId);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.favoriteIds || []);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de la lecture des favoris :', err);
    return [];
  }
}

/**
 * Saves user profile info into IndexedDB for offline access.
 */
export async function saveUserProfileToIndexedDB(user: User): Promise<void> {
  if (!user || !user.id) return;

  try {
    const db = await openDB();
    const tx = db.transaction(PROFILE_STORE, 'readwrite');
    const store = tx.objectStore(PROFILE_STORE);
    store.put({ ...user, updatedAt: new Date().toISOString() });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Échec de la sauvegarde du profil :', err);
  }
}

/**
 * Retrieves cached user profile info from IndexedDB by user ID or get latest user.
 */
export async function getUserProfileFromIndexedDB(userId?: string): Promise<User | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(PROFILE_STORE, 'readonly');
    const store = tx.objectStore(PROFILE_STORE);

    if (userId) {
      const request = store.get(userId);
      return new Promise((resolve) => {
        request.onsuccess = () => resolve((request.result as User) || null);
        request.onerror = () => resolve(null);
      });
    } else {
      const request = store.getAll();
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const results = request.result as User[];
          resolve(results && results.length > 0 ? results[results.length - 1] : null);
        };
        request.onerror = () => resolve(null);
      });
    }
  } catch (err) {
    console.warn('[IndexedDB] Échec de la lecture du profil :', err);
    return null;
  }
}

/**
 * Returns the offline cache status (number of establishments and last sync date).
 */
export async function getOfflineCacheMetadata(): Promise<{ count: number; lastSyncedAt: string | null }> {
  try {
    const db = await openDB();
    const tx = db.transaction(METADATA_STORE, 'readonly');
    const store = tx.objectStore(METADATA_STORE);
    const request = store.get('establishments_info');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            count: request.result.count || 0,
            lastSyncedAt: request.result.lastSyncedAt || null
          });
        } else {
          resolve({ count: 0, lastSyncedAt: null });
        }
      };
      request.onerror = () => {
        resolve({ count: 0, lastSyncedAt: null });
      };
    });
  } catch (err) {
    return { count: 0, lastSyncedAt: null };
  }
}

/**
 * Clears the offline cache in IndexedDB.
 */
export async function clearOfflineIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([ESTABLISHMENTS_STORE, FAVORITES_STORE, PROFILE_STORE, METADATA_STORE], 'readwrite');
    tx.objectStore(ESTABLISHMENTS_STORE).clear();
    tx.objectStore(FAVORITES_STORE).clear();
    tx.objectStore(PROFILE_STORE).clear();
    tx.objectStore(METADATA_STORE).clear();

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('[IndexedDB] Cache hors-ligne vidé.');
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Erreur lors de la purge du cache :', err);
  }
}

