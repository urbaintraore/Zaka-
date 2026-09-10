import { supabase, isSupabaseConfigured } from './supabase';
import {
  BeautySalon,
  BeautySalonType,
  BeautyService,
  BeautyServiceCategory,
  BeautyAppointment,
  BeautyAppointmentStatus,
  BeautyReview,
  BeautySalonClient,
  BeautyOpeningHours,
  BeautyBusinessHour
} from '../types';

// =========================================================================
// LOCAL IN-MEMORY & LOCALSTORAGE FALLBACK STORE (OFFLINE / PREVIEW SAFETY)
// =========================================================================

const DEFAULT_OPENING_HOURS: BeautyOpeningHours = {
  lundi: { ouvert: true, ouverture: '08:30', fermeture: '19:30' },
  mardi: { ouvert: true, ouverture: '08:30', fermeture: '19:30' },
  mercredi: { ouvert: true, ouverture: '08:30', fermeture: '19:30' },
  jeudi: { ouvert: true, ouverture: '08:30', fermeture: '19:30' },
  vendredi: { ouvert: true, ouverture: '08:30', fermeture: '20:00' },
  samedi: { ouvert: true, ouverture: '08:00', fermeture: '20:30' },
  dimanche: { ouvert: false, ouverture: '10:00', fermeture: '16:00' }
};

let localBeautySalons: BeautySalon[] = [
  {
    id: 'salon-1',
    userId: 'u-salon-prestige',
    nom: 'Prestige Coiffure & Beauté VIP',
    typeEtablissement: 'mixte',
    description: 'Le salon de référence à Ouaga 2000 pour elle et lui. Maîtrise des techniques de coiffure moderne, tresses artistiques, barbering soigné et soins capillaires haut de gamme.',
    adresse: 'Avenue Pascal Zagré, face pharmacie Ouaga 2000',
    quartier: 'Ouaga 2000',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    telephone: '+226 70 12 34 56',
    whatsapp: '+22670123456',
    photoProfil: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=600'
    ],
    horairesOuverture: DEFAULT_OPENING_HOURS,
    noteMoyenne: 4.9,
    totalAvis: 28,
    estVerifie: true,
    accepteSansRdv: true,
    aDomicile: true,
    createdAt: '2026-08-15T10:00:00Z'
  },
  {
    id: 'salon-2',
    userId: 'u-barber-gentleman',
    nom: 'Gentleman Barber Club',
    typeEtablissement: 'barber',
    description: 'Barbershop authentique pour hommes exigeants. Dégradés précis, rasage traditionnel à l\'ancienne, soins de la barbe à la serviette chaude et ambiance club décontractée.',
    adresse: 'Rue des Écoles, Zone du Bois',
    quartier: 'Zone du Bois',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    telephone: '+226 76 88 99 00',
    whatsapp: '+22676889900',
    photoProfil: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: [
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600'
    ],
    horairesOuverture: DEFAULT_OPENING_HOURS,
    noteMoyenne: 4.8,
    totalAvis: 34,
    estVerifie: true,
    accepteSansRdv: true,
    aDomicile: false,
    createdAt: '2026-08-10T09:30:00Z'
  },
  {
    id: 'salon-3',
    userId: 'u-glamour-nails',
    nom: 'Glamour Nails & Spa Lounge',
    typeEtablissement: 'onglerie',
    description: 'Institut spécialisé dans la beauté des mains et des pieds. Manucure russe, capsules américaines, nail art personnalisé et spa pédicure détoxifiant.',
    adresse: 'Boulevard Charles de Gaulle',
    quartier: 'Koulouba',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    telephone: '+226 71 55 44 33',
    whatsapp: '+22671554433',
    photoProfil: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: [
      'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=600'
    ],
    horairesOuverture: DEFAULT_OPENING_HOURS,
    noteMoyenne: 4.9,
    totalAvis: 19,
    estVerifie: true,
    accepteSansRdv: false,
    aDomicile: true,
    createdAt: '2026-08-20T14:15:00Z'
  },
  {
    id: 'salon-4',
    userId: 'u-afro-braids-bobo',
    nom: 'Afro Chic Tresses & Soins Capillaires',
    typeEtablissement: 'coiffure_femme',
    description: 'Spécialiste des tresses africaines, knotless braids, nattes sénégalaises, dreadlocks et soins hydratants pour cheveux crépus et métissés à Bobo-Dioulasso.',
    adresse: 'Avenue de la Liberté, face Cinéma Guimbi',
    quartier: 'Sya',
    ville: 'Bobo-Dioulasso',
    pays: 'Burkina Faso',
    telephone: '+226 20 98 76 54',
    whatsapp: '+22678209876',
    photoProfil: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: [],
    horairesOuverture: DEFAULT_OPENING_HOURS,
    noteMoyenne: 4.7,
    totalAvis: 15,
    estVerifie: true,
    accepteSansRdv: true,
    aDomicile: true,
    createdAt: '2026-08-22T11:00:00Z'
  },
  {
    id: 'salon-5',
    userId: 'u-sublime-institut',
    nom: 'Sublime Institut & Make-Up Artist',
    typeEtablissement: 'institut',
    description: 'Institut de beauté complet offrant maquillage professionnel (mariage, soirées), soins du visage purifiants, massages relaxants et épilation douce.',
    adresse: 'Rue 14.28, Gounghin Sud',
    quartier: 'Gounghin',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    telephone: '+226 70 33 22 11',
    whatsapp: '+22670332211',
    photoProfil: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: [],
    horairesOuverture: DEFAULT_OPENING_HOURS,
    noteMoyenne: 4.8,
    totalAvis: 12,
    estVerifie: false,
    accepteSansRdv: false,
    aDomicile: true,
    createdAt: '2026-08-25T16:00:00Z'
  }
];

let localBeautyServices: BeautyService[] = [
  // Services Salon 1 (Prestige)
  {
    id: 'srv-1',
    salonId: 'salon-1',
    nom: 'Knotless Braids Mi-Longues',
    description: 'Tresses légères sans nœuds, finitions naturelles avec pointes bouclées au choix.',
    categorie: 'tresses',
    dureeMinutes: 180,
    prixFcfa: 15000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-2',
    salonId: 'salon-1',
    nom: 'Coupe Dégradé + Barbe VIP',
    description: 'Coupe tondeuse & ciseaux, traçage au rasoir, bain de vapeur et baume nourrissant.',
    categorie: 'barbe',
    dureeMinutes: 45,
    prixFcfa: 5000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-3',
    salonId: 'salon-1',
    nom: 'Soin Capillaire Profond & Brushing',
    description: 'Shampoing traitant, masque réparateur au beurre de karité bio sous casque vapeur.',
    categorie: 'soins',
    dureeMinutes: 60,
    prixFcfa: 8000,
    estPopulaire: false,
    estActif: true
  },
  // Services Salon 2 (Gentleman Barber)
  {
    id: 'srv-4',
    salonId: 'salon-2',
    nom: 'Coupe Tondeuse & Ciseaux Signature',
    description: 'Dégradé américain ou classique avec traçage net et lotion après-rasage fraîche.',
    categorie: 'coiffure',
    dureeMinutes: 35,
    prixFcfa: 3000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-5',
    salonId: 'salon-2',
    nom: 'Taille de Barbe & Soin Serviette Chaude',
    description: 'Sculpture minutieuse de la barbe, serviette chaude aux huiles essentielles de menthe.',
    categorie: 'barbe',
    dureeMinutes: 30,
    prixFcfa: 2500,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-6',
    salonId: 'salon-2',
    nom: 'Forfait Complet Gentleman (Coupe + Barbe + Masque Noir)',
    description: 'Le soin masculin intégral pour un look impeccable et une peau nette sans impuretés.',
    categorie: 'soins',
    dureeMinutes: 70,
    prixFcfa: 7000,
    estPopulaire: true,
    estActif: true
  },
  // Services Salon 3 (Glamour Nails)
  {
    id: 'srv-7',
    salonId: 'salon-3',
    nom: 'Pose Américaine Gel-X & Nail Art',
    description: 'Pose complète avec capsules gel doux tenue 4 semaines, couleur et 2 ongles nail art inclus.',
    categorie: 'ongles',
    dureeMinutes: 90,
    prixFcfa: 12000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-8',
    salonId: 'salon-3',
    nom: 'Spa Pédicure Détox & Vernis Semi-Permanent',
    description: 'Bain à remous relaxant, gommage aux sels marins, élimination des callosités et vernis semi.',
    categorie: 'ongles',
    dureeMinutes: 60,
    prixFcfa: 10000,
    estPopulaire: true,
    estActif: true
  },
  // Services Salon 4 (Afro Chic Bobo)
  {
    id: 'srv-9',
    salonId: 'salon-4',
    nom: 'Nattes Collées Artistiques (Cornrows)',
    description: 'Motifs personnalisés, zig-zags ou lignes droites avec rajouts de mèches locales.',
    categorie: 'tresses',
    dureeMinutes: 120,
    prixFcfa: 7000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-10',
    salonId: 'salon-4',
    nom: 'Reprise de Locks / Retwist',
    description: 'Lavage purifiant, tournage des repousses au gel végétal et séchage sous casque.',
    categorie: 'coiffure',
    dureeMinutes: 90,
    prixFcfa: 10000,
    estPopulaire: true,
    estActif: true
  },
  // Services Salon 5 (Sublime Institut)
  {
    id: 'srv-11',
    salonId: 'salon-5',
    nom: 'Maquillage Événement / Soirée Glamour',
    description: 'Teint parfait longue tenue, contouring naturel, yeux charbonneux et pose de faux-cils.',
    categorie: 'maquillage',
    dureeMinutes: 60,
    prixFcfa: 15000,
    estPopulaire: true,
    estActif: true
  },
  {
    id: 'srv-12',
    salonId: 'salon-5',
    nom: 'Soin du Visage Coup d\'Éclat aux Fruits',
    description: 'Nettoyage en profondeur, vapozone, extraction des comédons, modelage et masque éclat.',
    categorie: 'soins',
    dureeMinutes: 60,
    prixFcfa: 12000,
    estPopulaire: false,
    estActif: true
  }
];

let localBeautyAppointments: BeautyAppointment[] = [
  {
    id: 'app-1',
    salonId: 'salon-1',
    salonNom: 'Prestige Coiffure & Beauté VIP',
    serviceId: 'srv-1',
    serviceNom: 'Knotless Braids Mi-Longues',
    clientId: 'u-1',
    nomClient: 'Fatima Sanou',
    telephoneClient: '+226 70 23 45 67',
    dateRdv: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    heureRdv: '14:00',
    statut: 'confirme',
    notesClient: 'Mèches couleur #4 châtain foncé si possible.',
    notesSalon: 'Cliente prévenue, durée environ 3h.',
    prixTotalFcfa: 15000,
    aDomicile: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'app-2',
    salonId: 'salon-1',
    salonNom: 'Prestige Coiffure & Beauté VIP',
    serviceId: 'srv-2',
    serviceNom: 'Coupe Dégradé + Barbe VIP',
    clientId: 'u-3',
    nomClient: 'Moussa Traoré',
    telephoneClient: '+226 78 11 22 33',
    dateRdv: new Date(Date.now() + 172800000).toISOString().split('T')[0], // day after tomorrow
    heureRdv: '17:30',
    statut: 'en_attente',
    notesClient: 'Premier passage au salon.',
    prixTotalFcfa: 5000,
    aDomicile: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'app-3',
    salonId: 'salon-2',
    salonNom: 'Gentleman Barber Club',
    serviceId: 'srv-6',
    serviceNom: 'Forfait Complet Gentleman',
    clientId: 'u-1',
    nomClient: 'Ibrahim Ouedraogo',
    telephoneClient: '+226 70 00 11 22',
    dateRdv: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday
    heureRdv: '16:00',
    statut: 'termine',
    prixTotalFcfa: 7000,
    aDomicile: false,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

let localBeautyReviews: BeautyReview[] = [
  {
    id: 'brev-1',
    salonId: 'salon-1',
    clientId: 'u-1',
    nomClient: 'Fatima Sanou',
    note: 5,
    commentaire: 'Le salon est super propre, climatisé et l\'accueil est chaleureux. Les tresses sont magnifiques et ne font pas mal du tout ! Je recommande sans hésiter.',
    reponseSalon: 'Merci beaucoup Fatima pour votre fidélité ! C\'est toujours un plaisir de vous accueillir chez Prestige Coiffure.',
    createdAt: '2026-08-28T16:30:00Z'
  },
  {
    id: 'brev-2',
    salonId: 'salon-1',
    clientId: 'u-4',
    nomClient: 'Aïcha Zoungrana',
    note: 5,
    commentaire: 'Très bon service pour le brushing et soin karité. Mes cheveux sont brillants et soyeux.',
    createdAt: '2026-08-29T11:00:00Z'
  },
  {
    id: 'brev-3',
    salonId: 'salon-2',
    clientId: 'u-2',
    nomClient: 'Abdoulaye Kaboré',
    note: 5,
    commentaire: 'Meilleur barber de la Zone du Bois. Dégradé propre au millimètre près et le soin avec serviette chaude détend parfaitement après une journée de travail.',
    reponseSalon: 'Merci frère ! À très vite pour la prochaine taille.',
    createdAt: '2026-08-30T18:45:00Z'
  }
];

// Load persisted local stores if available
try {
  const savedSalons = localStorage.getItem('zaka_beauty_salons');
  if (savedSalons) localBeautySalons = JSON.parse(savedSalons);

  const savedServices = localStorage.getItem('zaka_beauty_services');
  if (savedServices) localBeautyServices = JSON.parse(savedServices);

  const savedAppointments = localStorage.getItem('zaka_beauty_appointments');
  if (savedAppointments) localBeautyAppointments = JSON.parse(savedAppointments);

  const savedReviews = localStorage.getItem('zaka_beauty_reviews');
  if (savedReviews) localBeautyReviews = JSON.parse(savedReviews);
} catch (e) {
  console.warn('LocalStorage beauty parsing fallback:', e);
}

function persistLocalState() {
  try {
    localStorage.setItem('zaka_beauty_salons', JSON.stringify(localBeautySalons));
    localStorage.setItem('zaka_beauty_services', JSON.stringify(localBeautyServices));
    localStorage.setItem('zaka_beauty_appointments', JSON.stringify(localBeautyAppointments));
    localStorage.setItem('zaka_beauty_reviews', JSON.stringify(localBeautyReviews));
  } catch (e) {
    console.warn('LocalStorage beauty persist error:', e);
  }
}

// =========================================================================
// MAPPER HELPERS (SNAKE_CASE <-> CAMELCASE)
// =========================================================================

function mapSalonRow(row: any): BeautySalon {
  return {
    id: row.id,
    userId: row.user_id,
    nom: row.nom,
    typeEtablissement: row.type_etablissement || 'coiffure_femme',
    description: row.description || '',
    adresse: row.adresse || '',
    quartier: row.quartier || '',
    ville: row.ville || 'Ouagadougou',
    pays: row.pays || 'Burkina Faso',
    telephone: row.telephone || '',
    whatsapp: row.whatsapp || '',
    photoProfil: row.photo_profil || '',
    photoCouverture: row.photo_couverture || '',
    photosGalerie: row.photos_galerie || [],
    horairesOuverture: row.horaires_ouverture || DEFAULT_OPENING_HOURS,
    noteMoyenne: Number(row.note_moyenne || 5.0),
    totalAvis: Number(row.total_avis || 0),
    estVerifie: Boolean(row.est_verifie),
    accepteSansRdv: row.accepte_sans_rdv !== false,
    aDomicile: Boolean(row.a_domicile),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapServiceRow(row: any): BeautyService {
  return {
    id: row.id,
    salonId: row.salon_id,
    nom: row.nom,
    description: row.description || '',
    categorie: row.categorie || 'coiffure',
    dureeMinutes: Number(row.duree_minutes || 30),
    prixFcfa: Number(row.prix_fcfa || 0),
    estPopulaire: Boolean(row.est_populaire),
    estActif: row.est_actif !== false,
    createdAt: row.created_at
  };
}

function mapAppointmentRow(row: any): BeautyAppointment {
  return {
    id: row.id,
    salonId: row.salon_id,
    salonNom: row.beauty_salons?.nom || '',
    serviceId: row.service_id,
    serviceNom: row.beauty_services?.nom || '',
    clientId: row.client_id,
    nomClient: row.nom_client,
    telephoneClient: row.telephone_client,
    dateRdv: row.date_rdv,
    heureRdv: row.heure_rdv,
    statut: row.statut || 'en_attente',
    notesClient: row.notes_client || '',
    notesSalon: row.notes_salon || '',
    prixTotalFcfa: row.prix_total_fcfa ? Number(row.prix_total_fcfa) : undefined,
    aDomicile: Boolean(row.a_domicile),
    adresseDomicile: row.adresse_domicile || '',
    createdAt: row.created_at
  };
}

function mapReviewRow(row: any): BeautyReview {
  return {
    id: row.id,
    salonId: row.salon_id,
    clientId: row.client_id,
    nomClient: row.nom_client,
    note: Number(row.note || 5),
    commentaire: row.commentaire || '',
    reponseSalon: row.reponse_salon || '',
    createdAt: row.created_at
  };
}

// =========================================================================
// SALON QUERIES & MUTATIONS
// =========================================================================

export async function fetchAllBeautySalons(filters?: {
  ville?: string;
  type?: BeautySalonType | 'tous';
  searchTerm?: string;
  aDomicile?: boolean;
  sansRdv?: boolean;
}): Promise<BeautySalon[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('beauty_salons').select('*').order('created_at', { ascending: false });

      if (filters?.ville && filters.ville !== 'tous') {
        query = query.eq('ville', filters.ville);
      }
      if (filters?.type && filters.type !== 'tous') {
        query = query.eq('type_etablissement', filters.type);
      }
      if (filters?.aDomicile) {
        query = query.eq('a_domicile', true);
      }
      if (filters?.sansRdv) {
        query = query.eq('accepte_sans_rdv', true);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        let results = data.map(mapSalonRow);
        if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
          const s = filters.searchTerm.toLowerCase();
          results = results.filter(
            salon =>
              salon.nom.toLowerCase().includes(s) ||
              (salon.ville && salon.ville.toLowerCase().includes(s)) ||
              (salon.quartier && salon.quartier.toLowerCase().includes(s)) ||
              (salon.description && salon.description.toLowerCase().includes(s))
          );
        }
        return results;
      }
    } catch (e) {
      console.warn('Supabase fetchAllBeautySalons error, using local store:', e);
    }
  }

  // Fallback on local store
  let results = [...localBeautySalons];
  if (filters?.ville && filters.ville !== 'tous') {
    results = results.filter(s => s.ville.toLowerCase() === filters.ville!.toLowerCase());
  }
  if (filters?.type && filters.type !== 'tous') {
    results = results.filter(s => s.typeEtablissement === filters.type);
  }
  if (filters?.aDomicile) {
    results = results.filter(s => s.aDomicile);
  }
  if (filters?.sansRdv) {
    results = results.filter(s => s.accepteSansRdv);
  }
  if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
    const s = filters.searchTerm.toLowerCase();
    results = results.filter(
      salon =>
        salon.nom.toLowerCase().includes(s) ||
        (salon.ville && salon.ville.toLowerCase().includes(s)) ||
        (salon.quartier && salon.quartier.toLowerCase().includes(s)) ||
        (salon.description && salon.description.toLowerCase().includes(s))
    );
  }
  return results;
}

export async function fetchBeautySalonById(id: string): Promise<BeautySalon | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_salons')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        return mapSalonRow(data);
      }
    } catch (e) {
      console.warn('Supabase fetchBeautySalonById error, checking local store:', e);
    }
  }
  const local = localBeautySalons.find(s => s.id === id);
  return local || null;
}

export async function fetchBeautySalonByUserId(userId: string): Promise<BeautySalon | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_salons')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        return mapSalonRow(data);
      }
    } catch (e) {
      console.warn('Supabase fetchBeautySalonByUserId error, checking local store:', e);
    }
  }
  const local = localBeautySalons.find(s => s.userId === userId);
  return local || null;
}

export async function saveBeautySalon(salonData: Partial<BeautySalon> & { nom: string; telephone: string }): Promise<BeautySalon> {
  const newSalon: BeautySalon = {
    id: salonData.id || `salon-${Date.now()}`,
    userId: salonData.userId,
    nom: salonData.nom,
    typeEtablissement: salonData.typeEtablissement || 'coiffure_femme',
    description: salonData.description || '',
    adresse: salonData.adresse || '',
    quartier: salonData.quartier || '',
    ville: salonData.ville || 'Ouagadougou',
    pays: salonData.pays || 'Burkina Faso',
    telephone: salonData.telephone,
    whatsapp: salonData.whatsapp || '',
    photoProfil: salonData.photoProfil || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600',
    photoCouverture: salonData.photoCouverture || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200',
    photosGalerie: salonData.photosGalerie || [],
    horairesOuverture: salonData.horairesOuverture || DEFAULT_OPENING_HOURS,
    noteMoyenne: salonData.noteMoyenne || 5.0,
    totalAvis: salonData.totalAvis || 0,
    estVerifie: salonData.estVerifie || false,
    accepteSansRdv: salonData.accepteSansRdv !== false,
    aDomicile: Boolean(salonData.aDomicile),
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_salons')
        .upsert({
          id: newSalon.id,
          user_id: newSalon.userId,
          nom: newSalon.nom,
          type_etablissement: newSalon.typeEtablissement,
          description: newSalon.description,
          adresse: newSalon.adresse,
          quartier: newSalon.quartier,
          ville: newSalon.ville,
          pays: newSalon.pays,
          telephone: newSalon.telephone,
          whatsapp: newSalon.whatsapp,
          photo_profil: newSalon.photoProfil,
          photo_couverture: newSalon.photoCouverture,
          photos_galerie: newSalon.photosGalerie,
          horaires_ouverture: newSalon.horairesOuverture,
          note_moyenne: newSalon.noteMoyenne,
          total_avis: newSalon.totalAvis,
          est_verifie: newSalon.estVerifie,
          accepte_sans_rdv: newSalon.accepteSansRdv,
          a_domicile: newSalon.aDomicile
        })
        .select()
        .single();
      if (!error && data) {
        return mapSalonRow(data);
      }
    } catch (e) {
      console.warn('Supabase saveBeautySalon error, persisting locally:', e);
    }
  }

  // Local fallback
  localBeautySalons = [newSalon, ...localBeautySalons.filter(s => s.id !== newSalon.id)];
  persistLocalState();
  return newSalon;
}

export async function updateBeautySalon(id: string, updates: Partial<BeautySalon>): Promise<BeautySalon> {
  if (isSupabaseConfigured) {
    try {
      const payload: any = {};
      if (updates.nom !== undefined) payload.nom = updates.nom;
      if (updates.typeEtablissement !== undefined) payload.type_etablissement = updates.typeEtablissement;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.adresse !== undefined) payload.adresse = updates.adresse;
      if (updates.quartier !== undefined) payload.quartier = updates.quartier;
      if (updates.ville !== undefined) payload.ville = updates.ville;
      if (updates.telephone !== undefined) payload.telephone = updates.telephone;
      if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
      if (updates.photoProfil !== undefined) payload.photo_profil = updates.photoProfil;
      if (updates.photoCouverture !== undefined) payload.photo_couverture = updates.photoCouverture;
      if (updates.photosGalerie !== undefined) payload.photos_galerie = updates.photosGalerie;
      if (updates.horairesOuverture !== undefined) payload.horaires_ouverture = updates.horairesOuverture;
      if (updates.accepteSansRdv !== undefined) payload.accepte_sans_rdv = updates.accepteSansRdv;
      if (updates.aDomicile !== undefined) payload.a_domicile = updates.aDomicile;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('beauty_salons')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return mapSalonRow(data);
      }
    } catch (e) {
      console.warn('Supabase updateBeautySalon error:', e);
    }
  }

  // Local fallback
  localBeautySalons = localBeautySalons.map(s => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s));
  persistLocalState();
  const updated = localBeautySalons.find(s => s.id === id);
  if (!updated) throw new Error("Salon introuvable");
  return updated;
}

// =========================================================================
// BEAUTY SERVICES (PRESTATIONS & TARIFS)
// =========================================================================

export async function fetchSalonServices(salonId: string, onlyActive = false): Promise<BeautyService[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('beauty_services').select('*').eq('salon_id', salonId).order('prix_fcfa', { ascending: true });
      if (onlyActive) {
        query = query.eq('est_actif', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapServiceRow);
      }
    } catch (e) {
      console.warn('Supabase fetchSalonServices error:', e);
    }
  }

  // Local fallback
  return localBeautyServices.filter(s => s.salonId === salonId && (!onlyActive || s.estActif !== false));
}

export async function saveBeautyService(service: Omit<BeautyService, 'id' | 'createdAt'>): Promise<BeautyService> {
  const newService: BeautyService = {
    ...service,
    id: `srv-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_services')
        .insert({
          id: newService.id,
          salon_id: newService.salonId,
          nom: newService.nom,
          description: newService.description,
          categorie: newService.categorie,
          duree_minutes: newService.dureeMinutes,
          prix_fcfa: newService.prixFcfa,
          est_populaire: newService.estPopulaire || false,
          est_actif: newService.estActif !== false
        })
        .select()
        .single();
      if (!error && data) {
        return mapServiceRow(data);
      }
    } catch (e) {
      console.warn('Supabase saveBeautyService error:', e);
    }
  }

  localBeautyServices = [newService, ...localBeautyServices];
  persistLocalState();
  return newService;
}

export async function updateBeautyService(id: string, updates: Partial<BeautyService>): Promise<BeautyService> {
  if (isSupabaseConfigured) {
    try {
      const payload: any = {};
      if (updates.nom !== undefined) payload.nom = updates.nom;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.categorie !== undefined) payload.categorie = updates.categorie;
      if (updates.dureeMinutes !== undefined) payload.duree_minutes = updates.dureeMinutes;
      if (updates.prixFcfa !== undefined) payload.prix_fcfa = updates.prixFcfa;
      if (updates.estPopulaire !== undefined) payload.est_populaire = updates.estPopulaire;
      if (updates.estActif !== undefined) payload.est_actif = updates.estActif;

      const { data, error } = await supabase
        .from('beauty_services')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        return mapServiceRow(data);
      }
    } catch (e) {
      console.warn('Supabase updateBeautyService error:', e);
    }
  }

  localBeautyServices = localBeautyServices.map(s => (s.id === id ? { ...s, ...updates } : s));
  persistLocalState();
  const updated = localBeautyServices.find(s => s.id === id);
  if (!updated) throw new Error("Service introuvable");
  return updated;
}

export async function deleteBeautyService(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('beauty_services').delete().eq('id', id);
      if (!error) {
        localBeautyServices = localBeautyServices.filter(s => s.id !== id);
        persistLocalState();
        return true;
      }
    } catch (e) {
      console.warn('Supabase deleteBeautyService error:', e);
    }
  }

  localBeautyServices = localBeautyServices.filter(s => s.id !== id);
  persistLocalState();
  return true;
}

// =========================================================================
// APPOINTMENTS (PRISE DE RENDEZ-VOUS)
// =========================================================================

export async function fetchSalonAppointments(salonId: string): Promise<BeautyAppointment[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_appointments')
        .select('*, beauty_salons(nom), beauty_services(nom)')
        .eq('salon_id', salonId)
        .order('date_rdv', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapAppointmentRow);
      }
    } catch (e) {
      console.warn('Supabase fetchSalonAppointments error:', e);
    }
  }

  return localBeautyAppointments
    .filter(a => a.salonId === salonId)
    .sort((a, b) => new Date(`${b.dateRdv}T${b.heureRdv}`).getTime() - new Date(`${a.dateRdv}T${a.heureRdv}`).getTime());
}

export async function fetchClientAppointments(userId: string, phone?: string): Promise<BeautyAppointment[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('beauty_appointments')
        .select('*, beauty_salons(nom), beauty_services(nom)');
      
      if (phone) {
        query = query.or(`client_id.eq.${userId},telephone_client.eq.${phone}`);
      } else {
        query = query.eq('client_id', userId);
      }

      const { data, error } = await query.order('date_rdv', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapAppointmentRow);
      }
    } catch (e) {
      console.warn('Supabase fetchClientAppointments error:', e);
    }
  }

  return localBeautyAppointments
    .filter(a => a.clientId === userId || (phone && a.telephoneClient === phone))
    .sort((a, b) => new Date(`${b.dateRdv}T${b.heureRdv}`).getTime() - new Date(`${a.dateRdv}T${a.heureRdv}`).getTime());
}

export async function createBeautyAppointment(
  appointmentData: Omit<BeautyAppointment, 'id' | 'createdAt'>
): Promise<BeautyAppointment> {
  const newAppointment: BeautyAppointment = {
    ...appointmentData,
    id: `app-${Date.now()}`,
    statut: appointmentData.statut || 'en_attente',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_appointments')
        .insert({
          id: newAppointment.id,
          salon_id: newAppointment.salonId,
          service_id: newAppointment.serviceId || null,
          client_id: newAppointment.clientId || null,
          nom_client: newAppointment.nomClient,
          telephone_client: newAppointment.telephoneClient,
          date_rdv: newAppointment.dateRdv,
          heure_rdv: newAppointment.heureRdv,
          statut: newAppointment.statut,
          notes_client: newAppointment.notesClient || null,
          notes_salon: newAppointment.notesSalon || null,
          prix_total_fcfa: newAppointment.prixTotalFcfa || null,
          a_domicile: Boolean(newAppointment.aDomicile),
          adresse_domicile: newAppointment.adresseDomicile || null
        })
        .select('*, beauty_salons(nom), beauty_services(nom)')
        .single();
      if (!error && data) {
        return mapAppointmentRow(data);
      }
    } catch (e) {
      console.warn('Supabase createBeautyAppointment error:', e);
    }
  }

  localBeautyAppointments = [newAppointment, ...localBeautyAppointments];
  persistLocalState();
  return newAppointment;
}

export async function updateAppointmentStatus(
  id: string,
  statut: BeautyAppointmentStatus,
  notesSalon?: string
): Promise<BeautyAppointment> {
  let updatedAppointment: BeautyAppointment | null = null;

  if (isSupabaseConfigured) {
    try {
      const payload: any = { statut };
      if (notesSalon !== undefined) payload.notes_salon = notesSalon;

      const { data, error } = await supabase
        .from('beauty_appointments')
        .update(payload)
        .eq('id', id)
        .select('*, beauty_salons(nom), beauty_services(nom)')
        .single();
      if (!error && data) {
        updatedAppointment = mapAppointmentRow(data);
      }
    } catch (e) {
      console.warn('Supabase updateAppointmentStatus error:', e);
    }
  }

  if (!updatedAppointment) {
    localBeautyAppointments = localBeautyAppointments.map(a =>
      a.id === id ? { ...a, statut, ...(notesSalon !== undefined ? { notesSalon } : {}) } : a
    );
    persistLocalState();
    updatedAppointment = localBeautyAppointments.find(a => a.id === id) || null;
  }

  if (!updatedAppointment) throw new Error("Rendez-vous introuvable");

  // Dispatch notification to client if clientId is present
  try {
    const salonNom = updatedAppointment.salonNom || 'Salon de Beauté';
    const dateFormatted = updatedAppointment.dateRdv;
    const heureFormatted = updatedAppointment.heureRdv;
    
    let notifTitle = 'Mise à jour de votre rendez-vous';
    let notifMessage = `Le statut de votre rendez-vous chez ${salonNom} a changé : ${statut}.`;
    
    if (statut === 'confirme') {
      notifTitle = 'Rendez-vous Beauté confirmé ! ✅';
      notifMessage = `Votre rendez-vous chez "${salonNom}" prévu le ${dateFormatted} à ${heureFormatted} a été confirmé par le gérant.`;
    } else if (statut === 'annule') {
      notifTitle = 'Rendez-vous Beauté annulé ❌';
      notifMessage = `Votre rendez-vous chez "${salonNom}" prévu le ${dateFormatted} a été annulé${notesSalon ? ` (${notesSalon})` : '.'}`;
    } else if (statut === 'termine') {
      notifTitle = 'Prestation Beauté effectuée 💇‍♀️';
      notifMessage = `Votre soin chez "${salonNom}" est terminé. Merci pour votre confiance !`;
    }

    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: updatedAppointment.clientId || '',
      title: notifTitle,
      message: notifMessage,
      type: 'beauty_appointment_update',
      read: false,
      createdAt: new Date().toISOString(),
      linkTab: 'profile',
      relatedId: updatedAppointment.id,
      appointment: updatedAppointment
    };

    // Save to localStorage notifications
    const existingRaw = localStorage.getItem('zaka_notifications');
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    localStorage.setItem('zaka_notifications', JSON.stringify([newNotif, ...existing]));

    // Dispatch custom events for live UI reactivity
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('zaka-new-notification', { detail: newNotif }));
      window.dispatchEvent(new CustomEvent('beauty-appointment-status-change', { 
        detail: { 
          appointment: updatedAppointment,
          statut,
          notesSalon
        } 
      }));
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          message: notifTitle + " - " + notifMessage,
          type: statut === 'confirme' ? 'success' : statut === 'annule' ? 'error' : 'info'
        }
      }));
    }
  } catch (err) {
    console.warn('Erreur de notification rendez-vous:', err);
  }

  return updatedAppointment;
}

// =========================================================================
// REALTIME SUBSCRIPTION FOR SALON APPOINTMENTS & CLIENT APPOINTMENTS
// =========================================================================

export function subscribeToClientAppointments(
  clientId: string,
  onAppointmentEvent: (appointment: BeautyAppointment, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  if (isSupabaseConfigured && supabase) {
    try {
      const channel = supabase
        .channel(`beauty-client-appointments-${clientId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'beauty_appointments',
            filter: `client_id=eq.${clientId}`
          },
          (payload) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const rowData = payload.new || payload.old;
            if (rowData) {
              const appt = mapAppointmentRow(rowData);
              onAppointmentEvent(appt, eventType);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[ZAKA Realtime] Écoute active pour le client ${clientId}`);
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('removeChannel error:', e);
        }
      };
    } catch (e) {
      console.warn('subscribeToClientAppointments error:', e);
    }
  }

  return () => {};
}

export function subscribeToSalonAppointments(
  salonId: string,
  onAppointmentEvent: (appointment: BeautyAppointment, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void
): () => void {
  if (isSupabaseConfigured && supabase) {
    try {
      const channel = supabase
        .channel(`beauty-appointments-channel-${salonId}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'beauty_appointments',
            filter: `salon_id=eq.${salonId}`
          },
          (payload) => {
            const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            const rowData = payload.new || payload.old;
            if (rowData) {
              const appt = mapAppointmentRow(rowData);
              onAppointmentEvent(appt, eventType);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[ZAKA Realtime] Écoute active sur beauty_appointments pour le salon ${salonId}`);
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('removeChannel error:', e);
        }
      };
    } catch (e) {
      console.warn('subscribeToSalonAppointments error:', e);
    }
  }

  return () => {};
}

// =========================================================================
// BUSINESS HOURS CONFIGURATION (TABLE: beauty_business_hours)
// =========================================================================

export const BEAUTY_DAYS_CONFIG: Array<{ dayOfWeek: number; dayName: keyof BeautyOpeningHours; label: string }> = [
  { dayOfWeek: 1, dayName: 'lundi', label: 'Lundi' },
  { dayOfWeek: 2, dayName: 'mardi', label: 'Mardi' },
  { dayOfWeek: 3, dayName: 'mercredi', label: 'Mercredi' },
  { dayOfWeek: 4, dayName: 'jeudi', label: 'Jeudi' },
  { dayOfWeek: 5, dayName: 'vendredi', label: 'Vendredi' },
  { dayOfWeek: 6, dayName: 'samedi', label: 'Samedi' },
  { dayOfWeek: 7, dayName: 'dimanche', label: 'Dimanche' }
];

export async function fetchSalonBusinessHours(salonId: string): Promise<BeautyBusinessHour[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_business_hours')
        .select('*')
        .eq('salon_id', salonId)
        .order('day_of_week', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          salonId: row.salon_id,
          dayOfWeek: Number(row.day_of_week),
          dayName: row.day_name || BEAUTY_DAYS_CONFIG.find(d => d.dayOfWeek === Number(row.day_of_week))?.dayName || 'lundi',
          dayLabel: BEAUTY_DAYS_CONFIG.find(d => d.dayOfWeek === Number(row.day_of_week))?.label || row.day_name || 'Lundi',
          isOpen: row.is_open !== false,
          openTime: row.open_time || '08:30',
          closeTime: row.close_time || '19:30',
          pauseStart: row.pause_start || undefined,
          pauseEnd: row.pause_end || undefined,
          notes: row.notes || undefined
        }));
      }
    } catch (e) {
      console.warn('Supabase fetchSalonBusinessHours error:', e);
    }
  }

  // Fallback: load from salon's horairesOuverture or DEFAULT_OPENING_HOURS
  const salon = localBeautySalons.find(s => s.id === salonId);
  const horaires = salon?.horairesOuverture || DEFAULT_OPENING_HOURS;

  return BEAUTY_DAYS_CONFIG.map(day => {
    const sched = (horaires as any)[day.dayName] || { ouvert: day.dayName !== 'dimanche', ouverture: '08:30', fermeture: '19:30' };
    return {
      salonId,
      dayOfWeek: day.dayOfWeek,
      dayName: day.dayName,
      dayLabel: day.label,
      isOpen: sched.ouvert !== false,
      openTime: sched.ouverture || '08:30',
      closeTime: sched.fermeture || '19:30',
      pauseStart: sched.pauseStart || undefined,
      pauseEnd: sched.pauseEnd || undefined
    };
  });
}

export async function saveSalonBusinessHours(salonId: string, hours: BeautyBusinessHour[]): Promise<BeautyBusinessHour[]> {
  // 1. Build compatible BeautyOpeningHours object
  const newOpeningHours: any = {};
  hours.forEach(h => {
    newOpeningHours[h.dayName] = {
      ouvert: h.isOpen,
      ouverture: h.openTime,
      fermeture: h.closeTime,
      ...(h.pauseStart ? { pauseStart: h.pauseStart } : {}),
      ...(h.pauseEnd ? { pauseEnd: h.pauseEnd } : {})
    };
  });

  // 2. Persist in Supabase beauty_business_hours table
  if (isSupabaseConfigured) {
    try {
      const rows = hours.map(h => ({
        salon_id: salonId,
        day_of_week: h.dayOfWeek,
        day_name: h.dayName,
        is_open: h.isOpen,
        open_time: h.openTime,
        close_time: h.closeTime,
        pause_start: h.pauseStart || null,
        pause_end: h.pauseEnd || null,
        notes: h.notes || null,
        updated_at: new Date().toISOString()
      }));

      const { error: upsertError } = await supabase
        .from('beauty_business_hours')
        .upsert(rows, { onConflict: 'salon_id,day_of_week' });

      if (upsertError) {
        console.warn('Supabase upsert beauty_business_hours error:', upsertError);
      }

      // Also update beauty_salons table
      await supabase
        .from('beauty_salons')
        .update({
          horaires_ouverture: newOpeningHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', salonId);
    } catch (e) {
      console.warn('Supabase saveSalonBusinessHours error:', e);
    }
  }

  // 3. Fallback memory & local storage
  localBeautySalons = localBeautySalons.map(s =>
    s.id === salonId ? { ...s, horairesOuverture: newOpeningHours, updatedAt: new Date().toISOString() } : s
  );
  persistLocalState();

  return hours;
}

// =========================================================================
// REVIEWS & RATINGS
// =========================================================================

export async function fetchSalonReviews(salonId: string): Promise<BeautyReview[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_reviews')
        .select('*')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map(mapReviewRow);
      }
    } catch (e) {
      console.warn('Supabase fetchSalonReviews error:', e);
    }
  }

  return localBeautyReviews.filter(r => r.salonId === salonId);
}

export async function createBeautyReview(review: Omit<BeautyReview, 'id' | 'createdAt'>): Promise<BeautyReview> {
  const newReview: BeautyReview = {
    ...review,
    id: `brev-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_reviews')
        .insert({
          id: newReview.id,
          salon_id: newReview.salonId,
          client_id: newReview.clientId,
          nom_client: newReview.nomClient,
          note: newReview.note,
          commentaire: newReview.commentaire || null
        })
        .select()
        .single();
      if (!error && data) {
        // Recalculate average rating on salon
        await refreshSalonRatingStats(newReview.salonId);
        return mapReviewRow(data);
      }
    } catch (e) {
      console.warn('Supabase createBeautyReview error:', e);
    }
  }

  localBeautyReviews = [newReview, ...localBeautyReviews];
  // Recalculate local stats
  const salonReviews = localBeautyReviews.filter(r => r.salonId === newReview.salonId);
  const avg = salonReviews.reduce((sum, r) => sum + r.note, 0) / salonReviews.length;
  localBeautySalons = localBeautySalons.map(s =>
    s.id === newReview.salonId
      ? { ...s, noteMoyenne: Number(avg.toFixed(1)), totalAvis: salonReviews.length }
      : s
  );
  persistLocalState();
  return newReview;
}

export async function replyToBeautyReview(reviewId: string, reponseSalon: string): Promise<BeautyReview> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('beauty_reviews')
        .update({ reponse_salon: reponseSalon })
        .eq('id', reviewId)
        .select()
        .single();
      if (!error && data) {
        return mapReviewRow(data);
      }
    } catch (e) {
      console.warn('Supabase replyToBeautyReview error:', e);
    }
  }

  localBeautyReviews = localBeautyReviews.map(r => (r.id === reviewId ? { ...r, reponseSalon } : r));
  persistLocalState();
  const updated = localBeautyReviews.find(r => r.id === reviewId);
  if (!updated) throw new Error("Avis introuvable");
  return updated;
}

async function refreshSalonRatingStats(salonId: string) {
  try {
    const { data } = await supabase.from('beauty_reviews').select('note').eq('salon_id', salonId);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + Number(r.note), 0) / data.length;
      await supabase
        .from('beauty_salons')
        .update({ note_moyenne: Number(avg.toFixed(2)), total_avis: data.length })
        .eq('id', salonId);
    }
  } catch (e) {
    console.warn('refreshSalonRatingStats error:', e);
  }
}

// =========================================================================
// SALON CLIENTS LIST (DERIVED FROM APPOINTMENTS)
// =========================================================================

export async function fetchSalonClients(salonId: string): Promise<BeautySalonClient[]> {
  const appointments = await fetchSalonAppointments(salonId);
  const clientMap = new Map<string, BeautySalonClient>();

  for (const app of appointments) {
    const key = app.telephoneClient || app.nomClient;
    const existing = clientMap.get(key);

    if (!existing) {
      clientMap.set(key, {
        clientId: app.clientId,
        nomClient: app.nomClient,
        telephoneClient: app.telephoneClient,
        totalRendezVous: 1,
        dernierRdvDate: app.dateRdv,
        statutDernierRdv: app.statut,
        totalDepenseFcfa: app.prixTotalFcfa || 0
      });
    } else {
      existing.totalRendezVous += 1;
      if (new Date(app.dateRdv) > new Date(existing.dernierRdvDate)) {
        existing.dernierRdvDate = app.dateRdv;
        existing.statutDernierRdv = app.statut;
      }
      existing.totalDepenseFcfa += app.prixTotalFcfa || 0;
    }
  }

  return Array.from(clientMap.values()).sort(
    (a, b) => new Date(b.dernierRdvDate).getTime() - new Date(a.dernierRdvDate).getTime()
  );
}

// =========================================================================
// LABELS & HELPERS
// =========================================================================

export const BEAUTY_TYPE_LABELS: Record<BeautySalonType, { label: string; icon: string }> = {
  coiffure_femme: { label: 'Salon Coiffure Femmes', icon: '💇‍♀️' },
  barber: { label: 'Barbershop / Hommes', icon: '💈' },
  mixte: { label: 'Salon Mixte (Hommes & Femmes)', icon: '✨' },
  institut: { label: 'Institut de Beauté', icon: '💆‍♀️' },
  onglerie: { label: 'Onglerie & Nail Bar', icon: '💅' },
  spa: { label: 'Spa & Bien-être', icon: '🧖‍♀️' },
  maquillage: { label: 'Make-Up & Maquillage', icon: '💄' },
  domicile: { label: 'Coiffure & Beauté à Domicile', icon: '🏡' },
  autre: { label: 'Autre Professionnel de Beauté', icon: '🌸' }
};

export const BEAUTY_CATEGORY_LABELS: Record<BeautyServiceCategory, { label: string; icon: string }> = {
  coiffure: { label: 'Coupes & Coiffures', icon: '✂️' },
  barbe: { label: 'Barbe & Rasage', icon: '🪒' },
  tresses: { label: 'Tresses & Nattes', icon: '🪮' },
  soins: { label: 'Soins Visage & Cheveux', icon: '🧴' },
  ongles: { label: 'Ongles & Mains', icon: '💅' },
  maquillage: { label: 'Maquillage', icon: '💄' },
  massage: { label: 'Massages', icon: '💆' },
  epilation: { label: 'Épilation', icon: '✨' },
  autre: { label: 'Autre prestation', icon: '⭐' }
};

export function formatFcfa(amount?: number): string {
  if (amount === undefined || amount === null) return '0 FCFA';
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}

export const submitBeautyReview = createBeautyReview;

export function generateWhatsAppBeautyBookingUrl(
  phone: string,
  salonNom: string,
  serviceNom: string,
  date: string,
  timeSlot: string,
  clientNom: string
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('226') ? cleanPhone : `226${cleanPhone}`;
  const text = `Bonjour ${salonNom}, je viens de réserver sur ZAKA Beauty :\n- Prestation : ${serviceNom}\n- Date : ${date} à ${timeSlot}\n- Nom : ${clientNom}\n\nMerci de confirmer la disponibilité de ce créneau.`;
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
