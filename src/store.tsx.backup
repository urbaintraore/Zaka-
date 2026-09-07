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
  AppNotification
} from './types';
import { addReviewToDb, fetchReviewsFromDb } from './lib/supabase';

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
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  sendManagerInvitation: (establishmentId: string, targetUserId: string, message?: string) => void;
  login: (identifier: string, password?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (userData: any, password?: string, estData?: any, entrepriseData?: any) => Promise<void>;
  logout: () => void;
  switchUser: (userId: string) => void;
  upgradeToGerant: (estData: any) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  envoyerCodeOtp: (phone: string, containerId: string) => Promise<void>;
  confirmerCodeOtp: (code: string, details?: any) => Promise<void>;
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  updateTakeawayOrderStatus: (id: string, status: TakeawayOrder['status']) => void;
  updateRelationshipRequest: (id: string, status: any, ...rest: any[]) => void;
  createConversation: (...args: any[]) => string;
  respondGroupOuting: (id: string, status: 'going' | 'maybe' | 'declined') => void;
  toggleFavorite: (establishmentId: string) => void;
  addEstablishment: (est: Omit<Establishment, 'id'>) => void;
  updateEstablishment: (id: string, data: Partial<Establishment>) => void;
  deleteEstablishment: (id: string) => void;
  addReservation: (res: Omit<Reservation, 'id'>) => void;
  addTakeawayOrder: (ord: Omit<TakeawayOrder, 'id'>) => void;
  sendFriendRequest: (toUserId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  declineFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('zaka_current_user');
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0]; // Default to Ibrahim Ouedraogo if no saved session
    } catch {
      return INITIAL_USERS[0];
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

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const sendManagerInvitation = (establishmentId: string, targetUserId: string, message?: string) => {
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

  const switchUser = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const login = async (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const existing = users.find(
      u => (u.email && u.email.toLowerCase() === cleanId) || (u.phone && u.phone === cleanId)
    );

    if (existing) {
      setCurrentUser(existing);
    } else {
      // Create new user profile for this identifier
      const newUser: UserProfile = {
        id: `u-${Date.now()}`,
        name: cleanId.includes('@') ? cleanId.split('@')[0].replace('.', ' ') : cleanId,
        email: cleanId.includes('@') ? cleanId : undefined,
        phone: !cleanId.includes('@') ? cleanId : undefined,
        role: 'client',
        city: 'Ouagadougou',
        country: 'Burkina Faso',
        points: 100,
        code_parrainage: `ZAKA-${Math.floor(1000 + Math.random() * 9000)}`
      };

      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
    }
  };

  const resetPassword = async (email: string) => {
    // Simulated reset email
  };

  const register = async (userData: any, password?: string, estData?: any, entrepriseData?: any) => {
    const newUserId = `u-${Date.now()}`;
    const newUser: UserProfile = {
      id: newUserId,
      name: userData.name || 'Nouvel Utilisateur',
      email: userData.email || undefined,
      phone: userData.phone || undefined,
      role: userData.role || 'client',
      city: userData.city || 'Ouagadougou',
      country: userData.country || 'Burkina Faso',
      points: 200,
      code_parrainage: `ZAKA-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setUsers(prev => [...prev, newUser]);

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
        ownerId: newUserId,
        rating: 5.0
      };
      setEstablishments(prev => [newEst, ...prev]);
    }

    setCurrentUser(newUser);
  };

  const logout = () => {
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
      const defaultUser = users[0] || INITIAL_USERS[0];
      setCurrentUser(defaultUser);
    }
  };

  const updateReservationStatus = (id: string, status: Reservation['status']) => {
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
    setRelationshipRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
  };

  const createConversation = (participantId?: string) => {
    const newId = `conv-${Date.now()}`;
    return newId;
  };

  const respondGroupOuting = (id: string, status: 'going' | 'maybe' | 'declined') => {};

  const toggleFavorite = (establishmentId: string) => {
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
      switchUser,
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
      removeFriend
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
