export type Role = 'client' | 'gerant' | 'admin';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  country?: string;
  city?: string;
}

export type Category = 'maquis' | 'bar' | 'restaurant' | 'boite_de_nuit' | 'glacier_pizzeria' | 'hotel' | 'residence' | 'autre';

export interface Establishment {
  id: string;
  ownerId: string;
  name: string;
  category: Category;
  country?: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  description: string;
  photos: string[];
  tags: string[];
  status: 'en_attente' | 'valide' | 'suspendu';
  averageRating: number;
  geolocation?: string;
  openingHours?: string;
}

export type PubType = 'annonce' | 'promo' | 'bon_plan' | 'evenement' | 'recrutement';

export interface Publication {
  id: string;
  establishmentId: string;
  type: PubType;
  title: string;
  description: string;
  imageUrl?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'expiree' | 'boostee';
  views: number;
  clicks: number;
  createdAt: string;
  whatsapp?: string;
  applyEmail?: string;
}

export interface Review {
  id: string;
  clientId: string;
  establishmentId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Application {
  id: string;
  clientId: string;
  clientName: string;
  publicationId: string;
  publicationTitle: string;
  establishmentId: string;
  establishmentName: string;
  message: string;
  status: 'en_attente' | 'acceptee' | 'refusee';
  date: string;
}

export interface RelationshipRequest {
  id: string;
  initiatorId: string;
  targetId: string;
  establishmentId: string;
  type: 'client_join' | 'gerant_invite';
  status: 'en_attente' | 'acceptee' | 'refusee';
  date: string;
  isDJ?: boolean;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  establishmentId: string;
  type: 'reservation' | 'commande' | 'anniversaire';
  details: string;
  status: 'en_attente' | 'validee' | 'refusee';
  managerMessage?: string;
  date: string;
}

export interface Reservation {
  id: string;
  establishmentId: string;
  establishmentName: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guestsCount: number;
  note?: string;
  status: 'en_attente' | 'confirmee' | 'refusee' | 'annulee';
  createdAt: string;
  history?: { status: string; updatedAt: string; comment?: string }[];
  managerMessage?: string;
}

export interface MenuItem {
  name: string;
  price: number;
  category?: 'entree' | 'plat' | 'dessert' | 'boisson' | string;
  photoUrl?: string;
}

export interface MenuDuJour {
  id: string;
  establishmentId: string;
  date: string; // YYYY-MM-DD
  items: MenuItem[];
  publishedAt: string;
}

