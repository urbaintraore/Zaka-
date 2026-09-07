export type Role = 
  | 'client' 
  | 'gerant' 
  | 'admin' 
  | 'entreprise' 
  | 'caissier' 
  | 'salon_coiffure' 
  | 'annonceur';

export type Category = 
  | 'maquis' 
  | 'restaurant' 
  | 'hotel' 
  | 'boite' 
  | 'espace_evenementiel' 
  | 'piscine' 
  | 'autre';

export interface CategoryInfo {
  id: Category;
  label: string;
  icon: string;
}

export const CATEGORIES_LIST: CategoryInfo[] = [
  { id: 'maquis', label: 'Maquis & Bars', icon: '🍺' },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'hotel', label: 'Hôtels & Résidences', icon: '🏨' },
  { id: 'boite', label: 'Boîtes de nuit', icon: '🪩' },
  { id: 'espace_evenementiel', label: 'Espaces événementiels', icon: '🎉' },
  { id: 'piscine', label: 'Piscines & Détente', icon: '🏊' },
  { id: 'autre', label: 'Autres lieux', icon: '📍' },
];

export function getCategoryLabel(cat: Category): string {
  const found = CATEGORIES_LIST.find(c => c.id === cat);
  return found ? found.label : cat;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  city: string;
  country: string;
  referralCode?: string;
  avatarUrl?: string;
  favorites?: string[];
  preferences?: string[];
  points?: number;
  code_parrainage?: string;
}

export interface Establishment {
  id: string;
  name: string;
  category: Category;
  description: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  tags?: string[];
  neighborhood: string;
  geolocation?: string;
  city: string;
  country: string;
  rating?: number;
  priceLevel?: string;
  phone?: string;
  whatsapp?: string;
  gerantId?: string;
  ownerId?: string;
  lat?: number;
  lng?: number;
}

export interface Reservation {
  id: string;
  establishmentId: string;
  establishmentName: string;
  userId: string;
  userName: string;
  clientId?: string;
  date: string;
  time: string;
  guestsCount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'annulee' | 'refusee' | 'confirmee' | 'en_attente';
  totalAmount?: number;
  note?: number;
  notes?: string;
  managerMessage?: string;
}

export interface TakeawayOrder {
  id: string;
  establishmentId: string;
  establishmentName: string;
  userId: string;
  userName: string;
  clientId?: string;
  items: { id: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'terminee' | 'annulee' | 'prete';
  createdAt: string;
  pickupTime?: string;
}

export interface RelationshipRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  type: 'friend' | 'follow' | 'gerant_invite' | 'client_join';
  status: 'pending' | 'accepted' | 'declined' | 'en_attente' | 'acceptee' | 'refusee';
  createdAt: string;
  isCaissier?: boolean;
  requestedRole?: string;
  targetId?: string;
  initiatorId?: string;
  establishmentId?: string;
  date?: string;
}

export interface ServiceRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'en_attente' | 'validee';
  createdAt: string;
  establishmentId?: string;
  clientId?: string;
  details?: string;
  managerMessage?: string;
}

export interface GroupOuting {
  id: string;
  title: string;
  organizerId: string;
  organizerName: string;
  date: string;
  time: string;
  establishmentId?: string;
  establishmentName?: string;
  participants: { userId: string; name: string; status: 'going' | 'maybe' | 'declined' }[];
}

export interface Conversation {
  id: string;
  participants: { id: string; name: string }[];
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface EstablishmentReview {
  id: string;
  establishmentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'manager_invite' | 'reservation_update' | 'friend_request' | 'general';
  read: boolean;
  createdAt: string;
  linkTab?: string;
  relatedId?: string;
}
