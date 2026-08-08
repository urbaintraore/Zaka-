export type Role = 'client' | 'gerant' | 'admin' | 'entreprise' | 'salon_coiffure' | 'annonceur';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  country?: string;
  city?: string;
  points?: number;
  referralCode?: string;
  code_parrainage?: string;
  avatar?: string;
}

// ZAKA Ads Module Types
export type CampaignObjective = 'notoriete' | 'promo_evenement' | 'acquisition' | 'vente' | 'telechargement';
export type CampaignStatus = 'brouillon' | 'en_attente' | 'active' | 'pause' | 'terminee' | 'refusee';
export type AdFormat = 'banniere' | 'video' | 'publication_sponsorisee';
export type AdCTA = 'Appeler' | 'WhatsApp' | 'Réserver' | 'Découvrir' | 'Acheter';
export type AdPlacementType = 'home_banner' | 'home_sponsored' | 'establishment_recommended' | 'event_sponsored' | 'push_notification' | 'messaging_native';

export interface CampaignTargeting {
  cities: string[]; // ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', etc.]
  neighborhoods?: string[]; // ['Ouaga 2000', 'Zone du Bois', 'Gounghin', 'Tampouy', etc.]
  ageRanges?: string[]; // ['18-25', '26-35', '36-50']
  interests?: string[]; // ['sorties', 'musique', 'restaurants', 'événements', 'sport', 'mode', 'culture']
  keyMoments?: string[]; // ['vendredi_soir', 'samedi_soir', 'evenements_speciaux']
}

export interface Advertiser {
  id: string; // User ID / Entreprise ID
  name: string;
  sector: string;
  logo?: string;
  phone?: string;
  email?: string;
  description?: string;
  status: 'en_attente' | 'valide' | 'suspendu';
  balance?: number; // FCFA
  createdAt: string;
}

export interface Ad {
  id: string;
  campaignId: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  format: AdFormat;
  dimensions?: '300x250' | '728x90' | 'mobile';
  mediaUrl?: string;
  videoDuration?: number; // 5 to 30s
  description?: string;
  ctaText?: AdCTA;
  ctaLink?: string; // Phone number, WhatsApp link, or URL
  placements: AdPlacementType[];
  impressions: number;
  views: number;
  clicks: number;
  conversions: number;
  status: 'active' | 'pause' | 'expiree' | 'en_attente';
  createdAt: string;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  advertiserName: string;
  title: string;
  objective: CampaignObjective;
  startDate: string;
  endDate: string;
  budgetTotal: number; // in FCFA
  budgetSpent: number;
  status: CampaignStatus;
  targeting: CampaignTargeting;
  ads?: Ad[];
  createdAt: string;
}

export interface AdPayment {
  id: string;
  advertiserId: string;
  advertiserName: string;
  campaignId?: string;
  amount: number; // FCFA
  method: 'Orange Money' | 'Moov Money' | 'Paiement Manuel Admin';
  phoneUsed?: string;
  transactionRef?: string;
  status: 'en_attente' | 'valide' | 'echoue';
  packName?: 'STARTER' | 'BUSINESS' | 'PREMIUM' | 'BOOST' | 'SUR_MESURE';
  createdAt: string;
}

export interface AdInvoice {
  id: string;
  paymentId: string;
  advertiserId: string;
  advertiserName: string;
  amount: number;
  packOrCampaign: string;
  pdfNumber: string;
  date: string;
  status: 'payee' | 'annulee';
}

export interface AdDailyStat {
  id: string;
  campaignId: string;
  advertiserId: string;
  date: string; // YYYY-MM-DD
  impressions: number;
  clicks: number;
  views: number;
  conversions: number;
}

export interface Coiffeur {
  id: string;
  establishmentId: string;
  name: string;
  waitingClientsCount: number;
  lastUpdated: string; // ISO String
}

export interface Entreprise {
  id: string; // matches User id (UID)
  name: string;
  sector: string;
  logo: string;
  description: string;
  philosophy: string;
  status: 'en_attente' | 'valide' | 'suspendu';
  createdAt: string;
  followers?: string[]; // list of clientIds who follow
}

export interface Hairstyle {
  id: string;
  name: string;
  gender: 'homme' | 'femme' | 'enfant';
  photoUrl: string;
  price: number;
}

export interface Hairdresser {
  id: string;
  name: string;
  waitingClientsCount: number;
  lastUpdated: string; // ISO String
}

export interface HairSalonData {
  hairdressers: Hairdresser[];
  hairstyles: Hairstyle[];
}

export type Category = 'maquis' | 'bar' | 'restaurant' | 'boite_de_nuit' | 'glacier_pizzeria' | 'hotel' | 'residence' | 'salon_de_coiffure' | 'autre';

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
  menuPdfUrl?: string;
  menuImages?: string[];
  hairSalonData?: HairSalonData;
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
  isEmergency?: boolean;
  expiresAt?: string;
}

export interface Review {
  id: string;
  clientId: string;
  establishmentId: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CarnetEntry {
  id: string;
  clientId: string;
  establishmentId: string;
  type: 'visite' | 'favori' | 'avis';
  date: string;
  privateNote?: string;
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
  isDJ?: boolean; // Keep for backward compatibility
  requestedRole?: 'client' | 'dj' | 'serveur' | 'caissier' | 'menage' | 'vigile';
  identityPhotoUrl?: string;
}

export interface StaffReview {
  id: string;
  establishmentId: string;
  staffId: string;
  clientId: string;
  clientName: string;
  rating: number;
  comment: string;
  status: 'en_attente' | 'valide' | 'invalide';
  managerNote?: string;
  bonusOrSanction?: {
    type: 'bonus' | 'sanction';
    amount?: number;
    reason?: string;
  };
  date: string;
}

export interface StaffAttendance {
  id: string;
  establishmentId: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  period: 'matinée' | 'soirée';
  lateMinutes: number; // retard d'arrivée en minutes
  earlyDepartureMinutes: number; // temps de départ anticipé en minutes
  justification?: string; // justificatif s'il y en a
  justificationPhotoUrl?: string; // photo justificative
  createdAt: string;
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

export interface Story {
  id: string;
  creatorId: string; // establishmentId, user(dj)Id, influencerId, partnerId
  creatorName: string;
  creatorAvatar: string;
  creatorType: 'establishment' | 'dj' | 'influencer' | 'organizer';
  mediaUrl?: string;
  mediaType: 'image' | 'video';
  text?: string;
  emoji?: string;
  music?: string;
  location?: string;
  createdAt: string; // ISO String
  views: string[]; // List of user IDs
  reactions: Record<string, string>; // userId -> emoji
  responsesCount: number;
  establishmentId?: string; // Associated establishment (if any)
}

export interface EventParticipation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  status: 'interested' | 'going' | 'present';
  timestamp: string; // ISO String
  isVisible: boolean;
}

export interface Parrainage {
  id: string;
  parrainId: string;
  parrainEmail: string;
  parraineId: string;
  parraineEmail: string;
  date: string;
  status: 'en_attente' | 'debloque';
}

/* ==========================================================================
   ZAKA ADS - ADDITIONAL COMPONENT TYPES
   ========================================================================== */

export interface AdPackage {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  estimatedImpressions: number;
  estimatedClicks?: number;
  features: string[];
  recommendedPlacement?: string[];
  isPopular?: boolean;
}

export type AdPaymentMethod = 'orange_money' | 'moov_money' | 'wave' | 'carte_bancaire' | 'Orange Money' | 'Moov Money' | 'Paiement Manuel Admin';



