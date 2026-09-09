import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  Establishment, 
  Reservation, 
  TakeawayOrder, 
  RelationshipRequest, 
  ServiceRequest, 
  GroupOuting, 
  Conversation,
  Role,
  Category,
  EstablishmentReview,
  AppNotification,
  Ad,
  Campaign,
  AdDailyStat,
  AdPayment,
  AdInvoice,
  ActivityLog,
  StaffPermissions
} from './types';
import { 
  addReviewToDb, 
  fetchReviewsFromDb,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  fetchUserProfileFromDb,
  saveUserProfileToDb,
  supabase,
  getCurrentUserProfile
} from './lib/supabase';
import { saveArtistProfile } from './lib/artistService';

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'u-1',
    title: 'Invitation d\'un Gérant 🍹',
    message: 'Le Maquis Bambou vous invite à passer ce soir avec 10% de réduction sur les grillades !',
    type: 'manager_invite',
    read: false,
    createdAt: new Date().toISOString(),
    linkTab: 'explore',
    relatedId: 'est-1'
  },
  {
    id: 'notif-2',
    userId: 'u-1',
    title: 'Réservation Confirmée ✅',
    message: 'Votre réservation à l\'Hôtel Résidence Ouaga pour le 10 Septembre a été validée.',
    type: 'reservation_update',
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    linkTab: 'profile',
    relatedId: 'res-1'
  },
  {
    id: 'notif-3',
    userId: 'u-1',
    title: 'Demande d\'Ami 👥',
    message: 'Awa Diallo vous a ajouté dans ses contacts Zaka.',
    type: 'friend_request',
    read: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    linkTab: 'profile'
  }
];

const INITIAL_REVIEWS: EstablishmentReview[] = [
  {
    id: 'rev-1',
    establishmentId: 'est-1',
    userId: 'u-1',
    userName: 'Ibrahim Ouedraogo',
    rating: 5,
    comment: 'Superbe ambiance au Maquis Bambou ! Les grillades de poulet bicyclette étaient succulentes.',
    createdAt: '2026-09-01T19:30:00.000Z'
  },
  {
    id: 'rev-2',
    establishmentId: 'est-1',
    userId: 'u-3',
    userName: 'Moussa Traoré',
    rating: 4,
    comment: 'Très bel endroit pour un pot entre amis après le travail. Service rapide.',
    createdAt: '2026-09-03T20:15:00.000Z'
  },
  {
    id: 'rev-3',
    establishmentId: 'est-2',
    userId: 'u-1',
    userName: 'Ibrahim Ouedraogo',
    rating: 5,
    comment: 'Chambre très propre et climatisée. Le personnel de la résidence est aux petits soins.',
    createdAt: '2026-09-05T14:20:00.000Z'
  }
];

const INITIAL_ESTABLISHMENTS: Establishment[] = [
  {
    id: 'est-1',
    name: 'Le Maquis Bambou',
    category: 'maquis',
    description: 'Agréable maquis en plein air avec grillades et boissons fraîches au cœur de Ouagadougou.',
    photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    neighborhood: 'Koulouba',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    rating: 4.6,
    priceLevel: '3 000 - 8 000 FCFA',
    phone: '+226 70 00 11 22',
    tags: ['Grillades', 'Musique live', 'Terrasse'],
    ownerId: 'u-2',
    lat: 12.368,
    lng: -1.523
  },
  {
    id: 'est-2',
    name: 'Hôtel Résidence Ouaga',
    category: 'hotel',
    description: 'Chambres confortables et climatisées, piscine et service 24h/24.',
    photoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    neighborhood: 'Ouaga 2000',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    rating: 4.8,
    priceLevel: '25 000 - 60 000 FCFA',
    phone: '+226 25 30 40 50',
    tags: ['Piscine', 'Wifi', 'Climatisé'],
    ownerId: 'u-2',
    lat: 12.312,
    lng: -1.505
  },
  {
    id: 'est-3',
    name: 'Le Jardin Gourmand',
    category: 'restaurant',
    description: 'Restaurant gastronomique africain et européen dans un cadre verdoyant et paisible.',
    photoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    neighborhood: 'Zone du Bois',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    rating: 4.7,
    priceLevel: '5 000 - 18 000 FCFA',
    phone: '+226 76 54 32 10',
    tags: ['Gastronomie', 'Jardin', 'Cocktails'],
    ownerId: 'u-2',
    lat: 12.385,
    lng: -1.502
  },
  {
    id: 'est-4',
    name: 'L\'Oasis Pool Lounge',
    category: 'piscine',
    description: 'Complexe piscine & détente avec bar à cocktails, transats et soirées DJ le week-end.',
    photoUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=800',
    neighborhood: 'Dassasgho',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    rating: 4.9,
    priceLevel: '4 000 - 12 000 FCFA',
    phone: '+226 70 88 99 00',
    tags: ['Piscine', 'Cocktails', 'Dj Set'],
    ownerId: 'u-2',
    lat: 12.372,
    lng: -1.488
  },
  {
    id: 'est-5',
    name: 'Le Club VIP Sya',
    category: 'boite',
    description: 'La boîte de nuit incontournable de Bobo-Dioulasso pour faire la fête jusqu\'à l\'aube.',
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    neighborhood: 'Sya',
    city: 'Bobo-Dioulasso',
    country: 'Burkina Faso',
    rating: 4.5,
    priceLevel: '5 000 - 20 000 FCFA',
    phone: '+226 20 97 12 34',
    tags: ['Boîte de nuit', 'VIP', 'Afrobeats'],
    ownerId: 'u-2',
    lat: 11.178,
    lng: -4.296
  }
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u-1',
    name: 'Ibrahim Ouedraogo',
    email: 'ibrahim@zaka.bf',
    phone: '+226 70 12 34 56',
    role: 'client',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    favorites: ['est-1'],
    points: 150,
    code_parrainage: 'ZAKA-IBRA-123'
  },
  {
    id: 'u-2',
    name: 'Awa Diallo',
    email: 'awa@zaka.bf',
    phone: '+226 76 99 88 77',
    role: 'gerant',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 300,
    code_parrainage: 'ZAKA-AWA-456'
  },
  {
    id: 'u-3',
    name: 'Moussa Traoré',
    email: 'moussa@zaka.bf',
    phone: '+226 78 11 22 33',
    role: 'caissier',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 50
  },
  {
    id: 'u-4',
    name: 'Sonia Sawadogo (Admin)',
    email: 'admin@zaka.bf',
    phone: '+226 25 00 00 00',
    role: 'admin',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 500
  },
  {
    id: 'u-5',
    name: 'Entreprise SODIBO',
    email: 'pro@zaka.bf',
    phone: '+226 25 31 00 00',
    role: 'entreprise',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 1000
  },
  {
    id: 'u-artist-smart-key',
    name: 'Smarty (Artiste)',
    email: 'artiste@zaka.bf',
    phone: '+226 70 00 00 01',
    role: 'artiste',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 1200
  },
  {
    id: 'u-artist-dj-flo',
    name: 'DJ Flo Mix',
    email: 'djflo@zaka.bf',
    phone: '+226 76 00 00 02',
    role: 'artiste',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    points: 980
  }
];

interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  establishments: Establishment[];
  reservations: Reservation[];
  takeawayOrders: TakeawayOrder[];
  relationshipRequests: RelationshipRequest[];
  serviceRequests: ServiceRequest[];
  groupOutings: GroupOuting[];
  conversations: Conversation[];
  favorites: string[];
  notifications: AppNotification[];
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  reviews: EstablishmentReview[];
  applications: any[];
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggleTheme: () => void;
  addReview: (rev: Omit<EstablishmentReview, 'id' | 'createdAt'>) => Promise<void>;
  markNotificationAsRead: (id?: string) => void;
  clearAllNotifications: () => void;
  addNotification: (notifOrUserId: any, title?: string, message?: string, ...args: any[]) => void;
  sendManagerInvitation: (establishmentId: string, targetUserId: string, message?: string, ...args: any[]) => void;
  login: (identifier: string, password?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (userData: any, password?: string, estData?: any, entrepriseData?: any, artistData?: any) => Promise<void>;
  logout: () => void;
  upgradeToGerant: (estData: any) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  envoyerCodeOtp: (phone: string, containerId: string) => Promise<void>;
  confirmerCodeOtp: (code: string, details?: any) => Promise<void>;
  updateReservationStatus: (id: string, status: Reservation['status'], message?: string) => void;
  updateTakeawayOrderStatus: (id: string, status: TakeawayOrder['status']) => void;
  updateRelationshipRequest: (id: string, status: any, ...rest: any[]) => void;
  createConversation: (...args: any[]) => string;
  respondGroupOuting: (id: string, status: 'going' | 'maybe' | 'declined') => void;
  toggleFavorite: (establishmentId: string, userId?: string, ...args: any[]) => void;
  addEstablishment: (est: Omit<Establishment, 'id'>) => void;
  updateEstablishment: (id: string, data: Partial<Establishment>) => void;
  deleteEstablishment: (id: string) => void;
  addReservation: (res: Omit<Reservation, 'id'>) => void;
  addTakeawayOrder: (ord: Omit<TakeawayOrder, 'id'>) => void;
  sendFriendRequest: (toUserId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  
  // ZAKA Ads Store Types
  ads: Ad[];
  campaigns: Campaign[];
  adPayments: AdPayment[];
  adInvoices: AdInvoice[];
  adDailyStats: AdDailyStat[];
  trackAdImpression: (adId: string) => void;
  trackAdClick: (adId: string) => void;
  addCampaign: (camp: Omit<Campaign, 'id'>, ads?: any[]) => Promise<string>;
  processAdPayment: (paymentOrAmount: any, campaignId?: string) => Promise<void>;
  validateAdPayment: (paymentId: string) => void;
  validateCampaignByAdmin: (campaignId: string) => void;
  updateCampaignStatus: (campaignId: string, status: Campaign['status']) => void;

  // Additional Store Types for Recruitment and Friendships
  friendships: any[];
  publications: any[];
  events: any[];
  addEvent: (ev: any) => void;
  activityLogs: ActivityLog[];
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  staffPermissions: Record<string, StaffPermissions>;
  updateStaffPermissions: (userId: string, permissions: StaffPermissions) => void;
  addApplication: (app: any) => Promise<void>;
  globalError: any;
  setGlobalError: (err: any) => void;

  // Remaining optional properties requested by components
  addAdCreativeLibraryItem?: (item: any) => void;
  favoriteTags?: string[];
  updateFavoriteTags?: (...args: any[]) => void;
  saveAllFavoriteTags?: (...args: any[]) => void;
  createServiceRequest?: (req: any) => Promise<void>;
  trackPublicationView?: (pubId: string) => void;
  loading?: boolean;
  entreprises?: any[];
  unreadCount?: number;
  ventes?: any[];
  expenses?: any[];
  addExpense?: (expense: any) => Promise<void>;
  stocks?: any[];
  addStockItem?: (item: any) => Promise<void>;
  updateStockItem?: (id: string, item: any) => Promise<void>;
  deleteStockItem?: (id: string) => Promise<void>;
  recordSale?: (sale: any) => Promise<void>;
  deleteRelationshipRequest?: (id: string) => Promise<void>;
  updateServiceRequest?: (id: string, status: any, message?: string) => Promise<void>;
  createRelationshipRequest?: (req: any) => Promise<void>;
  toggleDJStatus?: (id: string, ...args: any[]) => Promise<void>;
  toggleCaissierStatus?: (id: string, ...args: any[]) => Promise<void>;
  toggleServeurStatus?: (id: string, ...args: any[]) => Promise<void>;
  staffReviews?: any[];
  updateStaffReviewStatus?: (id: string, status: any, note?: number, bonusOrSanction?: any) => Promise<void>;
  staffAttendances?: any[];
  createStaffAttendance?: (att: any) => Promise<void>;
  deleteStaffAttendance?: (id: string) => Promise<void>;
  loyaltyCards?: any[];
  consumeLoyaltyReward?: (id: string) => Promise<void>;
  updateCrowdStatus?: (id: string, status: any) => Promise<void>;
  menusDuJour?: any[];
  trackEstablishmentView?: (id: string) => Promise<void>;
  addCarnetEntry?: (entry: any) => Promise<void>;
  carnetEntrees?: any[];
  createStaffReview?: (rev: any) => Promise<void>;
  replyToReview?: (id: string, reply: string) => Promise<void>;
  updateHairSalonData?: (id: string, data: any) => Promise<void>;
  zakaRedemptions?: any[];
  updateLoyaltyConfig?: (id: string, ...args: any[]) => Promise<any>;
  updateZakaPointsConfig?: (id: string, ...args: any[]) => Promise<any>;
  redeemZakaPoints?: (id: string, ...args: any[]) => Promise<string>;
  consumeZakaRedemption?: (id: string) => Promise<void>;
  addMenuDuJour?: (idOrMenu: any, menu?: any) => Promise<void>;
  receptionsStock?: any[];
  inventairesStock?: any[];
  addStockReception?: (rec: any) => Promise<void>;
  addStockInventory?: (inv: any) => Promise<void>;
  adOrganizations?: any[];
  adAuditLogs?: any[];
  adRates?: any[];
  adSupportTickets?: any[];
  moderateCampaignByAdmin?: (id: string, status: any, reason?: string, comment?: string) => Promise<void>;
  updateAdRateConfig?: (config: any) => Promise<void>;
  respondAdSupportTicket?: (id: string, response: string) => Promise<void>;
  addAdAuditLog?: (log: any) => Promise<void>;
  adCreatives?: any[];
  createAdOrganization?: (org: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter((u: UserProfile) => 
          !u.name?.toLowerCase().includes('demo') && 
          !u.email?.toLowerCase().includes('demo') &&
          !u.name?.toLowerCase().includes('dummy')
        );
        if (cleaned.length > 0) return cleaned;
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('zaka_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
      return null;
    } catch {
      return null;
    }
  });

  const [establishments, setEstablishments] = useState<Establishment[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_establishments');
      return saved ? JSON.parse(saved) : INITIAL_ESTABLISHMENTS;
    } catch {
      return INITIAL_ESTABLISHMENTS;
    }
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_reservations');
      return saved ? JSON.parse(saved) : [
        {
          id: 'res-1',
          establishmentId: 'est-1',
          establishmentName: 'Le Maquis Bambou',
          userId: 'u-1',
          userName: 'Ibrahim Ouedraogo',
          clientId: 'u-1',
          date: '2026-09-10',
          time: '19:30',
          guestsCount: 4,
          status: 'confirmed'
        }
      ];
    } catch {
      return [];
    }
  });

  const [takeawayOrders, setTakeawayOrders] = useState<TakeawayOrder[]>([]);
  const [relationshipRequests, setRelationshipRequests] = useState<RelationshipRequest[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [groupOutings, setGroupOutings] = useState<GroupOuting[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_events');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addEvent = (ev: any) => {
    setEvents(prev => {
      const updated = [ev, ...prev];
      try {
        localStorage.setItem('zaka_events', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [staffPermissions, setStaffPermissions] = useState<Record<string, StaffPermissions>>({});
  const [globalError, setGlobalError] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_favorites');
      return saved ? JSON.parse(saved) : ['est-1', 'est-3'];
    } catch {
      return ['est-1', 'est-3'];
    }
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // ZAKA Ads State Declarations
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_campaigns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [ads, setAds] = useState<Ad[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_ads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adPayments, setAdPayments] = useState<AdPayment[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_ad_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adInvoices, setAdInvoices] = useState<AdInvoice[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_ad_invoices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adDailyStats, setAdDailyStats] = useState<AdDailyStat[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_ad_daily_stats');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchUserProfileFromDb(session.user.id);
          if (profile) {
            setCurrentUser(profile);
          }
        }
      } catch (err) {
        console.error("Erreur d'initialisation de session Supabase:", err);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          return;
        }
        if (session?.user) {
          const profile = await fetchUserProfileFromDb(session.user.id);
          if (profile) {
            setCurrentUser(profile);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_campaigns', JSON.stringify(campaigns));
    } catch (e) {
      console.error(e);
    }
  }, [campaigns]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_ads', JSON.stringify(ads));
    } catch (e) {
      console.error(e);
    }
  }, [ads]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_ad_payments', JSON.stringify(adPayments));
    } catch (e) {
      console.error(e);
    }
  }, [adPayments]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_ad_invoices', JSON.stringify(adInvoices));
    } catch (e) {
      console.error(e);
    }
  }, [adInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_ad_daily_stats', JSON.stringify(adDailyStats));
    } catch (e) {
      console.error(e);
    }
  }, [adDailyStats]);

  const markNotificationAsRead = (id?: string) => {
    if (!id) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } else {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addNotification = (notifOrUserId: any, title?: string, message?: string, ...args: any[]) => {
    let finalNotif: AppNotification;
    if (typeof notifOrUserId === 'string') {
      finalNotif = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: notifOrUserId,
        title: title || 'Notification',
        message: message || '',
        type: 'general',
        read: false,
        createdAt: new Date().toISOString()
      };
    } else {
      finalNotif = {
        ...notifOrUserId,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: new Date().toISOString(),
        read: false
      };
    }
    setNotifications(prev => [finalNotif, ...prev]);
  };

  const sendManagerInvitation = (establishmentId: string, targetUserId: string, message?: string, ...args: any[]) => {
    const est = establishments.find(e => e.id === establishmentId);
    const estName = est ? est.name : 'Un établissement';
    
    // Add relationship request
    const req: RelationshipRequest = {
      id: `req-${Date.now()}`,
      fromUserId: currentUser?.id || 'u-2',
      fromUserName: currentUser?.name || 'Gérant Zaka',
      toUserId: targetUserId,
      type: 'gerant_invite',
      status: 'pending',
      createdAt: new Date().toISOString(),
      establishmentId
    };
    setRelationshipRequests(prev => [req, ...prev]);

    // Send notification to target user
    addNotification({
      userId: targetUserId,
      title: 'Invitation privilège Gérant 🎟️',
      message: message || `Le gérant de "${estName}" vous invite à rejoindre son club privilège.`,
      type: 'manager_invite',
      linkTab: 'explore',
      relatedId: establishmentId
    });
  };
  const [reviews, setReviews] = useState<EstablishmentReview[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_reviews');
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });
  const [applications, setApplications] = useState<any[]>([]);

  const [stocks, setStocks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_stocks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [ventes, setVentes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_ventes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_expenses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [staffAttendances, setStaffAttendances] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_staff_attendances');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('zaka_stocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('zaka_ventes', JSON.stringify(ventes));
  }, [ventes]);

  useEffect(() => {
    localStorage.setItem('zaka_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('zaka_staff_attendances', JSON.stringify(staffAttendances));
  }, [staffAttendances]);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      localStorage.setItem('zaka_reviews', JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  const addReview = async (rev: Omit<EstablishmentReview, 'id' | 'createdAt'>) => {
    const created = await addReviewToDb(rev);
    if (created) {
      setReviews(prev => [created, ...prev]);
      
      // Update local establishment rating average
      setEstablishments(prev => prev.map(est => {
        if (est.id === rev.establishmentId) {
          const estReviews = [created, ...reviews.filter(r => r.establishmentId === est.id)];
          const avg = estReviews.reduce((acc, r) => acc + r.rating, 0) / estReviews.length;
          return { ...est, rating: Number(avg.toFixed(1)) };
        }
        return est;
      }));
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('zaka_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('zaka_current_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_establishments', JSON.stringify(establishments));
    } catch (e) {
      console.error(e);
    }
  }, [establishments]);

  useEffect(() => {
    try {
      localStorage.setItem('zaka_reservations', JSON.stringify(reservations));
    } catch (e) {
      console.error(e);
    }
  }, [reservations]);

  const setTheme = (t: 'light' | 'dark') => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));

  const login = async (identifier: string, password?: string) => {
    if (!password) {
      throw new Error("Un mot de passe est obligatoire pour s'authentifier.");
    }
    const cleanId = identifier.trim().toLowerCase();
    const { data, error } = await supabaseSignIn(cleanId, password);
    if (error) {
      throw error;
    }
    if (data?.user) {
      const profile = await fetchUserProfileFromDb(data.user.id);
      if (profile) {
        setCurrentUser(profile);
      } else {
        throw new Error(`Profil introuvable dans public.users pour l'UUID ${data.user.id}`);
      }
    }
  };

  const resetPassword = async (email: string) => {
    // Simulated reset email
  };

  const register = async (userData: any, password?: string, estData?: any, entrepriseData?: any, artistData?: any) => {
    if (!password) {
      throw new Error("Un mot de passe est obligatoire pour créer un compte réel.");
    }
    if (!userData.email) {
      throw new Error("Une adresse e-mail est obligatoire pour s'inscrire réellement.");
    }
    
    const { data, error } = await supabaseSignUp(userData.email, password, userData);
    if (error) {
      throw error;
    }
    
    if (data?.user) {
      const newUser: UserProfile = {
        id: data.user.id,
        name: userData.name || userData.email.split('@')[0],
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role || 'client',
        city: userData.city || 'Ouagadougou',
        country: userData.country || 'Burkina Faso',
        points: 200,
        code_parrainage: `ZAKA-${Math.floor(1000 + Math.random() * 9000)}`
      };
      
      const success = await saveUserProfileToDb(newUser);
      if (!success) {
        throw new Error("Impossible d'enregistrer le profil utilisateur dans la table public.users de Supabase.");
      }
      
      setUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);

      if (userData.role === 'gerant' && estData && estData.name) {
        const newEst: Establishment = {
          id: `est-${Date.now()}`,
          name: estData.name,
          category: estData.category || 'maquis',
          description: estData.description || '',
          photoUrl: estData.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
          neighborhood: estData.neighborhood || 'Centre-ville',
          city: userData.city || 'Ouagadougou',
          country: userData.country || 'Burkina Faso',
          ownerId: data.user.id,
          rating: 5.0
        };
        setEstablishments(prev => [newEst, ...prev]);
      }

      if (userData.role === 'artiste' && artistData) {
        try {
          await saveArtistProfile({
            userId: data.user.id,
            nomArtiste: artistData.nomArtiste || newUser.name,
            nomComplet: artistData.nomComplet || newUser.name,
            categorieArtistique: artistData.categorieArtistique || 'Chanteur / Chanteuse',
            genres: artistData.genres || ['Afrobeat'],
            biographie: artistData.biographie || '',
            photoProfil: artistData.photoProfil || '',
            photoCouverture: artistData.photoCouverture || '',
            whatsappPro: artistData.whatsappPro || newUser.phone,
            telephonePro: artistData.telephonePro || newUser.phone,
            ville: newUser.city,
            pays: newUser.country
          });
        } catch (err) {
          console.error('Error auto-creating artist profile upon registration:', err);
        }
      }
      
      setCurrentUser(newUser);
    }
  };

  const logout = async () => {
    await supabaseSignOut();
    setCurrentUser(null);
  };

  const upgradeToGerant = async (estData: any) => {
    if (currentUser) {
      const updatedUser: UserProfile = { ...currentUser, role: 'gerant' };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));

      if (estData && estData.name) {
        const newEst: Establishment = {
          id: `est-${Date.now()}`,
          name: estData.name,
          category: estData.category || 'maquis',
          description: estData.description || '',
          photoUrl: estData.photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
          neighborhood: estData.neighborhood || 'Centre-ville',
          city: currentUser.city || 'Ouagadougou',
          country: currentUser.country || 'Burkina Faso',
          ownerId: currentUser.id,
          rating: 5.0
        };
        setEstablishments(prev => [newEst, ...prev]);
      }
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (currentUser) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    }
  };

  const envoyerCodeOtp = async (phone: string, containerId: string) => {};

  const confirmerCodeOtp = async (code: string, details?: any) => {
    if (details) {
      await register(details);
    } else if (!currentUser) {
      throw new Error("L'authentification par code nécessite un compte ou une session active.");
    }
  };

  const updateReservationStatus = (id: string, status: Reservation['status'], message?: string) => {
    setReservations(prev => {
      const target = prev.find(r => r.id === id);
      if (target) {
        const isApproved = status === 'confirmed' || status === 'confirmee';
        const isRejected = status === 'cancelled' || status === 'refusee' || status === 'annulee';
        const label = isApproved ? 'confirmée ✅' : isRejected ? 'refusée ❌' : 'mise à jour';
        addNotification({
          userId: target.userId,
          title: `Réservation ${label}`,
          message: `Votre demande pour ${target.establishmentName} du ${target.date} à ${target.time} est désormais ${label}.`,
          type: 'reservation_update',
          linkTab: 'profile',
          relatedId: target.id
        });
      }
      return prev.map(r => r.id === id ? { ...r, status } : r);
    });
  };

  const updateTakeawayOrderStatus = (id: string, status: TakeawayOrder['status']) => {
    setTakeawayOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateRelationshipRequest = (id: string, status: any, ...rest: any[]) => {
    setRelationshipRequests(prev => prev.map(req => {
      if (req.id === id) {
        const updated = { ...req, status };
        if (status === 'accepted' && req.type === 'friend') {
          setFriendships(fPrev => {
            if (fPrev.some(f => (f.user1Id === req.fromUserId && f.user2Id === req.toUserId) || (f.user1Id === req.toUserId && f.user2Id === req.fromUserId))) {
              return fPrev.map(f => (f.user1Id === req.fromUserId && f.user2Id === req.toUserId) || (f.user1Id === req.toUserId && f.user2Id === req.fromUserId) ? { ...f, status: 'accepted' } : f);
            }
            return [...fPrev, {
              id: `friendship-${Date.now()}`,
              user1Id: req.fromUserId,
              user2Id: req.toUserId,
              status: 'accepted',
              createdAt: new Date().toISOString()
            }];
          });
        }
        return updated;
      }
      return req;
    }));
  };

  const createConversation = (participantId?: string) => {
    const newId = `conv-${Date.now()}`;
    return newId;
  };

  const respondGroupOuting = (id: string, status: 'going' | 'maybe' | 'declined') => {};

  const toggleFavorite = (establishmentId: string, userId?: string, ...args: any[]) => {
    setFavorites(prev => 
      prev.includes(establishmentId) ? prev.filter(i => i !== establishmentId) : [...prev, establishmentId]
    );
  };

  const addEstablishment = (est: Omit<Establishment, 'id'>) => {
    const newEst: Establishment = {
      ...est,
      id: `est-${Date.now()}`,
      ownerId: currentUser?.id || 'u-2'
    };
    setEstablishments(prev => [newEst, ...prev]);
  };

  const updateEstablishment = (id: string, data: Partial<Establishment>) => {
    setEstablishments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };

  const deleteEstablishment = (id: string) => {
    setEstablishments(prev => prev.filter(e => e.id !== id));
  };

  const addReservation = (res: Omit<Reservation, 'id'>) => {
    const newRes: Reservation = {
      ...res,
      id: `res-${Date.now()}`,
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Visiteur',
      clientId: currentUser?.id || 'u-1',
      status: 'pending'
    };
    setReservations(prev => [newRes, ...prev]);
  };

  const addTakeawayOrder = (ord: Omit<TakeawayOrder, 'id'>) => {
    const newOrder: TakeawayOrder = {
      ...ord,
      id: `ord-${Date.now()}`,
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Visiteur',
      clientId: currentUser?.id || 'u-1',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setTakeawayOrders(prev => [newOrder, ...prev]);
  };

  const sendFriendRequest = (toUserId: string) => {
    if (!currentUser) return;
    const req: RelationshipRequest = {
      id: `req-${Date.now()}`,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name,
      toUserId: toUserId,
      type: 'friend',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setRelationshipRequests(prev => [req, ...prev]);
  };

  const acceptFriendRequest = (requestId: string) => updateRelationshipRequest(requestId, 'accepted');
  const declineFriendRequest = (requestId: string) => updateRelationshipRequest(requestId, 'declined');
  const removeFriend = (friendId: string) => {};

  // ZAKA Ads Store Methods Impl
  const trackAdImpression = (adId: string) => {
    setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, impressions: (ad.impressions || 0) + 1 } : ad));
    const today = new Date().toISOString().split('T')[0];
    setAdDailyStats(prev => {
      const match = prev.find(s => s.date === today && s.campaignId === (ads.find(a => a.id === adId)?.campaignId || ''));
      if (match) {
        return prev.map(s => s.id === match.id ? { ...s, impressions: s.impressions + 1 } : s);
      } else {
        const adObj = ads.find(a => a.id === adId);
        if (!adObj) return prev;
        return [...prev, {
          id: `stat-${Date.now()}`,
          date: today,
          campaignId: adObj.campaignId,
          advertiserId: adObj.advertiserId,
          impressions: 1,
          clicks: 0,
          spend: 0
        }];
      }
    });
  };

  const trackAdClick = (adId: string) => {
    setAds(prev => prev.map(ad => ad.id === adId ? { ...ad, clicks: (ad.clicks || 0) + 1 } : ad));
    const today = new Date().toISOString().split('T')[0];
    setAdDailyStats(prev => {
      const match = prev.find(s => s.date === today && s.campaignId === (ads.find(a => a.id === adId)?.campaignId || ''));
      if (match) {
        return prev.map(s => s.id === match.id ? { ...s, clicks: s.clicks + 1 } : s);
      } else {
        const adObj = ads.find(a => a.id === adId);
        if (!adObj) return prev;
        return [...prev, {
          id: `stat-${Date.now()}`,
          date: today,
          campaignId: adObj.campaignId,
          advertiserId: adObj.advertiserId,
          impressions: 0,
          clicks: 1,
          spend: 0
        }];
      }
    });
  };

  const addCampaign = async (camp: Omit<Campaign, 'id'>, customAds?: any[]): Promise<string> => {
    const id = `camp-${Date.now()}`;
    const newCamp: Campaign = {
      ...camp,
      id,
      createdAt: new Date().toISOString()
    };
    setCampaigns(prev => [newCamp, ...prev]);

    if (customAds && customAds.length > 0) {
      const newAds: Ad[] = customAds.map((cad, index) => ({
        id: `ad-${Date.now()}-${index}`,
        campaignId: id,
        advertiserId: camp.advertiserId,
        title: cad.title || camp.title,
        description: cad.description || "Annonce publicitaire propulsée par ZAKA Ads",
        photoUrl: cad.mediaUrl || cad.photoUrl || "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800",
        mediaUrl: cad.mediaUrl,
        ctaText: cad.ctaText || "En savoir plus",
        ctaLink: cad.ctaLink || "https://zaka.bf",
        status: cad.status || 'pending',
        placements: cad.placements || ['home_banner'],
        advertiserName: camp.advertiserName
      }));
      setAds(prev => [...newAds, ...prev]);
    } else {
      // Create a corresponding default advertisement creative
      const adId = `ad-${Date.now()}`;
      const newAd: Ad = {
        id: adId,
        campaignId: id,
        advertiserId: camp.advertiserId,
        title: camp.title,
        description: "Annonce publicitaire propulsée par ZAKA Ads",
        photoUrl: "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800",
        ctaText: "En savoir plus",
        ctaLink: "https://zaka.bf",
        status: 'pending',
        placements: ['home_banner'],
        advertiserName: camp.advertiserName
      };
      setAds(prev => [newAd, ...prev]);
    }

    return id;
  };

  const processAdPayment = async (amountOrObject: any, campaignId?: string): Promise<void> => {
    if (!currentUser) return;
    const paymentId = `pay-${Date.now()}`;
    
    let finalAmount = typeof amountOrObject === 'number' ? amountOrObject : amountOrObject?.amount || 0;
    let finalCampId = typeof amountOrObject === 'number' ? campaignId : amountOrObject?.campaignId;
    let method = typeof amountOrObject === 'object' ? amountOrObject?.method || 'orange_money' : 'orange_money';
    let packName = typeof amountOrObject === 'object' ? amountOrObject?.packName : undefined;
    let phoneUsed = typeof amountOrObject === 'object' ? amountOrObject?.phoneUsed : undefined;
    let transactionRef = typeof amountOrObject === 'object' ? amountOrObject?.transactionRef : undefined;

    const newPayment: AdPayment = {
      id: paymentId,
      advertiserId: currentUser.id,
      campaignId: finalCampId,
      amount: finalAmount,
      currency: 'XOF',
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
      packName,
      phoneUsed,
      transactionRef,
      advertiserName: currentUser.name
    };
    setAdPayments(prev => [newPayment, ...prev]);

    if (finalCampId) {
      const camp = campaigns.find(c => c.id === finalCampId);
      const invoiceId = `inv-${Date.now()}`;
      const newInvoice: AdInvoice = {
        id: invoiceId,
        advertiserId: currentUser.id,
        campaignId: finalCampId,
        campaignTitle: camp?.title || 'Campagne publicitaire',
        amount: finalAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'non_payee',
        advertiserName: currentUser.name
      };
      setAdInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const validateAdPayment = (paymentId: string) => {
    setAdPayments(prev => {
      const item = prev.find(p => p.id === paymentId);
      if (item?.campaignId) {
        setAdInvoices(iPrev => iPrev.map(inv => inv.campaignId === item.campaignId ? { ...inv, status: 'payee' } : inv));
        setCampaigns(cPrev => cPrev.map(c => c.id === item.campaignId ? { ...c, status: 'pending_validation' } : c));
      }
      return prev.map(p => p.id === paymentId ? { ...p, status: 'valide' } : p);
    });
  };

  const validateCampaignByAdmin = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' } : c));
    setAds(prev => prev.map(ad => ad.campaignId === campaignId ? { ...ad, status: 'active' } : ad));
  };

  const updateCampaignStatus = (campaignId: string, status: Campaign['status']) => {
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status } : c));
    if (status === 'active') {
      setAds(prev => prev.map(ad => ad.campaignId === campaignId ? { ...ad, status: 'active' } : ad));
    } else {
      setAds(prev => prev.map(ad => ad.campaignId === campaignId ? { ...ad, status: 'paused' } : ad));
    }
  };

  const addApplication = async (app: any) => {
    setApplications(prev => [...prev, { ...app, id: `app-${Date.now()}`, date: new Date().toISOString() }]);
  };

  const addActivityLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    setActivityLogs(prev => [{ ...log, id: `log-${Date.now()}`, timestamp: new Date().toISOString() }, ...prev]);
  };

  const updateStaffPermissions = (userId: string, permissions: StaffPermissions) => {
    setStaffPermissions(prev => ({ ...prev, [userId]: permissions }));
  };

  const addStockItem = async (item: any) => {
    setStocks(prev => [...prev, { ...item, id: `stock-${Date.now()}`, createdAt: new Date().toISOString() }]);
  };

  const updateStockItem = async (id: string, updates: any) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStockItem = async (id: string) => {
    setStocks(prev => prev.filter(s => s.id !== id));
  };

  const recordSale = async (sale: any) => {
    const saleId = `sale-${Date.now()}`;
    const newSale = { ...sale, id: saleId, date: new Date().toISOString() };
    
    // Decrease stock quantities locally
    setStocks(prev => prev.map(stock => {
      const soldItem = sale.items.find((item: any) => item.stockId === stock.id);
      if (soldItem) {
        return { ...stock, quantity: Math.max(0, stock.quantity - soldItem.quantity) };
      }
      return stock;
    }));

    setVentes(prev => [newSale, ...prev]);
  };

  const addExpense = async (expense: any) => {
    setExpenses(prev => [{ ...expense, id: `exp-${Date.now()}` }, ...prev]);
  };

  const createStaffAttendance = async (att: any) => {
    setStaffAttendances(prev => [{ ...att, id: `att-${Date.now()}`, date: new Date().toISOString() }, ...prev]);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      establishments,
      reservations,
      takeawayOrders,
      relationshipRequests,
      serviceRequests,
      groupOutings,
      conversations,
      favorites,
      notifications,
      userLocation,
      setUserLocation,
      reviews,
      applications,
      friendships,
      publications,
      activityLogs,
      addActivityLog,
      staffPermissions,
      updateStaffPermissions,
      addApplication,
      globalError,
      setGlobalError,
      theme,
      setTheme,
      toggleTheme,
      addReview,
      markNotificationAsRead,
      clearAllNotifications,
      addNotification,
      sendManagerInvitation,
      login,
      resetPassword,
      register,
      logout,
      upgradeToGerant,
      updateProfile,
      envoyerCodeOtp,
      confirmerCodeOtp,
      updateReservationStatus,
      updateTakeawayOrderStatus,
      updateRelationshipRequest,
      createConversation,
      respondGroupOuting,
      toggleFavorite,
      addEstablishment,
      updateEstablishment,
      deleteEstablishment,
      addReservation,
      addTakeawayOrder,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      removeFriend,

      // Default placeholders for requested optional store fields
      addAdCreativeLibraryItem: () => {},
      favoriteTags: [],
      updateFavoriteTags: (...args: any[]) => {},
      saveAllFavoriteTags: (...args: any[]) => {},
      createServiceRequest: async () => {},
      trackPublicationView: () => {},
      loading: false,
      entreprises: [],
      unreadCount: 0,
      ventes,
      expenses,
      addExpense,
      stocks,
      addStockItem,
      updateStockItem,
      deleteStockItem,
      recordSale,
      deleteRelationshipRequest: async () => {},
      updateServiceRequest: async (id: string, status: any, message?: string) => {},
      createRelationshipRequest: async () => {},
      toggleDJStatus: async (id: string, ...args: any[]) => {},
      toggleCaissierStatus: async (id: string, ...args: any[]) => {},
      toggleServeurStatus: async (id: string, ...args: any[]) => {},
      staffReviews: [],
      updateStaffReviewStatus: async (id: string, status: any, note?: number, bonusOrSanction?: any) => {},
      staffAttendances,
      createStaffAttendance,
      deleteStaffAttendance: async () => {},
      loyaltyCards: [],
      consumeLoyaltyReward: async () => {},
      updateCrowdStatus: async () => {},
      menusDuJour: [],
      trackEstablishmentView: async () => {},
      addCarnetEntry: async () => {},
      carnetEntrees: [],
      createStaffReview: async () => {},
      replyToReview: async () => {},
      updateHairSalonData: async () => {},
      zakaRedemptions: [],
      updateLoyaltyConfig: async (id: string, ...args: any[]) => {},
      updateZakaPointsConfig: async (id: string, ...args: any[]) => {},
      redeemZakaPoints: async (id: string, ...args: any[]) => { return "CODE-REDEEM-" + Math.floor(1000 + Math.random() * 9000); },
      consumeZakaRedemption: async () => {},
      addMenuDuJour: async (idOrMenu: any, menu?: any) => {},
      receptionsStock: [],
      inventairesStock: [],
      addStockReception: async () => {},
      addStockInventory: async () => {},
      adOrganizations: [],
      adAuditLogs: [],
      adRates: [],
      adSupportTickets: [],
      moderateCampaignByAdmin: async (id: string, status: any, reason?: string, comment?: string) => {},
      updateAdRateConfig: async () => {},
      respondAdSupportTicket: async () => {},
      addAdAuditLog: async () => {},
      adCreatives: [],
      createAdOrganization: async () => {},
      
      // ZAKA Ads exports
      ads,
      campaigns,
      adPayments,
      adInvoices,
      adDailyStats,
      trackAdImpression,
      trackAdClick,
      addCampaign,
      processAdPayment,
      validateAdPayment,
      validateCampaignByAdmin,
      updateCampaignStatus,
      events,
      addEvent
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within an AppProvider');
  return context;
};
