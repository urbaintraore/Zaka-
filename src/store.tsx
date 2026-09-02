import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Establishment, Publication, Review, Application, RelationshipRequest, ServiceRequest, Role, Reservation, MenuDuJour, Entreprise, CarnetEntry, HairSalonData, Coiffeur, StaffReview, StaffAttendance, Parrainage, Campaign, Ad, AdPayment, AdInvoice, AdDailyStat, CampaignStatus, LoyaltyCard, ZakaRedemption, GroupOuting, Friendship, AdOrganization, AdAuditLog, AdRateConfig, AdSupportTicket, AdCreative, TakeawayOrder, StockItem, SaleRecord } from './types';
import { triggerHapticFeedback } from './utils/haptics';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';

// Firebase-to-Supabase Compatibility Layer
export const auth: any = {
  get currentUser() {
    // Dynamically retrieve the current user's auth info if available
    return null;
  }
};
export const db = 'supabase';

export class RecaptchaVerifier {
  constructor(auth: any, containerId: string, options: any) {}
}
export type ConfirmationResult = any;
export const signInWithPhoneNumber = async (auth: any, phone: string, verifier: any): Promise<any> => {
  throw new Error("L'inscription par numéro de téléphone est désactivée. Veuillez utiliser l'adresse e-mail.");
};

const mapCollectionToTable = (coll: string): string => {
  const mapping: { [key: string]: string } = {
    users: 'users',
    establishments: 'establishments',
    publications: 'publications',
    reviews: 'reviews',
    reservations: 'reservations',
    takeawayOrders: 'takeaway_orders',
    relationshipRequests: 'relationship_requests',
    applications: 'applications',
    loyaltyCards: 'loyalty_cards',
    zakaRedemptions: 'zaka_redemptions',
    parrainages: 'parrainages',
    friendships: 'friendships',
    groupOutings: 'group_outings',
    conversations: 'conversations',
    messages: 'messages',
    serviceRequests: 'service_requests',
    entreprises: 'entreprises',
    campaigns: 'ad_campaigns',
    ads: 'ad_creatives',
    payments: 'payments',
    invoices: 'invoices',
    adStatistics: 'ad_statistics',
    stocks: 'stocks',
    ventes: 'ventes',
    advertisers: 'users',
    adOrganizations: 'ad_organizations',
    adAuditLogs: 'ad_audit_logs',
    adRates: 'ad_rates',
    adSupportTickets: 'ad_support_tickets',
    adCreatives: 'ad_creatives',
    staffReviews: 'staff_reviews',
    staffAttendances: 'staff_attendances',
  };
  return mapping[coll] || coll;
};

const cleanPayloadForSupabase = (tableName: string, payload: any) => {
  if (!payload || typeof payload !== 'object') return payload;
  const clean = { ...payload };
  delete clean.id;
  
  if (tableName === 'establishments') {
    Object.keys(clean).forEach(k => {
      if (clean[k] === undefined || clean[k] === null) {
        delete clean[k];
      }
    });
  }
  
  if (tableName === 'entreprises') {
     Object.keys(clean).forEach(k => {
      if (clean[k] === undefined) {
        delete clean[k];
      }
    });
  }

  if (tableName === 'relationship_requests') {
    if (clean.initiatorId && !clean.userId) {
      clean.userId = clean.initiatorId;
    }
    if (clean.userId && !clean.initiatorId) {
      clean.initiatorId = clean.userId;
    }
  }
  
  Object.keys(clean).forEach(k => {
     if (clean[k] === undefined || clean[k] === null || clean[k] === '') {
       if (clean[k] === undefined) {
         delete clean[k];
       }
     }
  });
  
  return clean;
};

const collection = (dbInstance: any, collectionName: string) => {
  return collectionName;
};

const doc = (dbInstance: any, collectionName: string, docId?: string) => {
  if (typeof dbInstance === 'string' && collectionName === undefined) {
    // Handles single argument doc() calls
    return { collectionName: dbInstance, docId: undefined };
  }
  return { collectionName, docId };
};

const getLocalMenus = (): any[] => {
  try {
    const stored = localStorage.getItem('zaka_menus_du_jour');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

const saveLocalMenus = (menus: any[]) => {
  try {
    localStorage.setItem('zaka_menus_du_jour', JSON.stringify(menus));
  } catch (e) {
    console.error('Failed to save menus to localStorage', e);
  }
};

const addDoc = async (collRef: string, payload: any) => {
  if (collRef === 'menus_du_jour') {
    const menus = getLocalMenus();
    const newMenu = { id: Math.random().toString(), ...payload };
    menus.push(newMenu);
    saveLocalMenus(menus);
    return { id: newMenu.id };
  }
  if (!isSupabaseConfigured) return { id: Math.random().toString() };
  const tableName = mapCollectionToTable(collRef);
  const cleanPayload = cleanPayloadForSupabase(tableName, payload);
  let { data, error } = await supabase.from(tableName).insert(cleanPayload).select().single();

  // Automatic recovery if Supabase PostgREST rejects missing columns in schema cache
  if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('does not exist'))) {
    console.warn(`[Supabase addDoc] Problème de colonne sur ${tableName}: ${error.message}. Auto-adaptation du schéma en cours...`);
    const match = error.message.match(/Could not find the '([^']+)' column/i) || error.message.match(/column '([^']+)' does not exist/i);
    if (match && match[1]) {
      const missingCol = match[1];
      const retryPayload = { ...cleanPayload };
      delete retryPayload[missingCol];
      const retryRes = await supabase.from(tableName).insert(retryPayload).select().single();
      if (!retryRes.error) {
        data = retryRes.data;
        error = null;
      } else {
        error = retryRes.error;
      }
    }
    
    // If still in error and tableName is relationship_requests, use minimal legacy compatible payload
    if (error && tableName === 'relationship_requests') {
      const legacyPayload: any = {
        userId: cleanPayload.userId || cleanPayload.initiatorId,
        userName: cleanPayload.userName || 'Utilisateur',
        establishmentId: cleanPayload.establishmentId,
        establishmentName: cleanPayload.establishmentName || 'Établissement',
        requestedRole: cleanPayload.requestedRole || 'client',
        status: cleanPayload.status || 'en_attente',
        date: cleanPayload.date || new Date().toISOString()
      };
      const legRes = await supabase.from(tableName).insert(legacyPayload).select().single();
      if (!legRes.error) {
        data = legRes.data;
        error = null;
      }
    }
  }

  if (error) {
    console.error(`[Supabase addDoc] Error in ${tableName} payload:`, cleanPayload, error);
    console.error(`[Supabase addDoc] Error details:`, error.message, error.details, error.hint);
    throw error;
  }
  return { id: data?.id || Math.random().toString() };
};

const setDoc = async (docRef: { collectionName: string, docId?: string }, payload: any, options?: any) => {
  if (docRef.collectionName === 'menus_du_jour') {
    const menus = getLocalMenus();
    const id = docRef.docId || Math.random().toString();
    const filtered = menus.filter((m: any) => m.id !== id);
    filtered.push({ id, ...payload });
    saveLocalMenus(filtered);
    return;
  }
  if (!isSupabaseConfigured) return;
  const tableName = mapCollectionToTable(docRef.collectionName);
  const cleanPayload = cleanPayloadForSupabase(tableName, payload);
  const id = docRef.docId;
  let { error } = await supabase.from(tableName).upsert({ id, ...cleanPayload });

  if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
    const match = error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const pruned = { id, ...cleanPayload };
      delete pruned[match[1]];
      const retry = await supabase.from(tableName).upsert(pruned);
      if (!retry.error) error = null;
    }
  }

  if (error) {
    console.error(`[Supabase setDoc] Error in ${tableName}:`, error);
    throw error;
  }
};

const updateDoc = async (docRef: { collectionName: string, docId?: string }, payload: any) => {
  if (docRef.collectionName === 'menus_du_jour') {
    const menus = getLocalMenus();
    const id = docRef.docId;
    const index = menus.findIndex((m: any) => m.id === id);
    if (index !== -1) {
      menus[index] = { ...menus[index], ...payload };
      saveLocalMenus(menus);
    }
    return;
  }
  if (!isSupabaseConfigured) return;
  const tableName = mapCollectionToTable(docRef.collectionName);
  const cleanPayload = cleanPayloadForSupabase(tableName, payload);
  const id = docRef.docId;
  let { error } = await supabase.from(tableName).update(cleanPayload).eq('id', id);

  if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache'))) {
    const match = error.message.match(/Could not find the '([^']+)' column/i);
    if (match && match[1]) {
      const pruned = { ...cleanPayload };
      delete pruned[match[1]];
      const retry = await supabase.from(tableName).update(pruned).eq('id', id);
      if (!retry.error) error = null;
    }
  }

  if (error) {
    console.error(`[Supabase updateDoc] Error in ${tableName}:`, error);
    throw error;
  }
};

const deleteDoc = async (docRef: { collectionName: string, docId?: string }) => {
  if (docRef.collectionName === 'menus_du_jour') {
    const menus = getLocalMenus();
    const id = docRef.docId;
    const filtered = menus.filter((m: any) => m.id !== id);
    saveLocalMenus(filtered);
    return;
  }
  if (!isSupabaseConfigured) return;
  const tableName = mapCollectionToTable(docRef.collectionName);
  const id = docRef.docId;
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) {
    console.error(`[Supabase deleteDoc] Error in ${tableName}:`, error);
    throw error;
  }
};

const getDoc = async (docRef: { collectionName: string, docId?: string }) => {
  if (docRef.collectionName === 'menus_du_jour') {
    const menus = getLocalMenus();
    const found = menus.find((m: any) => m.id === docRef.docId);
    return {
      exists: () => !!found,
      id: docRef.docId,
      data: () => found || null
    };
  }
  if (!isSupabaseConfigured) return { exists: () => false, data: () => null };
  const tableName = mapCollectionToTable(docRef.collectionName);
  const { data, error } = await supabase.from(tableName).select('*').eq('id', docRef.docId).maybeSingle();
  if (error) {
    console.error(`[Supabase getDoc] Error in ${tableName}:`, error);
    return { exists: () => false, data: () => null };
  }
  return {
    exists: () => !!data,
    id: docRef.docId,
    data: () => data
  };
};

const getDocs = async (queryObj: any) => {
  const collectionName = queryObj.collectionName || queryObj;
  if (collectionName === 'menus_du_jour') {
    let list = getLocalMenus();
    if (queryObj.filters && queryObj.filters.length > 0) {
      for (const filter of queryObj.filters) {
        if (filter.op === '==') {
          list = list.filter(item => item[filter.field] === filter.value);
        }
      }
    }
    const docs = list.map(item => ({
      id: item.id,
      exists: () => true,
      data: () => item
    }));
    return {
      empty: docs.length === 0,
      size: docs.length,
      docs
    };
  }
  if (!isSupabaseConfigured) return { empty: true, size: 0, docs: [] };
  const tableName = mapCollectionToTable(collectionName);
  let queryBuilder: any = supabase.from(tableName).select('*');
  
  if (queryObj.filters && queryObj.filters.length > 0) {
    for (const filter of queryObj.filters) {
      if (filter.op === '==') {
        queryBuilder = queryBuilder.eq(filter.field, filter.value);
      }
    }
  }
  
  const { data, error } = await queryBuilder;
  if (error) {
    console.error(`[Supabase getDocs] Error in ${tableName}:`, error);
    return { empty: true, size: 0, docs: [] };
  }
  
  const docs = (data || []).map(item => ({
    id: item.id,
    exists: () => true,
    data: () => item
  }));
  
  return {
    empty: docs.length === 0,
    size: docs.length,
    docs
  };
};

const query = (collectionRef: string, ...filters: any[]) => {
  return {
    collectionName: collectionRef,
    filters: filters.filter(f => f && f.field)
  };
};

const where = (field: string, op: string, value: any) => {
  return { field, op, value };
};

const onSnapshot = (queryObj: any, callback: (snapshot: any) => void, errorCallback?: (err: any) => void) => {
  const collectionName = queryObj.collectionName || queryObj;
  
  if (collectionName === 'menus_du_jour') {
    let list = getLocalMenus();
    if (queryObj.filters && queryObj.filters.length > 0) {
      for (const filter of queryObj.filters) {
        if (filter.op === '==') {
          list = list.filter(item => item[filter.field] === filter.value);
        }
      }
    }
    const docs = list.map(item => ({
      id: item.id,
      exists: () => true,
      data: () => item
    }));
    
    setTimeout(() => {
      callback({
        forEach: (fn: any) => docs.forEach(fn),
        docs,
        empty: docs.length === 0,
        size: docs.length,
        exists: () => docs.length > 0,
        data: () => docs[0]?.data() || null
      });
    }, 0);
    
    return () => {};
  }

  const tableName = mapCollectionToTable(collectionName);
  
  if (!isSupabaseConfigured) {
    setTimeout(() => {
      callback({
        forEach: (fn: any) => [],
        docs: [],
        empty: true,
        size: 0,
        exists: () => false,
        data: () => null
      });
    }, 0);
    return () => {};
  }
  
  const fetchSnapshot = async () => {
    try {
      let queryBuilder: any = supabase.from(tableName).select('*');
      
      // Apply filters if they exist
      if (queryObj.filters && queryObj.filters.length > 0) {
        for (const filter of queryObj.filters) {
          if (filter.op === '==') {
            queryBuilder = queryBuilder.eq(filter.field, filter.value);
          }
        }
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        if (error?.code === 'PGRST205') {
          const isAlreadyReported = (window as any)._reportedMissingTables?.has(tableName);
          if (!isAlreadyReported) {
            if (!(window as any)._reportedMissingTables) (window as any)._reportedMissingTables = new Set();
            (window as any)._reportedMissingTables.add(tableName);
            console.warn(`[Supabase] Table manquante détectée : "${tableName}". L'application continuera de fonctionner mais cette fonctionnalité sera limitée. Veuillez exécuter supabase_schema.sql.`);
            window.dispatchEvent(new CustomEvent('supabase-missing-table', { detail: tableName }));
          }
          callback({
            forEach: (fn: any) => [],
            docs: [],
            empty: true,
            size: 0,
            exists: () => false,
            data: () => null
          });
          return;
        }
        if (errorCallback) errorCallback(error);
      } else {
        const docs = (data || []).map(item => ({
          id: item.id,
          exists: () => true,
          data: () => item
        }));
        callback({
          forEach: (fn: any) => docs.forEach(fn),
          docs,
          empty: docs.length === 0,
          size: docs.length,
          exists: () => docs.length > 0,
          data: () => docs[0]?.data() || null
        });
      }
    } catch (err) {
      console.error(`[Supabase onSnapshot] Fatal fetch error in ${tableName}:`, err);
      if (errorCallback) errorCallback(err);
    }
  };

  fetchSnapshot();

  return () => {};
};

const runTransaction = async (dbInstance: any, fn: (tx: any) => Promise<any>) => {
  const tx = {
    get: async (docRef: any) => {
      return getDoc(docRef);
    },
    update: async (docRef: any, payload: any) => {
      return updateDoc(docRef, payload);
    },
    set: async (docRef: any, payload: any) => {
      return setDoc(docRef, payload);
    }
  };
  return fn(tx);
};

const translateFirebaseError = (err: any) => err?.message || String(err);


interface AppState {
  currentUser: User | null;
  users: User[];
  friendships: Friendship[];
  establishments: Establishment[];
  publications: Publication[];
  entreprises: Entreprise[];
  reviews: Review[];
  favorites: Record<string, string[]>;
  favoriteTags: Record<string, Record<string, string[]>>;
  applications: Application[];
  relationshipRequests: RelationshipRequest[];
  serviceRequests: ServiceRequest[];
  reservations: Reservation[];
  menusDuJour: MenuDuJour[];
  carnetEntrees: CarnetEntry[];
  coiffeurs: Record<string, Coiffeur[]>;
  staffReviews: StaffReview[];
  staffAttendances: StaffAttendance[];
  parrainages: Parrainage[];
  campaigns: Campaign[];
  ads: Ad[];
  adPayments: AdPayment[];
  adInvoices: AdInvoice[];
  adDailyStats: AdDailyStat[];
  adOrganizations: AdOrganization[];
  adAuditLogs: AdAuditLog[];
  adRates: AdRateConfig[];
  adSupportTickets: AdSupportTicket[];
  adCreatives: AdCreative[];
  takeawayOrders: TakeawayOrder[];
  loyaltyCards: LoyaltyCard[];
  zakaRedemptions: ZakaRedemption[];
  groupOutings: GroupOuting[];
  stocks: StockItem[];
  ventes: SaleRecord[];
  loading: boolean;
  globalError: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null;
  missingTables: string[];
  theme: 'light' | 'dark';
}

interface AppContextType extends AppState {
  unreadCount: number;
  login: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    user: Omit<User, 'id'>, 
    pass: string, 
    estData?: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] },
    entrepriseData?: { sector: string; logo: string; philosophy: string; description: string }
  ) => Promise<void>;
  envoyerCodeOtp: (phone: string, containerId: string) => Promise<void>;
  confirmerCodeOtp: (otpCode: string, registrationData?: {
    name: string;
    role: Role;
    country: string;
    city: string;
    phone: string;
    email?: string;
    estData?: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] };
    entrepriseData?: { sector: string; logo: string; philosophy: string; description: string };
    referralCodeUsed?: string;
  }) => Promise<void>;
  addEstablishment: (est: Omit<Establishment, 'id' | 'status' | 'averageRating'>) => Promise<void>;
  updateEstablishment: (id: string, data: Partial<Establishment>) => Promise<void>;
  deleteEntreprise: (id: string) => Promise<void>;
  deleteEstablishment: (id: string) => Promise<void>;
  addPublication: (pub: Omit<Publication, 'id' | 'views' | 'clicks' | 'createdAt'>) => Promise<void>;
  deletePublication: (id: string) => Promise<void>;
  toggleFavorite: (clientId: string, establishmentId: string) => Promise<void>;
  updateFavoriteTags: (clientId: string, establishmentId: string, tags: string[]) => Promise<void>;
  saveAllFavoriteTags: (clientId: string, tagsMap: Record<string, string[]>) => Promise<void>;
  validateEstablishment: (id: string) => Promise<void>;
  validateEntreprise: (id: string) => Promise<void>;
  followEntreprise: (clientId: string, entrepriseId: string) => Promise<void>;
  unfollowEntreprise: (clientId: string, entrepriseId: string) => Promise<void>;
  upgradeToGerant: (estData: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] }) => Promise<void>;
  updateProfile: (profileData: { name: string; city: string; country: string; email?: string; phone?: string }) => Promise<void>;
  createRelationshipRequest: (req: Omit<RelationshipRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  updateRelationshipRequest: (id: string, status: 'acceptee' | 'refusee') => Promise<void>;
  createServiceRequest: (req: Omit<ServiceRequest, 'id' | 'status' | 'date'>) => Promise<void>;
  updateServiceRequest: (id: string, status: 'validee' | 'refusee', message?: string) => Promise<void>;
  createConversation: (clientId: string, establishmentId: string, clientName: string, establishmentName: string, ownerId: string) => Promise<string>;
  toggleDJStatus: (requestId: string, isDJ: boolean) => Promise<void>;
  toggleCaissierStatus: (requestId: string, isCaissier: boolean) => Promise<void>;
  toggleServeurStatus: (requestId: string, isServeur: boolean) => Promise<void>;
  addStockItem: (item: Omit<StockItem, 'id' | 'createdAt'>) => Promise<void>;
  updateStockItem: (id: string, updates: Partial<Omit<StockItem, 'id' | 'establishmentId'>>) => Promise<void>;
  deleteStockItem: (id: string) => Promise<void>;
  recordSale: (sale: Omit<SaleRecord, 'id' | 'date'>) => Promise<void>;
  addApplication: (app: Omit<Application, 'id' | 'status' | 'date'>) => Promise<void>;
  updateApplicationStatus: (id: string, status: 'acceptee' | 'refusee') => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  replyToReview: (reviewId: string, reply: string) => Promise<void>;
  addReservation: (res: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  updateReservationStatus: (id: string, status: 'en_attente' | 'confirmee' | 'refusee' | 'annulee', managerMessage?: string) => Promise<void>;
  addTakeawayOrder: (order: Omit<TakeawayOrder, 'id' | 'status' | 'createdAt' | 'date'>) => Promise<void>;
  updateTakeawayOrderStatus: (id: string, status: TakeawayOrder['status']) => Promise<void>;
  addMenuDuJour: (menu: Omit<MenuDuJour, 'id' | 'publishedAt'>) => Promise<void>;
  updateHairSalonData: (id: string, data: HairSalonData) => Promise<void>;
  trackEstablishmentView: (establishmentId: string) => Promise<void>;
  trackPublicationView: (publicationId: string) => Promise<void>;
  addCarnetEntry: (entry: Omit<CarnetEntry, 'id'>) => Promise<void>;
  updateCarnetEntryNote: (id: string, note: string) => Promise<void>;
  deleteCarnetEntry: (id: string) => Promise<void>;
  createStaffReview: (review: Omit<StaffReview, 'id' | 'status' | 'date'>) => Promise<void>;
  updateStaffReviewStatus: (id: string, status: 'valide' | 'invalide', managerNote?: string, bonusOrSanction?: StaffReview['bonusOrSanction']) => Promise<void>;
  createStaffAttendance: (attendance: Omit<StaffAttendance, 'id' | 'createdAt'>) => Promise<void>;
  deleteStaffAttendance: (id: string) => Promise<void>;
  // ZAKA Ads Methods
  addCampaign: (
    campaignData: Omit<Campaign, 'id' | 'createdAt' | 'budgetSpent'>, 
    adCreatives?: Omit<Ad, 'id' | 'campaignId' | 'impressions' | 'views' | 'clicks' | 'conversions' | 'createdAt'>[]
  ) => Promise<string>;
  updateCampaignStatus: (campaignId: string, status: CampaignStatus) => Promise<void>;
  addAdCreative: (adData: Omit<Ad, 'id' | 'impressions' | 'views' | 'clicks' | 'conversions' | 'createdAt'>) => Promise<void>;
  trackAdImpression: (adId: string) => Promise<void>;
  trackAdClick: (adId: string) => Promise<void>;
  processAdPayment: (paymentData: Omit<AdPayment, 'id' | 'createdAt' | 'status'>) => Promise<string>;
  validateAdPayment: (paymentId: string) => Promise<void>;
  validateCampaignByAdmin: (campaignId: string) => Promise<void>;
  createAdOrganization: (data: any) => Promise<string>;
  updateAdOrganization: (id: string, data: any) => Promise<void>;
  moderateCampaignByAdmin: (campaignId: string, status: CampaignStatus, rejectionReason?: string, comment?: string) => Promise<void>;
  addAdAuditLog: (log: Omit<AdAuditLog, 'id' | 'timestamp'>) => Promise<void>;
  updateAdRateConfig: (config: any) => Promise<void>;
  createAdSupportTicket: (ticket: any) => Promise<string>;
  respondAdSupportTicket: (id: string, response: string) => Promise<void>;
  addAdCreativeLibraryItem: (item: any) => Promise<string>;
  // New features methods
  updateCrowdStatus: (establishmentId: string, status: 'calme' | 'anime' | 'complet' | null) => Promise<void>;
  updateLoyaltyConfig: (establishmentId: string, enabled: boolean, requiredVisits: number, reward: string) => Promise<void>;
  consumeLoyaltyReward: (cardId: string) => Promise<void>;
  updateZakaPointsConfig: (establishmentId: string, acceptsPoints: boolean, pointsCost: number, rewardDescription: string) => Promise<void>;
  awardZakaPoints: (userId: string, pointsAmount: number, reason: string) => Promise<void>;
  redeemZakaPoints: (establishmentId: string, pointsCost: number, rewardDescription: string) => Promise<string>;
  consumeZakaRedemption: (redemptionId: string) => Promise<void>;
  createGroupOuting: (outing: Omit<GroupOuting, 'id' | 'responses' | 'createdAt' | 'creatorId' | 'creatorName' | 'shareCode'>, invitedFriendIds?: string[]) => Promise<string>;
  respondGroupOuting: (outingId: string, status: 'je_viens' | 'peut_etre' | 'je_ne_peux_pas') => Promise<void>;
  deleteGroupOuting: (outingId: string) => Promise<void>;
  inviteFriendsToGroupOuting: (outingId: string, friendIds: string[]) => Promise<void>;
  updateGroupOutingLocation: (outingId: string, location: { lat: number; lng: number; isSharing: boolean }) => Promise<void>;
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (friendshipId: string) => Promise<void>;
  declineFriendRequest: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  setGlobalError: (err: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null) => void;
  toggleTheme: () => void;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
    
  const isMissingTable = (error?.code === 'PGRST205') || 
                        errorMessage.includes('PGRST205') ||
                        errorMessage.includes('not found') ||
                        errorMessage.includes('does not exist');

  if (isMissingTable) {
    const tableName = path || 'inconnue';
    console.warn(`[Supabase Error] Table manquante détectée : "${tableName}". L'opération "${operationType}" a échoué. Veuillez exécuter supabase_schema.sql.`);
    window.dispatchEvent(new CustomEvent('supabase-missing-table', { detail: tableName }));
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Removed throw to prevent crashing the entire application state when a table is missing
}

const DEFAULT_ESTABLISHMENTS: Establishment[] = [];
const DEFAULT_ENTREPRISES: Entreprise[] = [];
const DEFAULT_PUBLICATIONS: Publication[] = [];

const DEFAULT_CAMPAIGNS: Campaign[] = [];

const DEFAULT_ADS: Ad[] = [];

const AppContext = createContext<AppContextType | null>(null);

const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (e) {
    console.warn("Theme storage access warning:", e);
  }
  return 'light';
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    users: [],
    friendships: [],
    establishments: DEFAULT_ESTABLISHMENTS,
    publications: DEFAULT_PUBLICATIONS,
    entreprises: [],
    reviews: [],
    favorites: {},
    favoriteTags: {},
    applications: [],
    relationshipRequests: [],
    serviceRequests: [],
    reservations: [],
    menusDuJour: [],
    carnetEntrees: [],
    coiffeurs: {},
    staffReviews: [],
    staffAttendances: [],
    parrainages: [],
    campaigns: [],
    ads: [],
    adPayments: [],
    adInvoices: [],
    adDailyStats: [],
    adOrganizations: [],
    adAuditLogs: [],
    adRates: [],
    adSupportTickets: [],
    adCreatives: [],
    takeawayOrders: [],
    loyaltyCards: [],
    zakaRedemptions: [],
    groupOutings: [],
    stocks: [],
    ventes: [],
    loading: false,
    globalError: null,
    missingTables: [],
    theme: getInitialTheme()
  });

  // Safety fallback: ensure loading state resolves even if firebase auth callback is delayed
  useEffect(() => {
    const handleMissingTable = (e: any) => {
      const tableName = e.detail;
      setState(s => {
        if (s.missingTables.includes(tableName)) return s;
        return { ...s, missingTables: [...s.missingTables, tableName] };
      });
    };

    window.addEventListener('supabase-missing-table', handleMissingTable);
    return () => window.removeEventListener('supabase-missing-table', handleMissingTable);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setState(s => s.loading ? { ...s, loading: false } : s);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    // Dynamic detection of system color scheme if no user preference is saved
    const hasLocalTheme = localStorage.getItem('app-theme') !== null;
    if (!hasLocalTheme && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
        const hasOverride = localStorage.getItem('app-theme') !== null;
        if (!hasOverride) {
          const systemTheme = e.matches ? 'dark' : 'light';
          setState(s => ({ ...s, theme: systemTheme }));
        }
      };
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, []);

  // Keep track of notified publications and replies to avoid duplicates
  const [notifiedPubIds, setNotifiedPubIds] = useState<string[]>([]);
  const [notifiedReplies, setNotifiedReplies] = useState<string[]>([]);
  const [notifiedResRequests, setNotifiedResRequests] = useState<string[]>([]);
  const [notifiedResUpdates, setNotifiedResUpdates] = useState<string[]>([]);

  useEffect(() => {
    if (!state.currentUser) return;

    // 1. Notify of new events/publications in favorite establishments
    const userFavs = state.favorites[state.currentUser.id] || [];
    if (userFavs.length > 0 && state.publications.length > 0) {
      state.publications.forEach(pub => {
        if (userFavs.includes(pub.establishmentId)) {
          const createdTime = pub.createdAt ? new Date(pub.createdAt).getTime() : 0;
          const isRecent = createdTime > Date.now() - 60000;
          if (isRecent && !notifiedPubIds.includes(pub.id)) {
            const est = state.establishments.find(e => e.id === pub.establishmentId);
            const estName = est ? est.name : "votre établissement favori";
            import('./utils/pushNotifications').then(({ sendPushNotification }) => {
              sendPushNotification(
                `Nouveauté chez ${estName} !`,
                `[${pub.type.toUpperCase()}] ${pub.title} - ${pub.description.substring(0, 80)}...`
              );
            });
            setNotifiedPubIds(prev => [...prev, pub.id]);
          }
        }
      });
    }

    // 2. Notify clients of answers to their reviews/comments
    if (state.reviews.length > 0) {
      state.reviews.forEach(review => {
        const hasReplyDate = 'replyDate' in review && (review as any).replyDate;
        const replyText = (review as any).reply;
        const replyDateStr = (review as any).replyDate;
        if (review.clientId === state.currentUser?.id && replyText && hasReplyDate) {
          const replyTime = new Date(replyDateStr).getTime();
          const isRecentReply = replyTime > Date.now() - 60000;
          const trackingKey = `${review.id}-${replyDateStr}`;
          if (isRecentReply && !notifiedReplies.includes(trackingKey)) {
            const est = state.establishments.find(e => e.id === review.establishmentId);
            const estName = est ? est.name : "l'établissement";
            import('./utils/pushNotifications').then(({ sendPushNotification }) => {
              sendPushNotification(
                `Réponse de ${estName}`,
                `Le gérant a répondu à votre avis: "${replyText}"`
              );
            });
            setNotifiedReplies(prev => [...prev, trackingKey]);
          }
        }
      });
    }

    // 3. Notify Gérants of new reservation requests
    if (state.reservations && state.reservations.length > 0) {
      state.reservations.forEach(res => {
        const est = state.establishments.find(e => e.id === res.establishmentId);
        if (est && est.ownerId === state.currentUser?.id) {
          const createdTime = res.createdAt ? new Date(res.createdAt).getTime() : 0;
          const isRecent = createdTime > Date.now() - 60000;
          if (isRecent && !notifiedResRequests.includes(res.id)) {
            import('./utils/pushNotifications').then(({ sendPushNotification }) => {
              sendPushNotification(
                `Nouvelle réservation chez ${est.name} !`,
                `Par ${res.clientName} le ${new Date(res.date).toLocaleDateString()} à ${res.time} pour ${res.guestsCount} pers.`
              );
            });
            setNotifiedResRequests(prev => [...prev, res.id]);
          }
        }
      });
    }

    // 4. Notify Clients of reservation status changes
    if (state.reservations && state.reservations.length > 0) {
      state.reservations.forEach(res => {
        if (res.clientId === state.currentUser?.id) {
          // Find the latest history update
          const history = res.history || [];
          if (history.length > 1) {
            const latest = history[history.length - 1];
            const updatedTime = latest.updatedAt ? new Date(latest.updatedAt).getTime() : 0;
            const isRecentUpdate = updatedTime > Date.now() - 60000;
            const trackingKey = `${res.id}-${latest.status}-${latest.updatedAt}`;
            if (isRecentUpdate && !notifiedResUpdates.includes(trackingKey)) {
              import('./utils/pushNotifications').then(({ sendPushNotification }) => {
                sendPushNotification(
                  `Réservation ${latest.status === 'confirmee' ? 'confirmée' : latest.status} !`,
                  `Votre réservation chez ${res.establishmentName} est désormais ${latest.status === 'confirmee' ? 'confirmée' : latest.status}.`
                );
              });
              setNotifiedResUpdates(prev => [...prev, trackingKey]);
            }
          }
        }
      });
    }
  }, [state.publications, state.reviews, state.favorites, state.currentUser, state.establishments, state.reservations]);

  const toggleTheme = () => {
    setState(s => {
      const newTheme = s.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('app-theme', newTheme);
      return { ...s, theme: newTheme };
    });
  };

  const setGlobalError = (err: { message: string; code?: string; type?: 'error' | 'warning' | 'info' } | null) => {
    setState(s => ({ ...s, globalError: err }));
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!state.currentUser) {
      setUnreadCount(0);
      return;
    }

    const isGerant = state.currentUser.role === 'gerant' || state.currentUser.role === 'salon_coiffure';
    const convQuery = query(
      collection(db, 'conversations'),
      where(isGerant ? 'ownerId' : 'clientId', '==', state.currentUser.id)
    );

    const unsubscribe = onSnapshot(convQuery, (snapshot) => {
      let count = 0;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const isUnread = isGerant ? data.unreadByGerant : data.unreadByClient;
        if (isUnread) count++;
      });
      setUnreadCount(count);
    }, (error) => {
      console.error("Erreur listening to unread conversations:", error);
    });

    return () => unsubscribe();
  }, [state.currentUser?.id, state.currentUser?.role]);

  useEffect(() => {
    let unsubscribeSupabase: (() => void) | undefined;
    
    console.log("[Store] Initialisation du listener d'authentification (Supabase)...");
    
    // SUPABASE AUTH LISTENER (PRIMARY)
    if (isSupabaseConfigured) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            console.log("[Supabase Auth] Utilisateur détecté :", session.user.id, session.user.email);
            try {
              const { data: profile, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

              if (profile && !error) {
                console.log("[Supabase Auth] Profil utilisateur hydraté depuis Supabase :", profile.name, "Rôle:", profile.role);
                setState(s => ({
                  ...s,
                  currentUser: profile as User,
                  loading: false
                }));
              } else {
                // Check if we have a pending registration
                const pendingStr = localStorage.getItem('zaka_pending_registration');
                let newProfile: Partial<User> = {
                  id: session.user.id,
                  email: session.user.email || '',
                  name: session.user.user_metadata?.name || (session.user.email ? session.user.email.split('@')[0] : 'Utilisateur'),
                  role: (session.user.user_metadata?.role as Role) || 'client',
                  country: 'Burkina Faso',
                  city: 'Ouagadougou'
                };
                
                if (pendingStr) {
                  try {
                    const pending = JSON.parse(pendingStr);
                    if (pending.uid === session.user.id || pending.userData?.email === session.user.email) {
                      newProfile = { ...pending.userData, id: session.user.id };
                      // also create establishment if gerant
                      if (pending.estData) {
                         const estPayload: any = {
                           ownerId: session.user.id,
                           name: pending.estData.name || '',
                           category: newProfile.role === 'salon_coiffure' ? 'salon_de_coiffure' : (pending.estData.category || 'autre'),
                           country: newProfile.country || 'Burkina Faso',
                           city: newProfile.city || 'Ouagadougou',
                           neighborhood: pending.estData.neighborhood || '',
                           address: pending.estData.address || '',
                           phone: newProfile.phone || '',
                           description: pending.estData.description || '',
                           photos: pending.estData.photos || [],
                           tags: pending.estData.tags || [],
                           geolocation: pending.estData.geolocation || '',
                           status: 'valide',
                           averageRating: 0
                         };
                         if (newProfile.role === 'salon_coiffure' || pending.estData.category === 'salon_de_coiffure') {
                           estPayload.hairSalonData = { hairdressers: [], hairstyles: [] };
                         }
                         await supabase.from('establishments').insert(estPayload);
                      }
                      if (pending.entrepriseData && newProfile.role === 'entreprise') {
                         await supabase.from('entreprises').insert({
                           ownerId: session.user.id,
                           name: newProfile.name,
                           sector: pending.entrepriseData.sector || '',
                           logo: pending.entrepriseData.logo || '',
                           description: pending.entrepriseData.description || '',
                           philosophy: pending.entrepriseData.philosophy || '',
                           status: 'valide'
                         });
                      }
                      localStorage.removeItem('zaka_pending_registration');
                    }
                  } catch(e) {
                     console.error('Error recovering pending registration', e);
                  }
                }
                
                await supabase.from('users').upsert(newProfile, { onConflict: 'id' });
                setState(s => ({
                  ...s,
                  currentUser: newProfile as User,
                  loading: false
                }));
              }
            } catch (err) {
              console.error("[Supabase Auth] Erreur récupération profil :", err);
              setState(s => ({ ...s, loading: false }));
            }
          } else {
            setState(s => ({ ...s, currentUser: null, loading: false }));
          }
        });
        unsubscribeSupabase = () => subscription.unsubscribe();
      } catch (sbErr) {
        console.warn("[Supabase Auth] Listener init notice:", sbErr);
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }

    return () => {
      if (unsubscribeSupabase) unsubscribeSupabase();
    };
  }, []);

  // Listeners for public data (establishments and publications) available to everyone
  useEffect(() => {
    // Listen to establishments
    const estQuery = query(collection(db, 'establishments'));
    const unsubscribeEst = onSnapshot(estQuery, (snapshot) => {
      const ests: Establishment[] = [];
      snapshot.forEach(doc => ests.push({ id: doc.id, ...doc.data() } as Establishment));
      
      // Combine with defaults to ensure the database is never empty
      const mergedEsts = [...ests];
      DEFAULT_ESTABLISHMENTS.forEach(defEst => {
        if (!mergedEsts.some(e => e.id === defEst.id)) {
          mergedEsts.push(defEst);
        }
      });
      
      setState(s => ({ ...s, establishments: mergedEsts }));
    }, (error) => {
      console.error("Erreur establishments:", error);
      // Fallback to defaults in case of error
      setState(s => ({ ...s, establishments: DEFAULT_ESTABLISHMENTS }));
    });

    // Listen to publications
    const pubQuery = query(collection(db, 'publications'));
    const unsubscribePub = onSnapshot(pubQuery, (snapshot) => {
      const pubs: Publication[] = [];
      snapshot.forEach(doc => pubs.push({ id: doc.id, ...doc.data() } as Publication));
      
      // Combine with defaults to ensure the database is never empty
      const mergedPubs = [...pubs];
      DEFAULT_PUBLICATIONS.forEach(defPub => {
        if (!mergedPubs.some(p => p.id === defPub.id)) {
          mergedPubs.push(defPub);
        }
      });
      
      setState(s => ({ ...s, publications: mergedPubs }));
    }, (error) => {
      console.error("Erreur publications:", error);
      // Fallback to defaults in case of error
      setState(s => ({ ...s, publications: DEFAULT_PUBLICATIONS }));
    });

    // Listen to reviews
    const reviewQuery = query(collection(db, 'reviews'));
    const unsubscribeReview = onSnapshot(reviewQuery, (snapshot) => {
      const revs: Review[] = [];
      snapshot.forEach(doc => revs.push({ id: doc.id, ...doc.data() } as Review));
      setState(s => ({ ...s, reviews: revs }));
    }, (error) => {
      console.error("Erreur reviews:", error);
    });

    // Listen to menus du jour
    const menuQuery = query(collection(db, 'menus_du_jour'));
    const unsubscribeMenu = onSnapshot(menuQuery, (snapshot) => {
      const menus: MenuDuJour[] = [];
      snapshot.forEach(doc => menus.push({ id: doc.id, ...doc.data() } as MenuDuJour));
      setState(s => ({ ...s, menusDuJour: menus }));
    }, (error) => {
      console.error("Erreur menus_du_jour:", error);
    });

    // Listen to entreprises
    const entQuery = query(collection(db, 'entreprises'));
    const unsubscribeEnt = onSnapshot(entQuery, (snapshot) => {
      const ents: Entreprise[] = [];
      snapshot.forEach(docSnap => ents.push({ id: docSnap.id, ...docSnap.data() } as Entreprise));
      
      const mergedEnts = [...ents];
      DEFAULT_ENTREPRISES.forEach(defE => {
        if (!mergedEnts.some(e => e.id === defE.id)) {
          mergedEnts.push(defE);
        }
      });
      
      setState(s => ({ ...s, entreprises: mergedEnts }));
    }, (error) => {
      console.error("Erreur listening to entreprises:", error);
    });

    // Listen to ZAKA Ads campaigns (public)
    const campQuery = query(collection(db, 'campaigns'));
    const unsubscribeCamp = onSnapshot(campQuery, (snapshot) => {
      const camps: Campaign[] = [];
      snapshot.forEach(docSnap => camps.push({ id: docSnap.id, ...docSnap.data() } as Campaign));
      
      const mergedCamps = [...camps];
      DEFAULT_CAMPAIGNS.forEach(defC => {
        if (!mergedCamps.some(c => c.id === defC.id)) {
          mergedCamps.push(defC);
        }
      });
      setState(s => ({ ...s, campaigns: mergedCamps }));
    }, (error) => {
      console.error("Erreur listening to campaigns:", error);
      setState(s => ({ ...s, campaigns: DEFAULT_CAMPAIGNS }));
    });

    // Listen to ZAKA Ads (public)
    const adsQuery = query(collection(db, 'ads'));
    const unsubscribeAds = onSnapshot(adsQuery, (snapshot) => {
      const adList: Ad[] = [];
      snapshot.forEach(docSnap => adList.push({ id: docSnap.id, ...docSnap.data() } as Ad));
      
      const mergedAds = [...adList];
      DEFAULT_ADS.forEach(defAd => {
        if (!mergedAds.some(a => a.id === defAd.id)) {
          mergedAds.push(defAd);
        }
      });
      setState(s => ({ ...s, ads: mergedAds }));
    }, (error) => {
      console.error("Erreur listening to ads:", error);
      setState(s => ({ ...s, ads: DEFAULT_ADS }));
    });

    return () => {
      unsubscribeEst();
      unsubscribePub();
      unsubscribeReview();
      unsubscribeMenu();
      unsubscribeEnt();
      unsubscribeCamp();
      unsubscribeAds();
    };
  }, []);

  // Listeners for user-specific / private data requiring authentication
  useEffect(() => {
    if (!state.currentUser) {
      // Clear authenticated state data when user logs out
      setState(s => ({ ...s, users: [], relationshipRequests: [], serviceRequests: [], reservations: [], favorites: {}, carnetEntrees: [], parrainages: [], adPayments: [], adInvoices: [], adDailyStats: [], adOrganizations: [], adAuditLogs: [], adRates: [], adSupportTickets: [], adCreatives: [], takeawayOrders: [], loyaltyCards: [], zakaRedemptions: [], groupOutings: [], friendships: [], stocks: [], ventes: [] }));
      return;
    }

    // Listen to ad organizations
    const orgsQuery = query(collection(db, 'adOrganizations'));
    const unsubscribeOrgs = onSnapshot(orgsQuery, (snapshot) => {
      const oList: AdOrganization[] = [];
      snapshot.forEach(docSnap => oList.push({ id: docSnap.id, ...docSnap.data() } as AdOrganization));
      setState(s => ({ ...s, adOrganizations: oList }));
    }, (error) => {
      console.error("Erreur listening to adOrganizations:", error);
    });

    // Listen to ad audit logs
    const auditQuery = query(collection(db, 'adAuditLogs'));
    const unsubscribeAudit = onSnapshot(auditQuery, (snapshot) => {
      const aList: AdAuditLog[] = [];
      snapshot.forEach(docSnap => aList.push({ id: docSnap.id, ...docSnap.data() } as AdAuditLog));
      setState(s => ({ ...s, adAuditLogs: aList }));
    }, (error) => {
      console.error("Erreur listening to adAuditLogs:", error);
    });

    // Listen to ad rates
    const ratesQuery = query(collection(db, 'adRates'));
    const unsubscribeRates = onSnapshot(ratesQuery, (snapshot) => {
      const rList: AdRateConfig[] = [];
      snapshot.forEach(docSnap => rList.push({ id: docSnap.id, ...docSnap.data() } as AdRateConfig));
      setState(s => ({ ...s, adRates: rList }));
    }, (error) => {
      console.error("Erreur listening to adRates:", error);
    });

    // Listen to ad support tickets
    const ticketsQuery = query(collection(db, 'adSupportTickets'));
    const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
      const tList: AdSupportTicket[] = [];
      snapshot.forEach(docSnap => tList.push({ id: docSnap.id, ...docSnap.data() } as AdSupportTicket));
      setState(s => ({ ...s, adSupportTickets: tList }));
    }, (error) => {
      console.error("Erreur listening to adSupportTickets:", error);
    });

    // Listen to ad creatives
    const creativesQuery = query(collection(db, 'adCreatives'));
    const unsubscribeCreatives = onSnapshot(creativesQuery, (snapshot) => {
      const cList: AdCreative[] = [];
      snapshot.forEach(docSnap => cList.push({ id: docSnap.id, ...docSnap.data() } as AdCreative));
      setState(s => ({ ...s, adCreatives: cList }));
    }, (error) => {
      console.error("Erreur listening to adCreatives:", error);
    });

    // Listen to ad payments
    const payQuery = query(collection(db, 'payments'));
    const unsubscribePayments = onSnapshot(payQuery, (snapshot) => {
      const pList: AdPayment[] = [];
      snapshot.forEach(docSnap => pList.push({ id: docSnap.id, ...docSnap.data() } as AdPayment));
      setState(s => ({ ...s, adPayments: pList }));
    }, (error) => {
      console.error("Erreur listening to payments:", error);
    });

    // Listen to ad invoices
    const invQuery = query(collection(db, 'invoices'));
    const unsubscribeInvoices = onSnapshot(invQuery, (snapshot) => {
      const iList: AdInvoice[] = [];
      snapshot.forEach(docSnap => iList.push({ id: docSnap.id, ...docSnap.data() } as AdInvoice));
      setState(s => ({ ...s, adInvoices: iList }));
    }, (error) => {
      console.error("Erreur listening to invoices:", error);
    });

    // Listen to ad daily stats
    const statsQuery = query(collection(db, 'adStatistics'));
    const unsubscribeStats = onSnapshot(statsQuery, (snapshot) => {
      const sList: AdDailyStat[] = [];
      snapshot.forEach(docSnap => sList.push({ id: docSnap.id, ...docSnap.data() } as AdDailyStat));
      setState(s => ({ ...s, adDailyStats: sList }));
    }, (error) => {
      console.error("Erreur listening to adStatistics:", error);
    });

    // Listen to users
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const uList: User[] = [];
      snapshot.forEach(doc => {
        uList.push({ id: doc.id, ...doc.data() } as User);
      });
      setState(s => ({ ...s, users: uList }));
    }, (error) => {
      console.error("Erreur listening to users:", error);
    });

    // Listen to friendships
    const friendshipsQuery = query(collection(db, 'friendships'));
    const unsubscribeFriendships = onSnapshot(friendshipsQuery, (snapshot) => {
      const fList: Friendship[] = [];
      snapshot.forEach(docSnap => {
        fList.push({ id: docSnap.id, ...docSnap.data() } as Friendship);
      });
      setState(s => ({ ...s, friendships: fList }));
    }, (error) => {
      console.error("Erreur listening to friendships:", error);
    });

    // Listen to parrainages
    const parrainageQuery = query(collection(db, 'parrainages'));
    const unsubscribeParrainages = onSnapshot(parrainageQuery, (snapshot) => {
      const pList: Parrainage[] = [];
      snapshot.forEach(docSnap => pList.push({ id: docSnap.id, ...docSnap.data() } as Parrainage));
      setState(s => ({ ...s, parrainages: pList }));
    }, (error) => {
      console.error("Erreur listening to parrainages:", error);
    });

    // Listen to relationship requests
    const relQuery = query(collection(db, 'relationshipRequests'));
    const unsubscribeRel = onSnapshot(relQuery, (snapshot) => {
      const rels: RelationshipRequest[] = [];
      snapshot.forEach(doc => {
        const d: any = doc.data() || {};
        rels.push({
          id: doc.id,
          ...d,
          initiatorId: d.initiatorId || d.userId || d.initiator_id || d.user_id || '',
          targetId: d.targetId || d.target_id || '',
          userId: d.userId || d.initiatorId || '',
          establishmentId: d.establishmentId || d.establishment_id || '',
          type: d.type || 'client_join',
          requestedRole: d.requestedRole || d.requested_role || 'client',
          status: d.status || 'en_attente',
          date: d.date || d.created_at || new Date().toISOString(),
          isDJ: !!(d.isDJ || d.is_dj),
          isCaissier: !!(d.isCaissier || d.is_caissier),
          isServeur: !!(d.isServeur || d.is_serveur),
          identityPhotoUrl: d.identityPhotoUrl || d.identity_photo_url || ''
        } as RelationshipRequest);
      });
      setState(s => ({ ...s, relationshipRequests: rels }));
    }, (error) => {
      console.error("Erreur relationshipRequests:", error);
    });

    // Listen to staff reviews
    const staffQuery = query(collection(db, 'staffReviews'));
    const unsubscribeStaffReviews = onSnapshot(staffQuery, (snapshot) => {
      const sReviews: StaffReview[] = [];
      snapshot.forEach(doc => sReviews.push({ id: doc.id, ...doc.data() } as StaffReview));
      setState(s => ({ ...s, staffReviews: sReviews }));
    }, (error) => {
      console.error("Erreur staffReviews:", error);
    });

    // Listen to staff attendances
    const attendanceQuery = query(collection(db, 'staffAttendances'));
    const unsubscribeAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attList: StaffAttendance[] = [];
      snapshot.forEach(doc => attList.push({ id: doc.id, ...doc.data() } as StaffAttendance));
      setState(s => ({ ...s, staffAttendances: attList }));
    }, (error) => {
      console.error("Erreur staffAttendances:", error);
    });

    // Listen to service requests
    const serQuery = query(collection(db, 'serviceRequests'));
    const unsubscribeSer = onSnapshot(serQuery, (snapshot) => {
      const sers: ServiceRequest[] = [];
      snapshot.forEach(doc => sers.push({ id: doc.id, ...doc.data() } as ServiceRequest));
      setState(s => ({ ...s, serviceRequests: sers }));
    }, (error) => {
      console.error("Erreur serviceRequests:", error);
    });

    // Listen to reservations
    const resQuery = query(collection(db, 'reservations'));
    const unsubscribeRes = onSnapshot(resQuery, (snapshot) => {
      const resList: Reservation[] = [];
      snapshot.forEach(doc => resList.push({ id: doc.id, ...doc.data() } as Reservation));
      setState(s => ({ ...s, reservations: resList }));
    }, (error) => {
      console.error("Erreur reservations:", error);
    });

    // Listen to takeaway orders
    const toQuery = query(collection(db, 'takeawayOrders'));
    const unsubscribeTO = onSnapshot(toQuery, (snapshot) => {
      const toList: TakeawayOrder[] = [];
      snapshot.forEach(doc => toList.push({ id: doc.id, ...doc.data() } as TakeawayOrder));
      setState(s => ({ ...s, takeawayOrders: toList }));
    }, (error) => {
      console.error("Erreur takeawayOrders:", error);
    });

    // Listen to favorites
    const unsubscribeFav = onSnapshot(doc(db, 'favorites', state.currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const establishmentIds = data?.establishmentIds || [];
        const tags = data?.tags || {};
        setState(s => ({
          ...s,
          favorites: {
            ...s.favorites,
            [state.currentUser!.id]: establishmentIds
          },
          favoriteTags: {
            ...s.favoriteTags,
            [state.currentUser!.id]: tags
          }
        }));
      } else {
        setState(s => ({
          ...s,
          favorites: {
            ...s.favorites,
            [state.currentUser!.id]: []
          },
          favoriteTags: {
            ...s.favoriteTags,
            [state.currentUser!.id]: {}
          }
        }));
      }
    }, (error) => {
      console.error("Erreur listening to favorites:", error);
    });

    // Listen to carnet_entrees
    const carnetQuery = query(collection(db, 'carnet_entrees'), where('clientId', '==', state.currentUser.id));
    const unsubscribeCarnet = onSnapshot(carnetQuery, (snapshot) => {
      const carnet: CarnetEntry[] = [];
      snapshot.forEach(docSnap => carnet.push({ id: docSnap.id, ...docSnap.data() } as CarnetEntry));
      setState(s => ({ ...s, carnetEntrees: carnet }));
    }, (error) => {
      console.error("Erreur listening to carnet_entrees:", error);
    });

    // Listen to loyalty_cards
    const loyaltyQuery = query(collection(db, 'loyalty_cards'));
    const unsubscribeLoyalty = onSnapshot(loyaltyQuery, (snapshot) => {
      const cards: LoyaltyCard[] = [];
      snapshot.forEach(docSnap => cards.push({ id: docSnap.id, ...docSnap.data() } as LoyaltyCard));
      setState(s => ({ ...s, loyaltyCards: cards }));
    }, (error) => {
      console.error("Erreur listening to loyalty_cards:", error);
    });

    // Listen to zaka_redemptions
    const zakaRedQuery = query(collection(db, 'zaka_redemptions'));
    const unsubscribeZakaRed = onSnapshot(zakaRedQuery, (snapshot) => {
      const redList: ZakaRedemption[] = [];
      snapshot.forEach(docSnap => redList.push({ id: docSnap.id, ...docSnap.data() } as ZakaRedemption));
      setState(s => ({ ...s, zakaRedemptions: redList }));
    }, (error) => {
      console.error("Erreur listening to zaka_redemptions:", error);
    });

    // Listen to group_outings
    const groupOutingsQuery = query(collection(db, 'group_outings'));
    const unsubscribeGroupOutings = onSnapshot(groupOutingsQuery, (snapshot) => {
      const gList: GroupOuting[] = [];
      snapshot.forEach(docSnap => gList.push({ id: docSnap.id, ...docSnap.data() } as GroupOuting));
      setState(s => ({ ...s, groupOutings: gList }));
    }, (error) => {
      console.error("Erreur listening to group_outings:", error);
    });

    // Listen to stocks
    const stocksQuery = query(collection(db, 'stocks'));
    const unsubscribeStocks = onSnapshot(stocksQuery, (snapshot) => {
      const sList: StockItem[] = [];
      snapshot.forEach(docSnap => sList.push({ id: docSnap.id, ...docSnap.data() } as StockItem));
      setState(s => ({ ...s, stocks: sList }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stocks');
    });

    // Listen to ventes
    const ventesQuery = query(collection(db, 'ventes'));
    const unsubscribeVentes = onSnapshot(ventesQuery, (snapshot) => {
      const vList: SaleRecord[] = [];
      snapshot.forEach(docSnap => vList.push({ id: docSnap.id, ...docSnap.data() } as SaleRecord));
      setState(s => ({ ...s, ventes: vList }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ventes');
    });

    return () => {
      unsubscribePayments();
      unsubscribeInvoices();
      unsubscribeStats();
      unsubscribeUsers();
      unsubscribeRel();
      unsubscribeStaffReviews();
      unsubscribeAttendance();
      unsubscribeSer();
      unsubscribeRes();
      unsubscribeTO();
      unsubscribeFav();
      unsubscribeCarnet();
      unsubscribeParrainages();
      unsubscribeLoyalty();
      unsubscribeZakaRed();
      unsubscribeGroupOutings();
      unsubscribeFriendships();
      unsubscribeStocks();
      unsubscribeVentes();
    };
  }, [state.currentUser?.id]);

  const myEstablishmentIds = state.establishments
    .filter(e => e.ownerId === state.currentUser?.id)
    .map(e => e.id)
    .sort()
    .join(',');

  useEffect(() => {
    if (!state.currentUser) {
      setState(s => ({ ...s, applications: [] }));
      return;
    }

    const unsubscribes: (() => void)[] = [];

    // 1. Applications submitted by this user as a candidate
    const candidateQuery = query(
      collection(db, 'applications'),
      where('clientId', '==', state.currentUser.id)
    );
    const unsubCandidate = onSnapshot(candidateQuery, (snapshot) => {
      const candidateApps: Application[] = [];
      snapshot.forEach(doc => {
        candidateApps.push({ id: doc.id, ...doc.data() } as Application);
      });
      
      setState(s => {
        const currentApps = [...s.applications];
        const updated = currentApps.filter(a => a.clientId !== state.currentUser!.id);
        return { ...s, applications: [...updated, ...candidateApps] };
      });
    }, (error) => {
      console.error("Erreur listing candidate applications:", error);
    });
    unsubscribes.push(unsubCandidate);

    // 2. If gerant, also listen to applications submitted to their establishments
    const estIds = myEstablishmentIds.split(',').filter(Boolean);
    if ((state.currentUser.role === 'gerant' || state.currentUser.role === 'salon_coiffure') && estIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < estIds.length; i += 10) {
        chunks.push(estIds.slice(i, i + 10));
      }

      chunks.forEach((chunk) => {
        const managerQuery = query(
          collection(db, 'applications'),
          where('establishmentId', 'in', chunk)
        );
        const unsubManager = onSnapshot(managerQuery, (snapshot) => {
          const managerApps: Application[] = [];
          snapshot.forEach(doc => {
            managerApps.push({ id: doc.id, ...doc.data() } as Application);
          });
          
          setState(s => {
            const currentApps = [...s.applications];
            const updated = currentApps.filter(a => !chunk.includes(a.establishmentId));
            return { ...s, applications: [...updated, ...managerApps] };
          });
        }, (error) => {
          console.error("Erreur listing manager applications:", error);
        });
        unsubscribes.push(unsubManager);
      });
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [state.currentUser?.id, state.currentUser?.role, myEstablishmentIds]);

  const translateFirebaseError = (error: any): string => {
    const code = error?.code || 'unknown';
    const message = error?.message || '';

    switch (code) {
      case 'auth/unauthorized-domain':
        return `Le domaine actuel n'est pas autorisé dans Firebase. Veuillez l'ajouter dans Authentication > Paramètres > Domaines autorisés de la console Firebase. [Code: ${code}]`;
      case 'auth/too-many-requests':
        return `Trop de tentatives de connexion échouées. Votre compte est temporairement bloqué pour des raisons de sécurité. Veuillez patienter environ 5 minutes. [Code: ${code}]`;
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return `Identifiant (email, téléphone ou code de vérification) ou mot de passe incorrect. [Code: ${code}]`;
      case 'auth/user-disabled':
        return `Ce compte a été désactivé par l'administrateur. [Code: ${code}]`;
      case 'auth/network-request-failed':
        return `Erreur de connexion réseau. Veuillez vérifier votre connexion Internet. [Code: ${code}]`;
      case 'auth/operation-not-allowed':
        return `Cette méthode d'authentification n'est pas activée dans la console Firebase. [Code: ${code}]`;
      case 'auth/email-already-in-use':
        return `Cette adresse email est déjà associée à un compte. [Code: ${code}]`;
      case 'auth/invalid-email':
        return `L'adresse email saisie est invalide. [Code: ${code}]`;
      case 'auth/weak-password':
        return `Le mot de passe est trop faible (6 caractères minimum). [Code: ${code}]`;
      case 'auth/invalid-phone-number':
        return `Le numéro de téléphone saisi est invalide. Veuillez utiliser le format international (ex: +22670000000). [Code: ${code}]`;
      case 'auth/missing-phone-number':
        return `Le numéro de téléphone est manquant. [Code: ${code}]`;
      case 'auth/code-expired':
        return `Le code de vérification SMS/OTP a expiré. Veuillez demander un nouveau code. [Code: ${code}]`;
      case 'auth/invalid-verification-code':
        return `Le code de vérification SMS/OTP saisi est incorrect. [Code: ${code}]`;
      case 'auth/captcha-check-failed':
        return `La vérification reCAPTCHA a échoué. Veuillez réessayer. [Code: ${code}]`;
      case 'unavailable':
        return `Impossible de se connecter à la base de données. Veuillez désactiver vos bloqueurs de publicités (uBlock, etc.), votre VPN, ou vérifier votre pare-feu réseau. L'erreur "unavailable" indique que votre navigateur bloque la connexion à Firestore. [Code: ${code}]`;
      default:
        return `${message || 'Une erreur inconnue est survenue.'} [Code: ${code}]`;
    }
  };

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const envoyerCodeOtp = async (phone: string, containerId: string) => {
    try {
      console.log(`[Phone Auth] Initialisation du reCAPTCHA sur le conteneur: [${containerId}]`);
      
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }

      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          console.log("[Phone Auth] reCAPTCHA résolu avec succès.");
        }
      });

      console.log(`[Phone Auth] Envoi du code OTP au numéro: [${phone}]`);
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      console.log("[Phone Auth] Code OTP envoyé avec succès.");
    } catch (error: any) {
      console.error("[Phone Auth] Échec de l'envoi du code OTP :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const confirmerCodeOtp = async (otpCode: string, registrationData?: {
    name: string;
    role: Role;
    country: string;
    city: string;
    phone: string;
    email?: string;
    estData?: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] };
    entrepriseData?: { sector: string; logo: string; philosophy: string; description: string };
    referralCodeUsed?: string;
  }) => {
    if (!confirmationResult) {
      const msg = "Aucun code de vérification n'a été envoyé. Veuillez d'abord demander un code OTP.";
      setGlobalError({ message: msg, type: 'error' });
      throw new Error(msg);
    }

    try {
      console.log(`[Phone Auth] Confirmation du code OTP: [${otpCode}]`);
      const credential = await confirmationResult.confirm(otpCode);
      const firebaseUser = credential.user;
      console.log("[Phone Auth] Code validé. UID de l'utilisateur :", firebaseUser.uid);

      if (registrationData) {
        console.log("[Phone Auth] Données d'inscription détectées. Création du profil utilisateur...");
        const resolvedCategory = registrationData.estData?.category || 'maquis';
        
        let code_parrainage = '';
        if (registrationData.role === 'client') {
          const baseName = (registrationData.name || 'ZAKA').trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
          const rand = Math.floor(1000 + Math.random() * 9000);
          code_parrainage = `${baseName}${rand}`;
        }

        const newUserData: any = {
          name: registrationData.name.trim(),
          email: registrationData.email?.trim() || '',
          phone: firebaseUser.phoneNumber || registrationData.phone,
          role: registrationData.role,
          country: registrationData.country || 'Burkina Faso',
          city: registrationData.city || 'Ouagadougou',
          category: resolvedCategory,
          points: 0,
          ...(code_parrainage ? { code_parrainage, referralCode: code_parrainage } : {})
        };

        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), newUserData);
          console.log("[Phone Auth] Profil Firestore créé avec succès.");
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
        }

        if (registrationData.role === 'annonceur') {
          try {
            await setDoc(doc(db, 'advertisers', firebaseUser.uid), {
              id: firebaseUser.uid,
              name: registrationData.name.trim(),
              sector: registrationData.entrepriseData?.sector || 'Autre',
              logo: registrationData.entrepriseData?.logo || '',
              description: registrationData.entrepriseData?.description || '',
              phone: firebaseUser.phoneNumber || registrationData.phone,
              email: registrationData.email?.trim() || '',
              status: 'valide',
              balance: 0,
              createdAt: new Date().toISOString()
            });
            console.log("[Phone Auth] Profil Annonceur Firestore créé avec succès.");
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `advertisers/${firebaseUser.uid}`);
          }
        }

        if (registrationData.referralCodeUsed && registrationData.role === 'client') {
          try {
            const trimmedCode = registrationData.referralCodeUsed.trim().toUpperCase();
            const parrainQuery = query(collection(db, 'users'), where('code_parrainage', '==', trimmedCode));
            const parrainSnap = await getDocs(parrainQuery);
            let parrainDoc = parrainSnap.docs[0];
            
            if (!parrainDoc) {
              const parrainQueryLegacy = query(collection(db, 'users'), where('referralCode', '==', trimmedCode));
              const parrainSnapLegacy = await getDocs(parrainQueryLegacy);
              parrainDoc = parrainSnapLegacy.docs[0];
            }

            if (parrainDoc && parrainDoc.id !== firebaseUser.uid) {
              const parrainData = parrainDoc.data();
              await addDoc(collection(db, 'parrainages'), {
                parrainId: parrainDoc.id,
                parrainEmail: parrainData.email || '',
                parraineId: firebaseUser.uid,
                parraineEmail: registrationData.email?.trim() || '',
                date: new Date().toISOString(),
                status: 'en_attente'
              });
              console.log(`[Referral] Referral recorded (OTP). Parrain: ${parrainDoc.id}, Parraine: ${firebaseUser.uid}`);
            }
          } catch (err) {
            console.error("Error registering referral connection in OTP:", err);
          }
        }

        if ((registrationData.role === 'gerant' || registrationData.role === 'salon_coiffure') && registrationData.estData) {
          console.log("[Phone Auth] Rôle gérant détecté. Création de l'établissement...");
          try {
            const estPayload: any = {
              ownerId: firebaseUser.uid,
              name: registrationData.estData.name || '',
              category: registrationData.role === 'salon_coiffure' || registrationData.estData.category === 'salon_de_coiffure' ? 'salon_de_coiffure' : (registrationData.estData.category || 'autre'),
              country: registrationData.country || 'Burkina Faso',
              city: registrationData.city || 'Ouagadougou',
              neighborhood: registrationData.estData.neighborhood || '',
              address: registrationData.estData.address || '',
              phone: firebaseUser.phoneNumber || registrationData.phone,
              description: registrationData.estData.description || '',
              photos: registrationData.estData.photos || [],
              tags: registrationData.estData.tags || [],
              geolocation: registrationData.estData.geolocation || '',
              status: 'valide',
              averageRating: 0
            };
            if (registrationData.role === 'salon_coiffure' || registrationData.estData.category === 'salon_de_coiffure') {
              estPayload.hairSalonData = { hairdressers: [], hairstyles: [] };
            }
            await addDoc(collection(db, 'establishments'), estPayload);
            console.log("[Phone Auth] Établissement créé avec succès dans Firestore.");
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'establishments');
          }
        }

        if (registrationData.role === 'entreprise' && registrationData.entrepriseData) {
          console.log("[Phone Auth] Rôle entreprise détecté. Création de l'entreprise...");
          try {
            await setDoc(doc(db, 'entreprises', firebaseUser.uid), {
              name: registrationData.name.trim() || 'Entreprise',
              sector: registrationData.entrepriseData.sector || '',
              logo: registrationData.entrepriseData.logo || '',
              description: registrationData.entrepriseData.description || '',
              philosophy: registrationData.entrepriseData.philosophy || '',
              status: 'valide',
              createdAt: new Date().toISOString(),
              followers: []
            });
            console.log("[Phone Auth] Entreprise créée avec succès dans Firestore.");
          } catch (error) {
            handleFirestoreError(error, OperationType.WRITE, `entreprises/${firebaseUser.uid}`);
          }
        }
      }
    } catch (error: any) {
      console.error("[Phone Auth] Échec de la confirmation du code OTP :", error);
      const friendlyMessage = translateFirebaseError(error);
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const login = async (email: string, pass: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error("Veuillez saisir votre adresse e-mail.");
    }
    if (!pass) {
      throw new Error("Veuillez saisir votre mot de passe.");
    }

    try {
      console.log(`[Email Login] Tentative de connexion pour : [${trimmedEmail}]`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: pass
      });
      if (error) throw error;
      console.log("[Email Login] Connexion réussie.");
    } catch (error: any) {
      console.error("[Email Login] Échec de la connexion :", error);
      let friendlyMessage = error.message || "Erreur de connexion";
      if (friendlyMessage.toLowerCase().includes('email not confirmed')) {
        friendlyMessage = "Veuillez confirmer votre adresse e-mail en cliquant sur le lien que nous vous avons envoyé avant de vous connecter.";
      } else if (friendlyMessage.toLowerCase().includes('invalid login credentials')) {
        friendlyMessage = "Adresse e-mail ou mot de passe incorrect.";
      }
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const resetPassword = async (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      throw new Error("Veuillez saisir votre adresse e-mail.");
    }
    try {
      console.log(`[Password Reset] Envoi du lien de réinitialisation pour : [${trimmedEmail}]`);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
      console.log("[Password Reset] E-mail envoyé avec succès.");
    } catch (error: any) {
      console.error("[Password Reset] Échec de l'envoi :", error);
      const friendlyMessage = error.message || "Erreur de réinitialisation";
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const register = async (
    userData: Omit<User, 'id'>, 
    pass: string, 
    estData?: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] },
    entrepriseData?: { sector: string; logo: string; philosophy: string; description: string },
    referralCodeUsed?: string
  ) => {
    const emailStr = (userData.email || '').trim();
    if (!emailStr) throw new Error("L'adresse e-mail est obligatoire.");
    if (!pass || pass.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères.");

    try {
      console.log(`[Email Register] Tentative d'inscription pour : [${emailStr}]`);
      const { data, error } = await supabase.auth.signUp({
        email: emailStr,
        password: pass,
        options: { data: { name: userData.name, role: userData.role } }
      });
      
      if (error) {
        if (error.status === 429) {
          throw new Error("Le nombre maximum d'inscriptions a été atteint. Veuillez réessayer plus tard.");
        }
        throw error;
      }

      const userObj = data.user;
      if (!userObj) throw new Error("Erreur de création de compte.");
      
      const firebaseUser = { ...userObj, uid: userObj.id } as any;
      const isEmailConfirmationPending = !data.session;
      
      const resolvedCategory = estData?.category || 'maquis';
      let code_parrainage = '';
      if (userData.role === 'client') {
        const baseName = (userData.name || 'ZAKA').trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
        code_parrainage = `${baseName}${Math.floor(1000 + Math.random() * 9000)}`;
      }
      
      const newUserData: any = {
        name: userData.name.trim() || 'Utilisateur',
        email: emailStr,
        phone: userData.phone || '',
        role: userData.role,
        country: userData.country || 'Burkina Faso',
        city: userData.city || 'Ouagadougou',
        category: resolvedCategory,
        points: 0,
        ...(code_parrainage ? { code_parrainage, referralCode: code_parrainage } : {})
      };

      if (isEmailConfirmationPending) {
        console.log("[Email Register] Email confirmation required. Saving pending profile to localStorage.");
        const pendingRegistration = {
          userData: newUserData,
          estData: (userData.role === 'gerant' || userData.role === 'salon_coiffure') ? estData : null,
          entrepriseData: userData.role === 'entreprise' ? entrepriseData : null,
          referralCodeUsed,
          uid: firebaseUser.uid
        };
        localStorage.setItem('zaka_pending_registration', JSON.stringify(pendingRegistration));
        throw new Error("Inscription réussie ! Un email de confirmation vous a été envoyé. Veuillez vérifier votre boîte de réception pour activer votre compte.");
      }

      // Email confirmation disabled, so we insert directly to Supabase
      try {
        const { error: userError } = await supabase.from('users').upsert({ id: firebaseUser.uid, ...newUserData }, { onConflict: 'id' });
        if (userError) console.warn("Could not insert user profile in Supabase:", userError);
      } catch (error) {
        console.warn("Could not insert user profile.", error);
      }
      
      // We don't have an advertisers table in Supabase yet, we skip or you can add if needed.
      // But for 'gerant' or 'salon_coiffure', insert into establishments
      if ((userData.role === 'gerant' || userData.role === 'salon_coiffure') && estData) {
        try {
          const estPayload: any = {
            ownerId: firebaseUser.uid,
            name: estData.name || '',
            category: userData.role === 'salon_coiffure' ? 'salon_de_coiffure' : (estData.category || 'autre'),
            country: userData.country || 'Burkina Faso',
            city: userData.city || 'Ouagadougou',
            neighborhood: estData.neighborhood || '',
            address: estData.address || '',
            phone: userData.phone || '',
            description: estData.description || '',
            photos: estData.photos || [],
            tags: estData.tags || [],
            geolocation: estData.geolocation || '',
            status: 'valide',
            averageRating: 0
          };
          if (userData.role === 'salon_coiffure' || estData.category === 'salon_de_coiffure') {
            estPayload.hairSalonData = { hairdressers: [], hairstyles: [] };
          }
          const { error: estError } = await supabase.from('establishments').insert(estPayload);
          if (estError) console.warn("Could not insert establishment in Supabase:", estError);
        } catch (error) {
          console.warn("Could not insert establishment profile.", error);
        }
      }

      if (userData.role === 'entreprise' && entrepriseData) {
        try {
          const { error: entError } = await supabase.from('entreprises').insert({
            ownerId: firebaseUser.uid,
            name: userData.name.trim() || 'Entreprise',
            sector: entrepriseData.sector || '',
            logo: entrepriseData.logo || '',
            description: entrepriseData.description || '',
            philosophy: entrepriseData.philosophy || '',
            status: 'valide'
          });
          if (entError) console.warn("Could not insert entreprise in Supabase:", entError);
        } catch (error) {
          console.warn("Could not insert entreprise profile.", error);
        }
      }

    } catch (error: any) {
      console.error("[Email Register] Échec global d'inscription :", error);
      const friendlyMessage = error.message.includes('Inscription réussie') ? error.message : (error.status === 429 ? "Le nombre maximum d'inscriptions a été atteint. Veuillez réessayer plus tard." : translateFirebaseError(error));
      setGlobalError({
        message: friendlyMessage,
        code: error.code || 'unknown',
        type: 'error'
      });
      throw new Error(friendlyMessage);
    }
  };

  const logout = async () => {
    try {
      console.log("[Logout] Tentative de déconnexion...");
      // 1. Clear Supabase auth session if initialized
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
        } catch (sbErr) {
          console.warn("[Logout] Supabase signOut notice:", sbErr);
        }
      }
      // 2. Clear local state synchronously
      setConfirmationResult(null);
      setState(s => ({
        ...s,
        currentUser: null,
        loading: false
      }));
      // 3. Clear local and session storage
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('zaka_user_session');
        sessionStorage.clear();
      } catch (e) {
        // ignore
      }
      console.log("[Logout] Déconnecté avec succès.");
    } catch (error: any) {
      console.error("[Logout] Erreur lors de la déconnexion :", error);
      // Force local logout regardless of network or SDK errors
      setConfirmationResult(null);
      setState(s => ({ ...s, currentUser: null, loading: false }));
    }
  };

  const addEstablishment = async (est: Omit<Establishment, 'id' | 'status' | 'averageRating'>) => {
    try {
      await addDoc(collection(db, 'establishments'), {
        ...est,
        status: 'valide',
        averageRating: 0
      });
    } catch (error) {
      console.error("Erreur ajout etablissement:", error);
      throw error;
    }
  };

  const updateEstablishment = async (id: string, data: Partial<Establishment>) => {
    try {
      const cleanData = Object.entries(data).reduce((acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {} as any);
      await updateDoc(doc(db, 'establishments', id), cleanData);
    } catch (error) {
      console.error("Erreur mise à jour etablissement:", error);
      throw error;
    }
  };

  const deleteEntreprise = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'entreprises', id));
    } catch (error: any) {
      console.error("Erreur suppression entreprise:", error);
      handleFirestoreError(error, OperationType.DELETE, `entreprises/${id}`);
    }
  };

  const deleteEstablishment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'establishments', id));
    } catch (error: any) {
      console.error("Erreur suppression etablissement:", error);
      handleFirestoreError(error, OperationType.DELETE, `establishments/${id}`);
    }
  };

  const addPublication = async (pub: Omit<Publication, 'id' | 'views' | 'clicks' | 'createdAt'>) => {
    try {
      const cleanPub = Object.entries(pub).reduce((acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {} as any);

      await addDoc(collection(db, 'publications'), {
        ...cleanPub,
        views: 0,
        clicks: 0,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur ajout publication:", error);
      throw error;
    }
  };

  const deletePublication = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'publications', id));
    } catch (error) {
      console.error("Erreur suppression publication:", error);
      throw error;
    }
  };

  const addApplication = async (app: Omit<Application, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, 'applications'), {
        ...app,
        status: 'en_attente',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur ajout application:", error);
      throw error;
    }
  };

  const updateApplicationStatus = async (id: string, status: 'acceptee' | 'refusee') => {
    try {
      await updateDoc(doc(db, 'applications', id), { status });
    } catch (error) {
      console.error("Erreur mise à jour statut application:", error);
      throw error;
    }
  };

  const toggleFavorite = async (clientId: string, establishmentId: string) => {
    try {
      // Trigger haptic feedback vibration for tactile feedback
      triggerHapticFeedback(60);
      
      const userFavs = state.favorites[clientId] || [];
      const userTags = state.favoriteTags[clientId] || {};
      const isFav = userFavs.includes(establishmentId);
      const updatedFavs = isFav 
        ? userFavs.filter(id => id !== establishmentId)
        : [...userFavs, establishmentId];

      const updatedTags = { ...userTags };
      if (isFav) {
        delete updatedTags[establishmentId];
      }

      setState(s => ({
        ...s,
        favorites: {
          ...s.favorites,
          [clientId]: updatedFavs
        },
        favoriteTags: {
          ...s.favoriteTags,
          [clientId]: updatedTags
        }
      }));

      await setDoc(doc(db, 'favorites', clientId), {
        establishmentIds: updatedFavs,
        tags: updatedTags
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `favorites/${clientId}`);
    }
  };

  const updateFavoriteTags = async (clientId: string, establishmentId: string, tags: string[]) => {
    try {
      const userFavs = state.favorites[clientId] || [];
      const userTags = state.favoriteTags[clientId] || {};
      
      const updatedTags = {
        ...userTags,
        [establishmentId]: tags
      };

      setState(s => ({
        ...s,
        favoriteTags: {
          ...s.favoriteTags,
          [clientId]: updatedTags
        }
      }));

      await setDoc(doc(db, 'favorites', clientId), {
        establishmentIds: userFavs,
        tags: updatedTags
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `favorites/${clientId}`);
    }
  };

  const saveAllFavoriteTags = async (clientId: string, tagsMap: Record<string, string[]>) => {
    try {
      const userFavs = state.favorites[clientId] || [];
      
      setState(s => ({
        ...s,
        favoriteTags: {
          ...s.favoriteTags,
          [clientId]: tagsMap
        }
      }));

      await setDoc(doc(db, 'favorites', clientId), {
        establishmentIds: userFavs,
        tags: tagsMap
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `favorites/${clientId}`);
    }
  };

  const validateEstablishment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'establishments', id), {
        status: 'valide'
      });
    } catch (error) {
      console.error("Erreur validation etablissement:", error);
    }
  };

  const validateEntreprise = async (id: string) => {
    try {
      await updateDoc(doc(db, 'entreprises', id), {
        status: 'valide'
      });
    } catch (error) {
      console.error("Erreur validation entreprise:", error);
    }
  };

  const followEntreprise = async (clientId: string, entrepriseId: string) => {
    try {
      const entRef = doc(db, 'entreprises', entrepriseId);
      const entSnap = await getDoc(entRef);
      if (entSnap.exists()) {
        const data = entSnap.data();
        const followers = data.followers || [];
        if (!followers.includes(clientId)) {
          await updateDoc(entRef, {
            followers: [...followers, clientId]
          });
        }
      }
    } catch (error) {
      console.error("Erreur followEntreprise:", error);
    }
  };

  const unfollowEntreprise = async (clientId: string, entrepriseId: string) => {
    try {
      const entRef = doc(db, 'entreprises', entrepriseId);
      const entSnap = await getDoc(entRef);
      if (entSnap.exists()) {
        const data = entSnap.data();
        const followers = data.followers || [];
        await updateDoc(entRef, {
          followers: followers.filter((id: string) => id !== clientId)
        });
      }
    } catch (error) {
      console.error("Erreur unfollowEntreprise:", error);
    }
  };

  const upgradeToGerant = async (estData: Partial<Establishment> & { description?: string, photos?: string[], tags?: string[] }) => {
    if (!state.currentUser) return;
    try {
      // Create or update user doc
      await setDoc(doc(db, 'users', state.currentUser.id), {
        name: state.currentUser.name,
        email: state.currentUser.email || '',
        phone: state.currentUser.phone || '',
        role: 'gerant',
        country: state.currentUser.country || '',
        city: state.currentUser.city || 'Non spécifié' // Ensure city is not empty
      }, { merge: true });

      // Add establishment
      await addDoc(collection(db, 'establishments'), {
        ownerId: state.currentUser.id,
        name: estData.name || '',
        category: estData.category || 'autre',
        country: state.currentUser.country || '',
        city: state.currentUser.city || 'Non spécifié',
        neighborhood: estData.neighborhood || '',
        address: estData.address || '',
        phone: state.currentUser.phone || state.currentUser.email || '',
        description: estData.description || '',
        photos: estData.photos || [],
        tags: estData.tags || [],
        geolocation: estData.geolocation || '',
        status: 'valide',
        averageRating: 0
      });
    } catch (error) {
      console.error("Erreur lors de la mise à niveau vers gérant:", error);
      throw error;
    }
  };

  const updateProfile = async (profileData: { name: string; city: string; country: string; email?: string; phone?: string }) => {
    if (!state.currentUser) {
      throw new Error("Aucun utilisateur n'est connecté.");
    }
    try {
      const userDocRef = doc(db, 'users', state.currentUser.id);
      const updatedData = {
        ...state.currentUser,
        name: profileData.name.trim(),
        city: profileData.city.trim(),
        country: profileData.country.trim(),
        email: profileData.email?.trim() || state.currentUser.email || '',
        phone: profileData.phone?.trim() || state.currentUser.phone || '',
      };
      const { id, ...dataToSave } = updatedData;
      
      await setDoc(userDocRef, dataToSave, { merge: true });
      console.log("[updateProfile] Profil mis à jour avec succès dans Firestore.");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${state.currentUser.id}`);
    }
  };

  const createRelationshipRequest = async (req: Omit<RelationshipRequest, 'id' | 'status' | 'date'>) => {
    try {
      // Validate unique establishment for staff roles
      const restrictedRoles = ['serveur', 'caissier', 'menage', 'vigile'];
      if (req.requestedRole && restrictedRoles.includes(req.requestedRole)) {
        const existingRestricted = state.relationshipRequests.find(r => 
          (r.initiatorId === req.initiatorId || r.userId === req.initiatorId) && 
          r.status !== 'refusee' &&
          r.requestedRole && restrictedRoles.includes(r.requestedRole)
        );
        if (existingRestricted) {
          throw new Error("Vous ne pouvez être employé que dans un seul établissement à la fois (sauf Gérant et DJ).");
        }
      }

      const est = state.establishments.find(e => e.id === req.establishmentId);
      const user = state.currentUser;

      await addDoc(collection(db, 'relationshipRequests'), {
        ...req,
        userId: req.initiatorId,
        userName: user?.name || user?.email || 'Utilisateur',
        userPhone: user?.phone || '',
        establishmentName: est?.name || 'Établissement',
        status: 'en_attente',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createRelationshipRequest:", error);
      throw error;
    }
  };

  const updateRelationshipRequest = async (id: string, status: 'acceptee' | 'refusee') => {
    try {
      await updateDoc(doc(db, 'relationshipRequests', id), { status });
    } catch (error: any) {
      console.error("Erreur updateRelationshipRequest:", error);
      throw error;
    }
  };

  const toggleDJStatus = async (requestId: string, isDJ: boolean) => {
    try {
      await updateDoc(doc(db, 'relationshipRequests', requestId), { isDJ });
    } catch (error: any) {
      console.error("Erreur toggleDJStatus:", error);
      throw error;
    }
  };

  const toggleCaissierStatus = async (requestId: string, isCaissier: boolean) => {
    try {
      const requestedRole = isCaissier ? 'caissier' : 'client';
      if (isSupabaseConfigured) {
        await supabase.from('relationship_requests').update({ isCaissier, requestedRole }).eq('id', requestId);
      }
      await updateDoc(doc(db, 'relationshipRequests', requestId), { isCaissier, requestedRole });
    } catch (error: any) {
      console.error("Erreur toggleCaissierStatus:", error);
      throw error;
    }
  };

  const toggleServeurStatus = async (requestId: string, isServeur: boolean) => {
    try {
      const requestedRole = isServeur ? 'serveur' : 'client';
      if (isSupabaseConfigured) {
        await supabase.from('relationship_requests').update({ isServeur, requestedRole }).eq('id', requestId);
      }
      await updateDoc(doc(db, 'relationshipRequests', requestId), { isServeur, requestedRole });
    } catch (error: any) {
      console.error("Erreur toggleServeurStatus:", error);
      throw error;
    }
  };

  const addStockItem = async (item: Omit<StockItem, 'id' | 'createdAt'>) => {
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('stocks').insert([{
          establishmentId: item.establishmentId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          stock_faible: item.stock_faible ?? (item.quantity <= 5)
        }]).select().single();
        
        if (!error && data) {
          setState(s => ({
            ...s,
            stocks: [...s.stocks.filter(st => st.id !== data.id), data as StockItem]
          }));
        }
      }
      await addDoc(collection(db, 'stocks'), {
        ...item,
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      handleFirestoreError(error, OperationType.CREATE, 'stocks');
    }
  };

  const updateStockItem = async (id: string, updates: Partial<Omit<StockItem, 'id' | 'establishmentId'>>) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('stocks').update(updates).eq('id', id);
        setState(s => ({
          ...s,
          stocks: s.stocks.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
      }
      await updateDoc(doc(db, 'stocks', id), updates);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `stocks/${id}`);
    }
  };

  const deleteStockItem = async (id: string) => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('stocks').delete().eq('id', id);
        setState(s => ({
          ...s,
          stocks: s.stocks.filter(item => item.id !== id)
        }));
      }
    } catch (error: any) {
      console.error(`Error deleting stock item: ${id}`, error);
    }
  };

  const recordSale = async (sale: Omit<SaleRecord, 'id' | 'date'>) => {
    try {
      if (isSupabaseConfigured) {
        // 1. Decrement stock in Supabase
        for (const item of sale.items) {
          const { data: stockRow } = await supabase.from('stocks').select('quantity').eq('id', item.stockId).single();
          if (stockRow) {
            const nextQty = Math.max(0, (stockRow.quantity || 0) - item.quantity);
            await supabase.from('stocks').update({
              quantity: nextQty,
              stock_faible: nextQty <= 5
            }).eq('id', item.stockId);
          }
        }
        // 2. Insert sale record into Supabase ventes table
        const { data: saleData } = await supabase.from('ventes').insert([{
          establishmentId: sale.establishmentId,
          cashierId: sale.cashierId,
          cashierName: sale.cashierName || 'Caissier',
          serverName: sale.serverName || null,
          tableNote: sale.tableNote || null,
          clientType: sale.clientType || 'Ordinaire',
          items: sale.items,
          subtotalBoissons: sale.subtotalBoissons || null,
          subtotalCuisine: sale.subtotalCuisine || null,
          totalAchat: sale.totalAchat || null,
          discountAmount: sale.discountAmount || 0,
          totalAmount: sale.totalAmount,
          paidAmount: sale.paidAmount || null,
          changeAmount: sale.changeAmount || null,
          avoirAmount: sale.avoirAmount || null,
          mobileMoneyCode: sale.mobileMoneyCode || null,
          date: new Date().toISOString()
        }]).select().single();

        if (saleData) {
          setState(s => ({
            ...s,
            ventes: [saleData as SaleRecord, ...s.ventes]
          }));
        }
      }
    } catch (error: any) {
      console.error("Error recording sale in Supabase:", error);
      throw error;
    }
  };

  const createStaffReview = async (review: Omit<StaffReview, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, 'staffReviews'), {
        ...review,
        status: 'en_attente',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createStaffReview:", error);
      throw error;
    }
  };

  const updateStaffReviewStatus = async (
    id: string, 
    status: 'valide' | 'invalide', 
    managerNote?: string, 
    bonusOrSanction?: StaffReview['bonusOrSanction']
  ) => {
    try {
      const updateData: any = { status };
      if (managerNote !== undefined) updateData.managerNote = managerNote;
      if (bonusOrSanction !== undefined) updateData.bonusOrSanction = bonusOrSanction;
      await updateDoc(doc(db, 'staffReviews', id), updateData);
    } catch (error: any) {
      console.error("Erreur updateStaffReviewStatus:", error);
      throw error;
    }
  };

  const createStaffAttendance = async (attendance: Omit<StaffAttendance, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'staffAttendances'), {
        ...attendance,
        createdAt: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createStaffAttendance:", error);
      throw error;
    }
  };

  const deleteStaffAttendance = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staffAttendances', id));
    } catch (error: any) {
      console.error("Erreur deleteStaffAttendance:", error);
      throw error;
    }
  };

  const createServiceRequest = async (req: Omit<ServiceRequest, 'id' | 'status' | 'date'>) => {
    try {
      await addDoc(collection(db, 'serviceRequests'), {
        ...req,
        status: 'en_attente',
        date: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Erreur createServiceRequest:", error);
      throw error;
    }
  };

  const updateServiceRequest = async (id: string, status: 'validee' | 'refusee', managerMessage?: string) => {
    try {
      await updateDoc(doc(db, 'serviceRequests', id), { status, managerMessage });
    } catch (error: any) {
      console.error("Erreur updateServiceRequest:", error);
      throw error;
    }
  };

  const createConversation = async (clientId: string, establishmentId: string, clientName: string, establishmentName: string, ownerId: string) => {
    const convId = `${clientId}_${establishmentId}`;
    const convRef = doc(db, 'conversations', convId);
    
    // Check if exists
    const convSnap = await getDoc(convRef);
    if (convSnap.exists()) {
      return convId;
    }

    await setDoc(convRef, {
      clientId,
      clientName,
      establishmentId,
      establishmentName,
      ownerId,
      lastMessage: 'Discussion démarrée',
      lastMessageAt: new Date().toISOString(),
      lastSenderId: auth.currentUser?.uid || clientId,
      unreadByClient: auth.currentUser?.uid === ownerId,
      unreadByGerant: auth.currentUser?.uid === clientId
    });
    return convId;
  };

  const addReview = async (review: Omit<Review, 'id' | 'date'>) => {
    try {
      await addDoc(collection(db, 'reviews'), {
        ...review,
        date: new Date().toISOString()
      });

      // Award +10 Zaka points for leaving a review
      awardZakaPoints(review.clientId, 10, 'Avis publié');

      // Handle referral unlock if this is the client's first review
      try {
        const clientReviews = state.reviews.filter(r => r.clientId === review.clientId);
        if (clientReviews.length === 0) {
          const referralQuery = query(
            collection(db, 'parrainages'),
            where('parraineId', '==', review.clientId),
            where('status', '==', 'en_attente')
          );
          const referralSnap = await getDocs(referralQuery);
          if (!referralSnap.empty) {
            const referralDoc = referralSnap.docs[0];
            const referralData = referralDoc.data();
            
            // Unlock referral
            await updateDoc(doc(db, 'parrainages', referralDoc.id), {
              status: 'debloque',
              unlockedAt: new Date().toISOString()
            });
            
            // Reward parrain: add 10 points
            const parrainDocRef = doc(db, 'users', referralData.parrainId);
            const parrainSnap = await getDoc(parrainDocRef);
            if (parrainSnap.exists()) {
              const currentParrainPoints = parrainSnap.data().points || 0;
              await updateDoc(parrainDocRef, { points: currentParrainPoints + 10 });
            }
            
            // Reward parraine: add 10 points
            const parraineDocRef = doc(db, 'users', review.clientId);
            const parraineSnap = await getDoc(parraineDocRef);
            if (parraineSnap.exists()) {
              const currentParrainePoints = parraineSnap.data().points || 0;
              await updateDoc(parraineDocRef, { points: currentParrainePoints + 10 });
            }
            
            console.log(`[Referral] Referral unlocked successfully in addReview!`);
          }
        }
      } catch (refErr) {
        console.error("Error unlocking referral in addReview:", refErr);
      }
    } catch (error) {
      console.error("Erreur ajout avis:", error);
      throw error;
    }
  };

  const replyToReview = async (reviewId: string, reply: string) => {
    try {
      await updateDoc(doc(db, 'reviews', reviewId), {
        reply,
        replyDate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur reponse avis:", error);
      throw error;
    }
  };

  const addReservation = async (res: Omit<Reservation, 'id' | 'status' | 'createdAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'reservations'), {
        ...res,
        status: 'en_attente',
        createdAt: now,
        history: [{ status: 'en_attente', updatedAt: now }]
      });
    } catch (error) {
      console.error("Erreur addReservation:", error);
      throw error;
    }
  };

  const updateReservationStatus = async (id: string, status: 'en_attente' | 'confirmee' | 'refusee' | 'annulee', managerMessage?: string) => {
    try {
      const now = new Date().toISOString();
      const resRef = doc(db, 'reservations', id);
      const resSnap = await getDoc(resRef);
      if (!resSnap.exists()) throw new Error("Réservation introuvable");
      
      const currentData = resSnap.data() as Reservation;
      const history = currentData.history || [];
      const updatedHistory = [...history, { status, updatedAt: now, comment: managerMessage }];
      
      const updates: any = {
        status,
        history: updatedHistory
      };
      if (managerMessage !== undefined) {
        updates.managerMessage = managerMessage;
      }
      await updateDoc(resRef, updates);
    } catch (error) {
      console.error("Erreur updateReservationStatus:", error);
      throw error;
    }
  };

  const addTakeawayOrder = async (order: Omit<TakeawayOrder, 'id' | 'status' | 'createdAt' | 'date'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'takeawayOrders'), {
        ...order,
        status: 'recue',
        date: now.split('T')[0],
        createdAt: now
      });
    } catch (error) {
      console.error("Erreur addTakeawayOrder:", error);
      throw error;
    }
  };

  const updateTakeawayOrderStatus = async (id: string, status: TakeawayOrder['status']) => {
    try {
      const orderRef = doc(db, 'takeawayOrders', id);
      const orderDoc = await getDoc(orderRef);
      const data = orderDoc.data() as TakeawayOrder;
      
      await updateDoc(orderRef, { status });

      if (status === 'prete' && data.clientId && data.establishmentId) {
        // Increment loyalty card if enabled
        const estDoc = await getDoc(doc(db, 'establishments', data.establishmentId));
        const estData = estDoc.data() as Establishment;
        if (estData?.loyaltyEnabled) {
          const cardId = `${data.clientId}_${data.establishmentId}`;
          const cardRef = doc(db, 'loyaltyCards', cardId);
          const cardDoc = await getDoc(cardRef);
          if (cardDoc.exists()) {
            const cardData = cardDoc.data() as LoyaltyCard;
            await updateDoc(cardRef, {
              visitCount: cardData.visitCount + 1,
              lastVisitDate: new Date().toISOString()
            });
          } else {
            await setDoc(cardRef, {
              clientId: data.clientId,
              clientName: data.clientName,
              establishmentId: data.establishmentId,
              visitCount: 1,
              rewardUnlocked: false,
              lastVisitDate: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error("Erreur updateTakeawayOrderStatus:", error);
      throw error;
    }
  };

  const addMenuDuJour = async (menu: Omit<MenuDuJour, 'id' | 'publishedAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'menus_du_jour'), {
        ...menu,
        publishedAt: now
      });
    } catch (error) {
      console.error("Erreur addMenuDuJour:", error);
      throw error;
    }
  };

  const updateHairSalonData = async (id: string, data: HairSalonData) => {
    try {
      await updateDoc(doc(db, 'establishments', id), {
        hairSalonData: data
      });
    } catch (error) {
      console.error("Erreur updateHairSalonData:", error);
      handleFirestoreError(error, OperationType.UPDATE, `establishments/${id}`);
    }
  };

  const trackEstablishmentView = async (establishmentId: string) => {
    try {
      const est = state.establishments.find(e => e.id === establishmentId);
      if (!est) return;
      if (state.currentUser && state.currentUser.id === est.ownerId) {
        console.log("[trackEstablishmentView] Skipping view since current user is owner.");
        return;
      }
      const now = new Date().toISOString();
      await addDoc(collection(db, 'establishment_views'), {
        establishmentId,
        userId: state.currentUser?.id || null,
        timestamp: now
      });
      console.log("[trackEstablishmentView] Registered view for", establishmentId);
    } catch (error) {
      console.error("Erreur trackEstablishmentView:", error);
    }
  };

  const trackPublicationView = async (publicationId: string) => {
    try {
      const pub = state.publications.find(p => p.id === publicationId);
      if (!pub) return;
      const est = state.establishments.find(e => e.id === pub.establishmentId);
      if (est && state.currentUser && state.currentUser.id === est.ownerId) {
        console.log("[trackPublicationView] Skipping view since current user is owner.");
        return;
      }
      const now = new Date().toISOString();
      await addDoc(collection(db, 'publication_views'), {
        publicationId,
        userId: state.currentUser?.id || null,
        timestamp: now
      });
      await updateDoc(doc(db, 'publications', publicationId), {
        views: (pub.views || 0) + 1
      });
      console.log("[trackPublicationView] Registered view for publication", publicationId);
    } catch (error) {
      console.error("Erreur trackPublicationView:", error);
    }
  };

  const addCarnetEntry = async (entry: Omit<CarnetEntry, 'id'>) => {
    try {
      const now = entry.date || new Date().toISOString();
      await addDoc(collection(db, 'carnet_entrees'), {
        ...entry,
        date: now
      });

      // If user checks in a visit ("J'y suis allé")
      if (entry.type === 'visite' && state.currentUser) {
        // 1. Award +15 Zaka points
        awardZakaPoints(state.currentUser.id, 15, 'Visite établissement');

        // 2. Check if establishment has loyalty enabled
        const est = state.establishments.find(e => e.id === entry.establishmentId);
        if (est && est.loyaltyEnabled) {
          const reqVisits = est.loyaltyRequiredVisits || 5;
          const cardId = `${state.currentUser.id}_${entry.establishmentId}`;
          const cardRef = doc(db, 'loyalty_cards', cardId);
          const cardSnap = await getDoc(cardRef);

          if (cardSnap.exists()) {
            const currentData = cardSnap.data() as LoyaltyCard;
            const newCount = (currentData.visitCount || 0) + 1;
            const unlocked = newCount >= reqVisits;
            await updateDoc(cardRef, {
              visitCount: newCount,
              rewardUnlocked: unlocked || currentData.rewardUnlocked,
              lastVisitDate: now,
              clientName: state.currentUser.name
            });
          } else {
            const unlocked = 1 >= reqVisits;
            await setDoc(cardRef, {
              clientId: state.currentUser.id,
              clientName: state.currentUser.name,
              establishmentId: entry.establishmentId,
              visitCount: 1,
              rewardUnlocked: unlocked,
              lastVisitDate: now
            });
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'carnet_entrees');
    }
  };

  const updateCarnetEntryNote = async (id: string, note: string) => {
    try {
      await updateDoc(doc(db, 'carnet_entrees', id), {
        privateNote: note
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `carnet_entrees/${id}`);
    }
  };

  const deleteCarnetEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'carnet_entrees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `carnet_entrees/${id}`);
    }
  };

  // --- NEW FEATURES METHODS ---
  const updateCrowdStatus = async (establishmentId: string, status: 'calme' | 'anime' | 'complet' | null) => {
    try {
      await updateDoc(doc(db, 'establishments', establishmentId), {
        crowdStatus: status,
        crowdStatusUpdatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur updateCrowdStatus:", error);
      handleFirestoreError(error, OperationType.UPDATE, `establishments/${establishmentId}`);
    }
  };

  const updateLoyaltyConfig = async (establishmentId: string, enabled: boolean, requiredVisits: number, reward: string) => {
    try {
      await updateDoc(doc(db, 'establishments', establishmentId), {
        loyaltyEnabled: enabled,
        loyaltyRequiredVisits: requiredVisits,
        loyaltyReward: reward
      });
    } catch (error) {
      console.error("Erreur updateLoyaltyConfig:", error);
      handleFirestoreError(error, OperationType.UPDATE, `establishments/${establishmentId}`);
    }
  };

  const consumeLoyaltyReward = async (cardId: string) => {
    try {
      const cardRef = doc(db, 'loyalty_cards', cardId);
      const cardSnap = await getDoc(cardRef);
      if (cardSnap.exists()) {
        const data = cardSnap.data() as LoyaltyCard;
        const est = state.establishments.find(e => e.id === data.establishmentId);
        const reqVisits = est?.loyaltyRequiredVisits || 5;
        const remainingVisits = Math.max(0, (data.visitCount || 0) - reqVisits);
        await updateDoc(cardRef, {
          visitCount: remainingVisits,
          rewardUnlocked: remainingVisits >= reqVisits
        });
      }
    } catch (error) {
      console.error("Erreur consumeLoyaltyReward:", error);
    }
  };

  const updateZakaPointsConfig = async (establishmentId: string, acceptsPoints: boolean, pointsCost: number, rewardDescription: string) => {
    try {
      await updateDoc(doc(db, 'establishments', establishmentId), {
        acceptsZakaPoints: acceptsPoints,
        zakaPointsCost: pointsCost,
        zakaPointsReward: rewardDescription
      });
    } catch (error) {
      console.error("Erreur updateZakaPointsConfig:", error);
      handleFirestoreError(error, OperationType.UPDATE, `establishments/${establishmentId}`);
    }
  };

  const awardZakaPoints = async (userId: string, pointsAmount: number, reason: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentPoints = userSnap.data().points || 0;
        await updateDoc(userRef, {
          points: currentPoints + pointsAmount
        });
        console.log(`[Zaka Points] Awarded ${pointsAmount} pts to ${userId} for ${reason}`);
      }
    } catch (error) {
      console.error("Erreur awardZakaPoints:", error);
    }
  };

  const redeemZakaPoints = async (establishmentId: string, pointsCost: number, rewardDescription: string): Promise<string> => {
    try {
      if (!state.currentUser) throw new Error("Veuillez vous connecter pour utiliser vos points");
      const userRef = doc(db, 'users', state.currentUser.id);
      const userSnap = await getDoc(userRef);
      const currentPoints = (userSnap.exists() ? userSnap.data().points : state.currentUser.points) || 0;

      if (currentPoints < pointsCost) {
        throw new Error(`Solde de points Zaka insuffisant (${currentPoints}/${pointsCost} pts)`);
      }

      const est = state.establishments.find(e => e.id === establishmentId);
      const estName = est ? est.name : 'Établissement';
      const code = 'ZAKA-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      await updateDoc(userRef, {
        points: currentPoints - pointsCost
      });

      await addDoc(collection(db, 'zaka_redemptions'), {
        clientId: state.currentUser.id,
        clientName: state.currentUser.name,
        establishmentId,
        establishmentName: estName,
        pointsUsed: pointsCost,
        reward: rewardDescription,
        code,
        status: 'valide',
        createdAt: new Date().toISOString()
      });

      return code;
    } catch (error) {
      console.error("Erreur redeemZakaPoints:", error);
      throw error;
    }
  };

  const consumeZakaRedemption = async (redemptionId: string) => {
    try {
      await updateDoc(doc(db, 'zaka_redemptions', redemptionId), {
        status: 'consomme'
      });
    } catch (error) {
      console.error("Erreur consumeZakaRedemption:", error);
    }
  };

  const createGroupOuting = async (
    outing: Omit<GroupOuting, 'id' | 'responses' | 'createdAt' | 'creatorId' | 'creatorName' | 'shareCode'>,
    invitedFriendIds?: string[]
  ): Promise<string> => {
    try {
      if (!state.currentUser) throw new Error("Veuillez vous connecter");
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const now = new Date().toISOString();

      const initialResponses: any[] = [
        {
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          status: 'je_viens',
          updatedAt: now
        }
      ];

      if (invitedFriendIds && invitedFriendIds.length > 0) {
        invitedFriendIds.forEach(friendId => {
          const friendUser = state.users.find(u => u.id === friendId);
          if (friendUser && friendId !== state.currentUser?.id) {
            initialResponses.push({
              userId: friendUser.id,
              userName: friendUser.name,
              status: 'peut_etre',
              updatedAt: now
            });
          }
        });
      }

      const docRef = await addDoc(collection(db, 'group_outings'), {
        ...outing,
        creatorId: state.currentUser.id,
        creatorName: state.currentUser.name,
        shareCode,
        responses: initialResponses,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur createGroupOuting:", error);
      throw error;
    }
  };

  const inviteFriendsToGroupOuting = async (outingId: string, friendIds: string[]) => {
    try {
      const docRef = doc(db, 'group_outings', outingId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Sortie introuvable");
      const data = snap.data() as GroupOuting;
      const now = new Date().toISOString();

      const existingResponses = [...(data.responses || [])];
      friendIds.forEach(friendId => {
        if (!existingResponses.some(r => r.userId === friendId)) {
          const friendUser = state.users.find(u => u.id === friendId);
          if (friendUser) {
            existingResponses.push({
              userId: friendUser.id,
              userName: friendUser.name,
              status: 'peut_etre',
              updatedAt: now
            });
          }
        }
      });

      await updateDoc(docRef, { responses: existingResponses });
    } catch (error) {
      console.error("Erreur inviteFriendsToGroupOuting:", error);
      throw error;
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    try {
      if (!state.currentUser) throw new Error("Veuillez vous connecter pour ajouter un ami");
      if (state.currentUser.id === targetUserId) throw new Error("Vous ne pouvez pas vous ajouter vous-même.");
      
      const u1 = state.currentUser.id < targetUserId ? state.currentUser.id : targetUserId;
      const u2 = state.currentUser.id < targetUserId ? targetUserId : state.currentUser.id;
      
      const existing = state.friendships.find(f => f.user1Id === u1 && f.user2Id === u2);
      if (existing) {
        if (existing.status === 'accepted') {
          throw new Error("Vous êtes déjà ami(e)s !");
        } else if (existing.status === 'pending') {
          throw new Error("Une demande d'amitié est déjà en cours.");
        }
      }

      const now = new Date().toISOString();
      await addDoc(collection(db, 'friendships'), {
        user1Id: u1,
        user2Id: u2,
        requesterId: state.currentUser.id,
        status: 'pending',
        createdAt: now
      });
    } catch (error) {
      console.error("Erreur sendFriendRequest:", error);
      throw error;
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted'
      });
    } catch (error) {
      console.error("Erreur acceptFriendRequest:", error);
      throw error;
    }
  };

  const declineFriendRequest = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'declined'
      });
    } catch (error) {
      console.error("Erreur declineFriendRequest:", error);
      throw error;
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      console.error("Erreur removeFriend:", error);
      throw error;
    }
  };

  const respondGroupOuting = async (outingId: string, status: 'je_viens' | 'peut_etre' | 'je_ne_peux_pas') => {
    try {
      if (!state.currentUser) throw new Error("Veuillez vous connecter");
      const docRef = doc(db, 'group_outings', outingId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Sortie de groupe introuvable");
      const data = snap.data() as GroupOuting;
      const now = new Date().toISOString();

      const responses = (data.responses || []).filter(r => r.userId !== state.currentUser!.id);
      responses.push({
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        status,
        updatedAt: now
      });

      await updateDoc(docRef, { responses });
    } catch (error) {
      console.error("Erreur respondGroupOuting:", error);
      throw error;
    }
  };

  const deleteGroupOuting = async (outingId: string) => {
    try {
      await deleteDoc(doc(db, 'group_outings', outingId));
    } catch (error) {
      console.error("Erreur deleteGroupOuting:", error);
    }
  };

  const updateGroupOutingLocation = async (outingId: string, location: { lat: number; lng: number; isSharing: boolean }) => {
    try {
      if (!state.currentUser) throw new Error("Veuillez vous connecter");
      const docRef = doc(db, 'group_outings', outingId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error("Sortie introuvable");
      const data = snap.data() as GroupOuting;
      const now = new Date().toISOString();

      const existingLocations = data.liveLocations || {};
      const updatedLocations = {
        ...existingLocations,
        [state.currentUser.id]: {
          userId: state.currentUser.id,
          userName: state.currentUser.name,
          lat: location.lat,
          lng: location.lng,
          updatedAt: now,
          isSharing: location.isSharing
        }
      };

      await updateDoc(docRef, { liveLocations: updatedLocations });
    } catch (error) {
      console.error("Erreur updateGroupOutingLocation:", error);
      throw error;
    }
  };

  // --- ZAKA ADS METHODS ---
  const addCampaign = async (
    campaignData: Omit<Campaign, 'id' | 'createdAt' | 'budgetSpent'>, 
    adCreatives?: Omit<Ad, 'id' | 'campaignId' | 'impressions' | 'views' | 'clicks' | 'conversions' | 'createdAt'>[]
  ): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const campRef = await addDoc(collection(db, 'campaigns'), {
        ...campaignData,
        budgetSpent: 0,
        createdAt: now
      });

      if (adCreatives && adCreatives.length > 0) {
        for (const creative of adCreatives) {
          await addDoc(collection(db, 'ads'), {
            ...creative,
            campaignId: campRef.id,
            advertiserId: campaignData.advertiserId,
            advertiserName: campaignData.advertiserName,
            impressions: 0,
            views: 0,
            clicks: 0,
            conversions: 0,
            status: campaignData.status === 'active' ? 'active' : 'en_attente',
            createdAt: now
          });
        }
      }

      console.log("[ZAKA Ads] Campaign created:", campRef.id);
      return campRef.id;
    } catch (error) {
      console.error("Erreur addCampaign:", error);
      handleFirestoreError(error, OperationType.CREATE, 'campaigns');
      throw error;
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: CampaignStatus) => {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId), { status });
      // Update ads status as well
      const matchingAds = state.ads.filter(a => a.campaignId === campaignId);
      for (const adItem of matchingAds) {
        await updateDoc(doc(db, 'ads', adItem.id), {
          status: status === 'active' ? 'active' : status === 'pause' ? 'pause' : 'en_attente'
        });
      }
    } catch (error) {
      console.error("Erreur updateCampaignStatus:", error);
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  const addAdCreative = async (adData: Omit<Ad, 'id' | 'impressions' | 'views' | 'clicks' | 'conversions' | 'createdAt'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'ads'), {
        ...adData,
        impressions: 0,
        views: 0,
        clicks: 0,
        conversions: 0,
        createdAt: now
      });
    } catch (error) {
      console.error("Erreur addAdCreative:", error);
      handleFirestoreError(error, OperationType.CREATE, 'ads');
    }
  };

  const trackAdImpression = async (adId: string) => {
    try {
      const targetAd = state.ads.find(a => a.id === adId);
      if (!targetAd) return;

      // Update Ad document
      const newImp = (targetAd.impressions || 0) + 1;
      await updateDoc(doc(db, 'ads', adId), { impressions: newImp });

      // Record daily stat
      const today = new Date().toISOString().split('T')[0];
      const existingStat = state.adDailyStats.find(s => s.campaignId === targetAd.campaignId && s.date === today);

      if (existingStat) {
        await updateDoc(doc(db, 'adStatistics', existingStat.id), {
          impressions: (existingStat.impressions || 0) + 1
        });
      } else {
        await addDoc(collection(db, 'adStatistics'), {
          campaignId: targetAd.campaignId,
          advertiserId: targetAd.advertiserId,
          date: today,
          impressions: 1,
          clicks: 0,
          views: 0,
          conversions: 0
        });
      }
    } catch (error) {
      console.error("Erreur trackAdImpression:", error);
    }
  };

  const trackAdClick = async (adId: string) => {
    try {
      const targetAd = state.ads.find(a => a.id === adId);
      if (!targetAd) return;

      const newClicks = (targetAd.clicks || 0) + 1;
      await updateDoc(doc(db, 'ads', adId), { clicks: newClicks });

      // Record daily stat
      const today = new Date().toISOString().split('T')[0];
      const existingStat = state.adDailyStats.find(s => s.campaignId === targetAd.campaignId && s.date === today);

      if (existingStat) {
        await updateDoc(doc(db, 'adStatistics', existingStat.id), {
          clicks: (existingStat.clicks || 0) + 1
        });
      } else {
        await addDoc(collection(db, 'adStatistics'), {
          campaignId: targetAd.campaignId,
          advertiserId: targetAd.advertiserId,
          date: today,
          impressions: 0,
          clicks: 1,
          views: 0,
          conversions: 0
        });
      }
    } catch (error) {
      console.error("Erreur trackAdClick:", error);
    }
  };

  const processAdPayment = async (paymentData: Omit<AdPayment, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const isAdmin = state.currentUser?.role === 'admin';
      const initialStatus = isAdmin ? 'valide' : 'en_attente';

      const payRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        status: initialStatus,
        createdAt: now
      });

      if (initialStatus === 'valide') {
        // Auto-generate invoice
        const invoiceNum = `INV-ZAKA-${Math.floor(100000 + Math.random() * 900000)}`;
        await addDoc(collection(db, 'invoices'), {
          paymentId: payRef.id,
          advertiserId: paymentData.advertiserId,
          advertiserName: paymentData.advertiserName,
          amount: paymentData.amount,
          packOrCampaign: paymentData.packName || 'Campagne Publicitaire',
          pdfNumber: invoiceNum,
          date: now,
          status: 'payee'
        });

        if (paymentData.campaignId) {
          await updateDoc(doc(db, 'campaigns', paymentData.campaignId), { status: 'active' });
        }
      }

      return payRef.id;
    } catch (error) {
      console.error("Erreur processAdPayment:", error);
      handleFirestoreError(error, OperationType.CREATE, 'payments');
      throw error;
    }
  };

  const validateAdPayment = async (paymentId: string) => {
    try {
      const payment = state.adPayments.find(p => p.id === paymentId);
      if (!payment) return;

      await updateDoc(doc(db, 'payments', paymentId), { status: 'valide' });

      // Generate Invoice
      const now = new Date().toISOString();
      const invoiceNum = `INV-ZAKA-${Math.floor(100000 + Math.random() * 900000)}`;
      await addDoc(collection(db, 'invoices'), {
        paymentId,
        advertiserId: payment.advertiserId,
        advertiserName: payment.advertiserName,
        amount: payment.amount,
        packOrCampaign: payment.packName || 'Campagne Publicitaire',
        pdfNumber: invoiceNum,
        date: now,
        status: 'payee'
      });

      // Activate campaign if linked
      if (payment.campaignId) {
        await updateCampaignStatus(payment.campaignId, 'active');
      }
    } catch (error) {
      console.error("Erreur validateAdPayment:", error);
      handleFirestoreError(error, OperationType.UPDATE, `payments/${paymentId}`);
    }
  };

  const validateCampaignByAdmin = async (campaignId: string) => {
    try {
      await updateCampaignStatus(campaignId, 'active');
      await addAdAuditLog({
        userId: state.currentUser?.id || 'admin',
        userName: state.currentUser?.name || 'Admin',
        action: 'Campaign Approved',
        resourceType: 'campaign',
        resourceId: campaignId,
        details: 'Campagne approuvée directement par un administrateur régie.'
      });
    } catch (error) {
      console.error("Erreur validateCampaignByAdmin:", error);
      handleFirestoreError(error, OperationType.UPDATE, `campaigns/${campaignId}`);
    }
  };

  const createAdOrganization = async (orgData: Omit<AdOrganization, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'adOrganizations'), {
        ...orgData,
        createdAt: now
      });
      await addAdAuditLog({
        userId: state.currentUser?.id || 'user',
        userName: state.currentUser?.name || 'Utilisateur',
        action: 'Organization Created',
        resourceType: 'organization',
        resourceId: docRef.id,
        details: `Création de l'organisation ${orgData.name} (${orgData.type})`
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur createAdOrganization:", error);
      throw error;
    }
  };

  const updateAdOrganization = async (id: string, data: Partial<AdOrganization>) => {
    try {
      await updateDoc(doc(db, 'adOrganizations', id), data);
    } catch (error) {
      console.error("Erreur updateAdOrganization:", error);
      throw error;
    }
  };

  const moderateCampaignByAdmin = async (
    campaignId: string, 
    status: CampaignStatus, 
    rejectionReason?: Campaign['rejectionReason'], 
    comment?: string
  ) => {
    try {
      const updatePayload: any = { status };
      if (rejectionReason) updatePayload.rejectionReason = rejectionReason;
      if (comment) updatePayload.moderationComment = comment;

      await updateDoc(doc(db, 'campaigns', campaignId), updatePayload);
      
      // Update ads matching this campaign
      const matchingAds = state.ads.filter(a => a.campaignId === campaignId);
      for (const adItem of matchingAds) {
        await updateDoc(doc(db, 'ads', adItem.id), {
          status: status === 'active' ? 'active' : status === 'pause' ? 'pause' : 'en_attente'
        });
      }

      await addAdAuditLog({
        userId: state.currentUser?.id || 'admin',
        userName: state.currentUser?.name || 'Régie Admin',
        action: `Campaign Status -> ${status}`,
        resourceType: 'campaign',
        resourceId: campaignId,
        details: comment ? `Raison: ${rejectionReason || 'Non spécifiée'} - ${comment}` : `Statut mis à jour vers ${status}`
      });
    } catch (error) {
      console.error("Erreur moderateCampaignByAdmin:", error);
      throw error;
    }
  };

  const addAdAuditLog = async (log: Omit<AdAuditLog, 'id' | 'timestamp'>) => {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'adAuditLogs'), {
        ...log,
        timestamp: now
      });
    } catch (error) {
      console.error("Erreur addAdAuditLog:", error);
    }
  };

  const updateAdRateConfig = async (rate: Omit<AdRateConfig, 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      if (rate.id) {
        await setDoc(doc(db, 'adRates', rate.id), { ...rate, updatedAt: now }, { merge: true });
      } else {
        await addDoc(collection(db, 'adRates'), { ...rate, updatedAt: now });
      }
      await addAdAuditLog({
        userId: state.currentUser?.id || 'admin',
        userName: state.currentUser?.name || 'Admin',
        action: 'Rate Config Updated',
        resourceType: 'rate',
        resourceId: rate.placement || 'general',
        details: `Mise à jour tarif: CPM=${rate.cpmPrice} FCFA, CPC=${rate.cpcPrice} FCFA`
      });
    } catch (error) {
      console.error("Erreur updateAdRateConfig:", error);
    }
  };

  const createAdSupportTicket = async (ticket: Omit<AdSupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'> & { initialMessage: string }): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'adSupportTickets'), {
        advertiserId: ticket.advertiserId,
        advertiserName: ticket.advertiserName,
        campaignId: ticket.campaignId || '',
        subject: ticket.subject,
        category: ticket.category,
        status: 'ouvert',
        priority: ticket.priority,
        messages: [{
          id: `msg-${Date.now()}`,
          senderId: state.currentUser?.id || ticket.advertiserId,
          senderName: state.currentUser?.name || ticket.advertiserName,
          text: ticket.initialMessage,
          createdAt: now,
          isAdmin: state.currentUser?.role === 'admin'
        }],
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur createAdSupportTicket:", error);
      throw error;
    }
  };

  const respondAdSupportTicket = async (ticketId: string, messageText: string, isAdmin: boolean = false) => {
    try {
      const now = new Date().toISOString();
      const ticket = state.adSupportTickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const newMsg = {
        id: `msg-${Date.now()}`,
        senderId: state.currentUser?.id || 'user',
        senderName: state.currentUser?.name || (isAdmin ? 'Support ZAKA' : 'Annonceur'),
        text: messageText,
        createdAt: now,
        isAdmin
      };

      const updatedMsgs = [...(ticket.messages || []), newMsg];
      await updateDoc(doc(db, 'adSupportTickets', ticketId), {
        messages: updatedMsgs,
        status: isAdmin ? 'en_cours' : 'ouvert',
        updatedAt: now
      });
    } catch (error) {
      console.error("Erreur respondAdSupportTicket:", error);
      throw error;
    }
  };

  const addAdCreativeLibraryItem = async (creative: Omit<AdCreative, 'id' | 'createdAt'>): Promise<string> => {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, 'adCreatives'), {
        ...creative,
        createdAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error("Erreur addAdCreativeLibraryItem:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      ...state,
      unreadCount,
      login,
      resetPassword,
      logout,
      register,
      envoyerCodeOtp,
      confirmerCodeOtp,
      addEstablishment,
      updateEstablishment,
      deleteEntreprise,
      deleteEstablishment,
      addPublication,
      deletePublication,
      toggleFavorite,
      updateFavoriteTags,
      saveAllFavoriteTags,
      validateEstablishment,
      validateEntreprise,
      followEntreprise,
      unfollowEntreprise,
      upgradeToGerant,
      updateProfile,
      createRelationshipRequest,
      updateRelationshipRequest,
      createServiceRequest,
      updateServiceRequest,
      createConversation,
      toggleDJStatus,
      toggleCaissierStatus,
      toggleServeurStatus,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      recordSale,
      addApplication,
      updateApplicationStatus,
      addReview,
      replyToReview,
      addReservation,
      updateReservationStatus,
      addTakeawayOrder,
      updateTakeawayOrderStatus,
      addMenuDuJour,
      updateHairSalonData,
      trackEstablishmentView,
      trackPublicationView,
      addCarnetEntry,
      updateCarnetEntryNote,
      deleteCarnetEntry,
      createStaffReview,
      updateStaffReviewStatus,
      createStaffAttendance,
      deleteStaffAttendance,
      addCampaign,
      updateCampaignStatus,
      addAdCreative,
      trackAdImpression,
      trackAdClick,
      processAdPayment,
      validateAdPayment,
      validateCampaignByAdmin,
      createAdOrganization,
      updateAdOrganization,
      moderateCampaignByAdmin,
      addAdAuditLog,
      updateAdRateConfig,
      createAdSupportTicket,
      respondAdSupportTicket,
      addAdCreativeLibraryItem,
      updateCrowdStatus,
      updateLoyaltyConfig,
      consumeLoyaltyReward,
      updateZakaPointsConfig,
      awardZakaPoints,
      redeemZakaPoints,
      consumeZakaRedemption,
      createGroupOuting,
      respondGroupOuting,
      deleteGroupOuting,
      inviteFriendsToGroupOuting,
      updateGroupOutingLocation,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,
      setGlobalError,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}

