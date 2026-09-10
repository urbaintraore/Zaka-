export type Role = 
  | 'client' 
  | 'gerant' 
  | 'admin' 
  | 'entreprise' 
  | 'caissier' 
  | 'salon_coiffure' 
  | 'annonceur'
  | 'dj'
  | 'partenaire'
  | 'artiste';

export type Category = 
  | 'maquis' 
  | 'restaurant' 
  | 'hotel' 
  | 'boite' 
  | 'espace_evenementiel' 
  | 'piscine' 
  | 'autre'
  | 'bar'
  | 'boite_de_nuit'
  | 'restaurants'
  | 'residence'
  | 'glacier_pizzeria'
  | 'salon_de_coiffure';

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
  avatar?: string;
  favorites?: string[];
  preferences?: string[];
  points?: number;
  code_parrainage?: string;
  zakaPoints?: number;
  isVerified?: boolean;
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
  status?: 'pending' | 'active' | 'valide' | 'refuse' | 'suspendu' | 'rejetee' | 'en_attente';
  averageRating?: number;
  photos?: string[];
  crowdStatus?: 'low' | 'medium' | 'high' | 'calme' | 'anime' | 'complet';
  crowdStatusUpdatedAt?: string;
  averagePrice?: number;
  quarter?: string;
  address?: string;
  affluence?: any;
  currentClients?: number;
  loyaltyRequiredVisits?: number;
  loyaltyEnabled?: boolean;
  loyaltyReward?: string;
  acceptsZakaPoints?: boolean;
  zakaPointsCost?: number;
  zakaPointsReward?: number;
  reservationsClosed?: boolean;
  reservationsClosedReason?: string;
  openingHours?: any;
  menuPdfUrl?: string;
  menuImages?: string[];
  galleryPhotos?: any[];
  isEntreprise?: boolean;
  currentSong?: any;
  hairSalonData?: any;
  invitationCode?: string;
}

export interface Reservation {
  id: string;
  establishmentId: string;
  establishmentName: string;
  userId?: string;
  userName?: string;
  clientId?: string;
  date: string;
  time: string;
  guestsCount: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'annulee' | 'refusee' | 'confirmee' | 'en_attente';
  totalAmount?: number;
  note?: number;
  notes?: string;
  managerMessage?: string;
  clientName?: string;
  clientPhone?: string;
  allergiesOrDiet?: string;
}

export interface TakeawayOrder {
  id: string;
  establishmentId: string;
  establishmentName: string;
  userId?: string;
  userName?: string;
  clientId?: string;
  items: { id?: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
  status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'terminee' | 'annulee' | 'prete' | 'recue' | 'en_preparation';
  createdAt?: string;
  date?: string;
  pickupTime?: string;
  clientName?: string;
  clientPhone?: string;
  paymentMethod?: string;
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
  isDJ?: boolean;
  isServeur?: boolean;
  userPhone?: string;
  identityPhotoUrl?: string;
}

export interface ServiceRequest {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'en_attente' | 'validee' | 'refusee' | 'rejete';
  createdAt: string;
  establishmentId?: string;
  clientId?: string;
  details?: string;
  managerMessage?: string;
  date?: string;
  time?: string;
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
  responses?: any[];
  creatorName?: string;
  liveLocations?: any;
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
  userId?: string;
  userName?: string;
  userAvatar?: string;
  rating: number; // 1 to 5 stars
  comment: string;
  createdAt: string;
  date?: string;
  clientId?: string;
  ratingPlats?: number;
  ratingService?: number;
  clientName?: string;
  photos?: string[];
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

// ==========================================
// ADVERTISING & CAMPAIGNS TYPES
// ==========================================

export type AdPlacementType = 
  | 'home_banner' 
  | 'home_sponsored' 
  | 'establishment_recommended' 
  | 'sidebar' 
  | 'popup'
  | 'establishment_detail'
  | 'feed_native'
  | 'home_header'
  | 'event_sponsored'
  | 'messaging_native'
  | 'push_notification';

export type CampaignObjective = 
  | 'awareness' 
  | 'traffic' 
  | 'leads' 
  | 'conversions'
  | 'notoriete'
  | 'promo_evenement'
  | 'acquisition'
  | 'vente';

export type AdFormat = 
  | 'banner' 
  | 'native' 
  | 'sponsored_card' 
  | 'video'
  | 'banniere'
  | 'publication_sponsorisee';

export type AdCTA = 
  | 'Savoir plus' 
  | 'Appeler' 
  | 'WhatsApp' 
  | 'Reserver' 
  | 'Commander' 
  | 'En savoir plus'
  | 'Découvrir'
  | 'Réserver';

export type AdPaymentMethod = 'orange_money' | 'mobicash' | 'wave' | 'carte_bancaire' | 'moov_money';

export interface AdPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  impressionsEstimated?: number;
  features: string[];
  estimatedImpressions?: number;
  isPopular?: boolean;
}

export type CampaignStatus = 'draft' | 'pending_payment' | 'pending_validation' | 'active' | 'paused' | 'rejected' | 'completed' | 'en_attente' | 'validee' | 'refusee' | 'validation_attente';

export interface Campaign {
  id: string;
  advertiserId: string;
  title: string;
  format?: string;
  budgetTotal: number;
  budgetDaily?: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  targeting?: {
    cities?: string[];
    categories?: string[];
    genders?: string[];
    gender?: string;
    ageRange?: string[];
    ageRanges?: string[];
    interests?: string[];
    keyMoments?: string[];
    neighborhoods?: string[];
  };
  createdAt?: string;
  organizationId?: string;
  objective?: CampaignObjective;
  advertiserName?: string;
  budgetType?: 'daily' | 'lifetime';
  rejectionReason?: string;
  utmParameters?: any;
  ads?: any[];
  frequencyCap?: any;
}

export interface Ad {
  id: string;
  campaignId: string;
  advertiserId: string;
  title: string;
  description?: string;
  photoUrl?: string;
  mediaUrl?: string;
  ctaText: string;
  ctaLink: string;
  status: 'pending' | 'active' | 'paused' | 'rejected' | 'completed';
  placements: AdPlacementType[];
  impressions?: number;
  clicks?: number;
  headline?: string;
  advertiserName?: string;
  format?: AdFormat;
}

export interface AdDailyStat {
  id: string;
  date: string;
  campaignId: string;
  advertiserId: string;
  impressions: number;
  clicks: number;
  spend: number;
}

export interface AdPayment {
  id: string;
  advertiserId: string;
  campaignId?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'valide' | 'rejete' | 'en_attente';
  proofUrl?: string;
  createdAt: string;
  packName?: string;
  phoneUsed?: string;
  transactionRef?: string;
  advertiserName?: string;
}

export interface AdInvoice {
  id: string;
  advertiserId: string;
  campaignId: string;
  campaignTitle: string;
  amount: number;
  date: string;
  status: 'payee' | 'non_payee';
  pdfNumber?: string;
  packOrCampaign?: string;
  advertiserName?: string;
}

// Additional Types for Recrutement, Friendships, Stock, Sales and Publications
export interface User extends UserProfile {}

export interface AdOrganization {
  id: string;
  name: string;
  logo?: string;
  type: string;
  sector: string;
  country?: string;
  city: string;
  phone: string;
  email: string;
  status: 'en_attente' | 'valide' | 'rejete';
  ownerId: string;
  members?: any[];
  clientIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignTargeting {
  cities?: string[];
  categories?: string[];
  genders?: string[];
  ageRange?: string[];
  ageRanges?: string[];
  interests?: string[];
  neighborhoods?: string[];
  keyMoments?: string[];
}

export interface Publication {
  id: string;
  establishmentId: string;
  establishmentName: string;
  title: string;
  description: string;
  photoUrl?: string;
  coverPhotoUrl?: string;
  price?: number;
  status: 'draft' | 'published' | 'expired' | 'boostee';
  createdAt: string;
  imageUrl?: string;
  startDate?: string;
  type?: string;
  views?: number;
  clicks?: number;
  isEmergency?: boolean;
  expiresAt?: string;
  endDate?: string;
  whatsapp?: string;
  applyEmail?: string;
}

// Stock & Sales Types
export interface ExpenseRecord {
  id: string;
  establishmentId: string;
  type: 'loyer' | 'electricite' | 'eau' | 'personnel' | 'marchandise' | 'autre';
  amount: number;
  description: string;
  date: string;
  recordedBy?: string;
}

export interface StockItem {
  id: string;
  establishmentId: string;
  name: string;
  quantity: number;
  minQuantity?: number;
  price: number;
  purchasePrice?: number;
  category?: string;
  itemType?: 'boisson' | 'plat' | 'menu';
  unit?: string;
  volume?: string;
  description?: string;
  preparationTimeMinutes?: number;
  isMenuDuJour?: boolean;
  photoUrl?: string;
  allergens?: string[];
  unitsPerCase?: number;
  unites_par_caisse?: number;
  stock_faible?: number;
  barcode?: string;
  createdAt?: string;
}

export interface SaleItem {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
  stockId?: string;
  unitPrice?: number;
  category?: string;
}

export interface SaleRecord {
  id: string;
  establishmentId: string;
  userId?: string;
  userName?: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod?: string;
  status?: 'completed' | 'cancelled';
  createdAt?: string;
  date?: string;
  cashierId?: string;
  cashierName?: string;
  mobileMoneyCode?: string;
  serverName?: string;
  tableNote?: string;
  clientType?: string;
  subtotalBoissons?: number;
  subtotalCuisine?: number;
  totalAchat?: number;
  discountAmount?: number;
  paidAmount?: number;
  changeAmount?: number;
  avoirAmount?: number;
}

export interface StockReception {
  id: string;
  establishmentId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  price: number;
  supplier?: string;
  createdAt: string;
}

export interface StockInventory {
  id: string;
  establishmentId: string;
  itemId: string;
  itemName: string;
  expectedQuantity: number;
  actualQuantity: number;
  difference: number;
  reason?: string;
  createdAt: string;
}

// Missing interfaces requested by components
export interface Review extends EstablishmentReview {}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  createdAt?: string;
  tag?: string;
}

export interface Hairstyle {
  id: string;
  name: string;
  description?: string;
  price: number;
  photoUrl: string;
  duration?: string;
  gender?: string;
}

export interface Hairdresser {
  id: string;
  name: string;
  avatarUrl?: string;
  specialty?: string;
  isAvailable?: boolean;
  waitingClientsCount?: number;
  lastUpdated?: string;
}

export interface Coiffeur extends Hairdresser {}

export interface StaffAttendance {
  id: string;
  establishmentId: string;
  staffId: string;
  staffName: string;
  role: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'retard';
}

export interface StaffReview {
  id: string;
  establishmentId: string;
  staffId: string;
  staffName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'en_attente' | 'valide' | 'rejete';
}

export interface EventParticipation {
  id: string;
  pubId?: string;
  eventId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userPhoto?: string;
  status: 'going' | 'maybe' | 'interested' | 'present';
  createdAt?: string;
  isVisible?: boolean;
  timestamp?: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  expiresAt: string;
  viewers?: string[];
  likes?: string[];
  views?: string[];
  reactions?: any;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  creatorType?: 'client' | 'gerant' | 'dj' | 'salon_coiffure' | 'annonceur' | 'partenaire' | 'establishment';
  responsesCount?: number;
  text?: string;
  music?: string;
  location?: string;
  establishmentId?: string;
}

export interface GroupOutingLocation {
  id: string;
  outingId: string;
  userId: string;
  userName: string;
  lat: number;
  lng: number;
  updatedAt: string;
  isSharing?: boolean;
}

export interface AdCreative {
  id: string;
  name: string;
  imageUrl: string;
  createdAt: string;
}

export interface MenuDuJour {
  id: string;
  establishmentId: string;
  name: string;
  description: string;
  price: number;
  photoUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  items?: { name: string; price: number; isAvailable: boolean }[];
}

export interface ActivityLog {
  id: string;
  type: 'recruitment' | 'expense' | 'stock' | 'system';
  message: string;
  timestamp: string;
  establishmentId: string;
}

export interface StaffPermissions {
  canAccessPOS: boolean;
  canViewAccounting: boolean;
  canManageStocks: boolean;
  canViewReviews: boolean;
}

// ==========================================
// ARTISTE MODULE TYPES
// ==========================================

export type ArtistCategory =
  | 'Chanteur / Chanteuse'
  | 'Musicien'
  | 'DJ'
  | 'Groupe / Orchestre'
  | 'Humoriste'
  | 'Comédien'
  | 'Danseur'
  | 'Slameur'
  | 'Poète'
  | 'MC / Animateur'
  | 'Influenceur culturel'
  | 'Artiste visuel'
  | 'Autre';

export const ARTIST_CATEGORIES: ArtistCategory[] = [
  'Chanteur / Chanteuse',
  'Musicien',
  'DJ',
  'Groupe / Orchestre',
  'Humoriste',
  'Comédien',
  'Danseur',
  'Slameur',
  'Poète',
  'MC / Animateur',
  'Influenceur culturel',
  'Artiste visuel',
  'Autre'
];

export const ARTIST_GENRES = [
  'Afrobeat',
  'Afropop',
  'Hip-hop / Rap',
  'Reggae / Dancehall',
  'R&B',
  'Gospel',
  'Musique traditionnelle',
  'Musique mandingue',
  'Musique burkinabè',
  'Musique africaine',
  'Jazz',
  'Acoustique',
  'DJ / Électro',
  'Autre'
];

export type ArtistVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface ArtistProfile {
  id: string;
  userId: string;
  nomArtiste: string;
  nomComplet?: string;
  categorieArtistique: string;
  genres: string[];
  biographie?: string;
  ville: string;
  pays: string;
  photoProfil?: string;
  photoCouverture?: string;
  whatsappPro?: string;
  telephonePro?: string;
  reseauxSociaux?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  liensMusicaux?: {
    spotify?: string;
    appleMusic?: string;
    audiomack?: string;
    boomplay?: string;
    youtubeMusic?: string;
    soundcloud?: string;
  };
  photos?: string[];
  videos?: { id: string; title: string; url: string; thumbnail?: string }[];
  verificationStatus: ArtistVerificationStatus;
  followersCount?: number;
  bookingsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArtistBooking {
  id: string;
  artistId: string;
  artistName?: string;
  requesterId: string;
  requesterName: string;
  requesterPhone: string;
  requesterWhatsapp?: string;
  establishmentId?: string;
  establishmentName?: string;
  eventId?: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  location: string;
  city: string;
  budget?: string | number;
  description: string;
  estimatedAttendees?: number | string;
  status: 'pending' | 'in_discussion' | 'accepted' | 'refused' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface ArtistEstablishmentRelation {
  id: string;
  artistId: string;
  artistName?: string;
  establishmentId: string;
  establishmentName: string;
  relationType: 'resident' | 'collab' | 'booking';
  status: 'pending' | 'accepted' | 'refused' | 'terminated';
  initiatedBy: 'gerant' | 'artist';
  notes?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ArtistPost {
  id: string;
  artistId: string;
  artistName: string;
  artistPhoto?: string;
  type: 'texte' | 'photo' | 'video' | 'affiche' | 'annonce' | 'musique' | 'evenement' | 'promotion' | 'backstage';
  title?: string;
  content: string;
  mediaUrl?: string;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  createdAt: string;
}

export interface ArtistStory {
  id: string;
  artistId: string;
  artistName: string;
  artistPhoto?: string;
  type: 'photo' | 'video' | 'texte' | 'affiche';
  mediaUrl?: string;
  caption?: string;
  viewsCount?: number;
  expiresAt: string;
  createdAt: string;
}

export interface ArtistFollow {
  id: string;
  artistId: string;
  userId: string;
  createdAt: string;
}

// ==========================================
// ZAKA BEAUTY MODULE TYPES & INTERFACES
// ==========================================

export type BeautySalonType = 
  | 'coiffure_femme'
  | 'barber'
  | 'mixte'
  | 'institut'
  | 'onglerie'
  | 'spa'
  | 'maquillage'
  | 'domicile'
  | 'autre';

export type BeautyServiceCategory = 
  | 'coiffure'
  | 'barbe'
  | 'tresses'
  | 'soins'
  | 'ongles'
  | 'maquillage'
  | 'massage'
  | 'epilation'
  | 'autre';

export type BeautyAppointmentStatus = 
  | 'en_attente'
  | 'confirme'
  | 'annule'
  | 'termine';

export interface BeautyOpeningHoursDay {
  ouvert: boolean;
  ouverture: string;
  fermeture: string;
}

export interface BeautyOpeningHours {
  lundi: BeautyOpeningHoursDay;
  mardi: BeautyOpeningHoursDay;
  mercredi: BeautyOpeningHoursDay;
  jeudi: BeautyOpeningHoursDay;
  vendredi: BeautyOpeningHoursDay;
  samedi: BeautyOpeningHoursDay;
  dimanche: BeautyOpeningHoursDay;
}

export interface BeautySalon {
  id: string;
  userId?: string;
  nom: string;
  typeEtablissement: BeautySalonType;
  description?: string;
  adresse?: string;
  quartier?: string;
  ville: string;
  pays: string;
  telephone: string;
  whatsapp?: string;
  photoProfil?: string;
  photoCouverture?: string;
  photosGalerie?: string[];
  horairesOuverture?: BeautyOpeningHours | Record<string, BeautyOpeningHoursDay>;
  noteMoyenne: number;
  totalAvis: number;
  estVerifie?: boolean;
  accepteSansRdv?: boolean;
  aDomicile?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BeautyService {
  id: string;
  salonId: string;
  nom: string;
  description?: string;
  categorie: BeautyServiceCategory;
  dureeMinutes: number;
  prixFcfa: number;
  estPopulaire?: boolean;
  estActif?: boolean;
  createdAt?: string;
}

export interface BeautyAppointment {
  id: string;
  salonId: string;
  salonNom?: string;
  serviceId?: string;
  serviceNom?: string;
  clientId?: string;
  nomClient: string;
  telephoneClient: string;
  dateRdv: string;
  heureRdv: string;
  statut: BeautyAppointmentStatus;
  notesClient?: string;
  notesSalon?: string;
  prixTotalFcfa?: number;
  aDomicile?: boolean;
  adresseDomicile?: string;
  createdAt?: string;
}

export interface BeautyReview {
  id: string;
  salonId: string;
  clientId: string;
  nomClient: string;
  clientAvatar?: string;
  note: number;
  commentaire?: string;
  reponseSalon?: string;
  createdAt: string;
}

export interface BeautySalonClient {
  clientId?: string;
  nomClient: string;
  telephoneClient: string;
  totalRendezVous: number;
  dernierRdvDate: string;
  statutDernierRdv: BeautyAppointmentStatus;
  totalDepenseFcfa: number;
}

