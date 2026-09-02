export type Role = 'client' | 'gerant' | 'admin' | 'entreprise' | 'salon_coiffure' | 'annonceur' | 'partenaire' | 'dj' | 'caissier';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  country?: string;
  city?: string;
  category?: Category;
  points?: number;
  referralCode?: string;
  code_parrainage?: string;
  referralCodeUsed?: string;
  avatar?: string;
  entrepriseData?: { sector: string; logo: string; philosophy: string; description: string };
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
  gender?: 'tous' | 'hommes' | 'femmes';
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
  organizationId?: string;
}

export type AdOrganizationType = 'COMPANY' | 'BRAND' | 'AGENCY';
export type AdOrganizationRole = 'ORGANIZATION_OWNER' | 'CAMPAIGN_MANAGER' | 'ANALYST' | 'FINANCE_MANAGER' | 'CREATIVE_MANAGER' | 'AGENCY_MANAGER';

export interface AdOrganizationMember {
  userId: string;
  userName: string;
  userEmail: string;
  role: AdOrganizationRole;
}

export interface AdOrganization {
  id: string;
  name: string;
  logo?: string;
  type: AdOrganizationType;
  sector: string;
  country?: string;
  city: string;
  phone: string;
  email: string;
  status: 'valide' | 'en_attente' | 'suspendu' | 'refusee';
  ownerId: string;
  members: AdOrganizationMember[];
  clientIds?: string[]; // If agency: IDs of client organizations or advertisers managed
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
  organizationId?: string;
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
  // Professional & B2B Extensions
  organizationId?: string;
  agencyId?: string;
  budgetType?: 'daily' | 'lifetime';
  frequencyCap?: number; // max impressions per user
  timeSchedule?: {
    daysOfWeek: number[]; // 0-6 (Sunday to Saturday)
    startHour: number; // 0-23
    endHour: number; // 0-23
  };
  utmParameters?: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent?: string;
  };
  rejectionReason?: 'contenu_interdit' | 'publicite_trompeuse' | 'informations_fausses' | 'non_conforme' | 'droits' | 'autre';
  moderationComment?: string;
  abTestConfig?: {
    isABTest: boolean;
    variantBTitle?: string;
    variantBMediaUrl?: string;
    variantBCtaText?: AdCTA;
    metrics?: {
      variantAImpressions: number;
      variantAClicks: number;
      variantBImpressions: number;
      variantBClicks: number;
    };
  };
}

export interface AdAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: 'campaign' | 'payment' | 'advertiser' | 'rate' | 'organization' | 'ticket';
  resourceId: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface AdRateConfig {
  id: string;
  placement: AdPlacementType | string;
  placementLabel: string;
  cpmPrice: number; // FCFA per 1000 impressions
  cpcPrice: number; // FCFA per click
  dailyPrice: number; // FCFA per day
  minBudget: number; // FCFA
  maxBudget?: number;
  isActive: boolean;
  updatedAt: string;
}

export interface AdSupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface AdSupportTicket {
  id: string;
  advertiserId: string;
  advertiserName: string;
  campaignId?: string;
  subject: string;
  category: 'technique' | 'paiement' | 'moderation' | 'statistiques' | 'autre';
  status: 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  messages: AdSupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AdCreative {
  id: string;
  organizationId?: string;
  advertiserId: string;
  title: string;
  format: AdFormat;
  mediaUrl: string;
  description?: string;
  ctaText?: AdCTA;
  ctaLink?: string;
  tags?: string[];
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
  spent: number;
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
  status: 'en_attente' | 'valide' | 'suspendu' | 'refusee';
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

export type Category = 
  | 'maquis' 
  | 'bar' 
  | 'restaurant' 
  | 'restaurants'
  | 'boite_de_nuit' 
  | 'glacier_pizzeria' 
  | 'hotel' 
  | 'residence' 
  | 'salon_de_coiffure' 
  | 'brakina' 
  | 'coca_cola' 
  | 'orange_burkina' 
  | 'moov_africa' 
  | 'evenements' 
  | 'marques_locales' 
  | 'autre';

export const CATEGORIES_LIST: { id: Category; label: string; icon?: string }[] = [
  { id: 'maquis', label: 'Maquis', icon: '🍺' },
  { id: 'bar', label: 'Bar', icon: '🍸' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
  { id: 'boite_de_nuit', label: 'Boîte de nuit', icon: '🪩' },
  { id: 'glacier_pizzeria', label: 'Glacier - Pizzeria', icon: '🍦' },
  { id: 'hotel', label: 'Hôtel', icon: '🏨' },
  { id: 'residence', label: 'Résidence', icon: '🏡' },
  { id: 'salon_de_coiffure', label: 'Salon de Coiffure', icon: '✂️' },
  { id: 'brakina', label: 'Brakina', icon: '🍺' },
  { id: 'coca_cola', label: 'Coca-Cola', icon: '🥤' },
  { id: 'orange_burkina', label: 'Orange Burkina', icon: '📱' },
  { id: 'moov_africa', label: 'Moov Africa', icon: '📶' },
  { id: 'evenements', label: 'Événements', icon: '🎉' },
  { id: 'marques_locales', label: 'Marques locales', icon: '🏷️' },
  { id: 'autre', label: 'Autre', icon: '📍' },
];

export function getCategoryLabel(cat?: string): string {
  if (!cat) return 'Établissement';
  const found = CATEGORIES_LIST.find(c => c.id === cat.toLowerCase());
  if (found) return found.label;
  return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  tag?: 'ambiance' | 'salle' | 'vip' | 'terrasse' | 'cuisine_cocktails' | 'evenements' | string;
  createdAt?: string;
  likesCount?: number;
}

export interface Establishment {
  id: string;
  ownerId: string;
  name: string;
  category: Category;
  country?: string;
  city: string;
  neighborhood: string;
  quarter?: string;
  address: string;
  phone: string;
  description: string;
  photos: string[];
  galleryPhotos?: GalleryPhoto[];
  tags: string[];
  status: 'en_attente' | 'valide' | 'suspendu' | 'refusee';
  averageRating: number;
  geolocation?: string;
  lat?: number;
  lng?: number;
  currentClients?: number;
  isEntreprise?: boolean;
  openingHours?: string;
  menuPdfUrl?: string;
  menuImages?: string[];
  hairSalonData?: HairSalonData;
  crowdStatus?: 'calme' | 'anime' | 'complet' | null;
  crowdStatusUpdatedAt?: string;
  loyaltyEnabled?: boolean;
  loyaltyRequiredVisits?: number;
  loyaltyReward?: string;
  acceptsZakaPoints?: boolean;
  zakaPointsReward?: string;
  zakaPointsCost?: number;
  reservationsClosed?: boolean;
  reservationsClosedReason?: string;
  affluence?: 'calme' | 'anime' | 'tres_anime' | 'complet';
  currentSong?: any;
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
  clientName?: string;
  establishmentId: string;
  rating: number; // Keep for backward compatibility or global
  ratingPlats?: number; // Qualité des plats
  ratingService?: number; // Qualité du service
  comment: string;
  date: string;
  photos?: string[];
}

export interface TakeawayOrder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  establishmentId: string;
  establishmentName: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  pickupTime: string;
  paymentMethod: 'sur_place' | 'orange_money' | 'moov_money';
  status: 'recue' | 'en_preparation' | 'prete' | 'terminee' | 'annulee';
  date: string;
  createdAt: string;
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
  createdAt?: string;
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
  isCaissier?: boolean; // Cashier role flag
  isServeur?: boolean; // Waiter/Waitress role flag
  requestedRole?: 'client' | 'dj' | 'serveur' | 'caissier' | 'menage' | 'vigile';
  identityPhotoUrl?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  establishmentName?: string;
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
  allergiesOrDiet?: string;
  reservationType?: string;
  status: 'en_attente' | 'confirmee' | 'refusee' | 'annulee';
  createdAt: string;
  history?: { status: string; updatedAt: string; comment?: string }[];
  managerMessage?: string;
}

export interface LoyaltyCard {
  id: string; // `${clientId}_${establishmentId}`
  clientId: string;
  clientName?: string;
  establishmentId: string;
  visitCount: number;
  rewardUnlocked: boolean;
  unlockedAt?: string;
  lastVisitDate?: string;
}

export interface ZakaRedemption {
  id: string;
  clientId: string;
  clientName: string;
  establishmentId: string;
  establishmentName: string;
  pointsUsed: number;
  reward: string;
  code: string;
  status: 'valide' | 'consomme';
  createdAt: string;
}

export interface GroupOutingResponse {
  userId: string;
  userName: string;
  status: 'je_viens' | 'peut_etre' | 'je_ne_peux_pas';
  updatedAt: string;
}

export interface GroupOutingLocation {
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  updatedAt: string;
  isSharing: boolean;
}

export interface GroupOuting {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  establishmentId?: string;
  establishmentName?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
  shareCode: string;
  responses: GroupOutingResponse[];
  liveLocations?: Record<string, GroupOutingLocation>;
  createdAt: string;
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

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  requesterId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface StockItem {
  id: string;
  establishmentId: string;
  name: string;
  price: number;
  quantity: number;
  volume?: string; // Format / contenance ex: "66cl", "33cl", "50cl"
  unitsPerCase?: number; // Unités par caisse pour ce format précis (ex: 12, 24)
  unites_par_caisse?: number; // Aliases pour la BD Supabase
  category?: 'boisson' | 'cuisine' | string;
  stock_faible?: boolean;
  createdAt: string;
}

export interface StockReception {
  id: string;
  establishmentId: string;
  stockId: string;
  productName: string;
  volume?: string;
  casesCount: number; // Nombre de caisses reçues
  unitsPerCase: number; // Unités par caisse (ex: 12)
  unitsAdded: number; // Total unités ajoutées (casesCount * unitsPerCase)
  date: string;
  registeredBy: string; // ID du Gérant
  registeredByName?: string;
}

export interface StockInventory {
  id: string;
  establishmentId: string;
  stockId: string;
  productName: string;
  volume?: string;
  stockTheorique: number; // Stock calculé en unités
  stockPhysiqueCompte: number; // Stock compté en unités
  ecart: number; // stockPhysiqueCompte - stockTheorique (négatif = perte/vol)
  date: string;
  realisePar: string; // ID du Gérant
  realiseByName?: string;
  adjusted?: boolean; // Vrai si le stock a été réajusté après l'inventaire
  note?: string;
}

export interface SaleItem {
  stockId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: 'boisson' | 'cuisine' | string;
}

export interface SaleRecord {
  id: string;
  establishmentId: string;
  cashierId: string;
  cashierName?: string;
  serverName?: string;
  tableNote?: string;
  clientType?: 'Ordinaire' | 'Abonné' | 'VIP' | string;
  items: SaleItem[];
  subtotalBoissons?: number;
  subtotalCuisine?: number;
  totalAchat?: number;
  discountAmount?: number;
  totalAmount: number; // Total Net à payer
  paidAmount?: number;
  changeAmount?: number;
  avoirAmount?: number;
  mobileMoneyCode?: string;
  date: string;
}




