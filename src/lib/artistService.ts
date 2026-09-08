import { supabase, isSupabaseConfigured } from './supabase';
import {
  ArtistProfile,
  ArtistBooking,
  ArtistEstablishmentRelation,
  ArtistPost,
  ArtistStory
} from '../types';

// ==========================================
// LOCAL / IN-MEMORY FALLBACK STORE (FOR SEAMLESS OFFLINE/PREVIEW)
// ==========================================
let localArtistProfiles: ArtistProfile[] = [
  {
    id: 'art-1',
    userId: 'u-artist-smart-key',
    nomArtiste: 'Smarty',
    nomComplet: 'Louis Salif Kiekieta',
    categorieArtistique: 'Chanteur / Chanteuse',
    genres: ['Afrobeat', 'Hip-hop / Rap', 'Musique burkinabè'],
    biographie: 'Prix Découvertes RFI, artiste engagé burkinabè mêlant hip-hop, sonorités traditionnelles et textes poétiques en français et mooré.',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    photoProfil: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200',
    whatsappPro: '+22670000001',
    telephonePro: '+22670000001',
    reseauxSociaux: {
      instagram: 'smarty_officiel',
      facebook: 'SmartyOfficiel',
      youtube: 'SmartyBurkina'
    },
    liensMusicaux: {
      spotify: 'https://spotify.com',
      appleMusic: 'https://apple.com',
      youtubeMusic: 'https://youtube.com'
    },
    verificationStatus: 'verified',
    followersCount: 1420,
    bookingsCount: 38,
    createdAt: new Date().toISOString()
  },
  {
    id: 'art-2',
    userId: 'u-artist-dj-flo',
    nomArtiste: 'DJ Flo Mix',
    nomComplet: 'Florent Sawadogo',
    categorieArtistique: 'DJ',
    genres: ['DJ / Électro', 'Afrobeat', 'Afropop'],
    biographie: 'DJ résident des plus grands clubs et maquis de Ouagadougou et Bobo-Dioulasso. Ambiance garantie pour vos soirées et festivals.',
    ville: 'Ouagadougou',
    pays: 'Burkina Faso',
    photoProfil: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600',
    photoCouverture: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200',
    whatsappPro: '+22676000002',
    telephonePro: '+22676000002',
    verificationStatus: 'verified',
    followersCount: 980,
    bookingsCount: 52,
    createdAt: new Date().toISOString()
  }
];

let localBookings: ArtistBooking[] = [];
let localRelations: ArtistEstablishmentRelation[] = [];
let localPosts: ArtistPost[] = [
  {
    id: 'post-1',
    artistId: 'art-1',
    artistName: 'Smarty',
    artistPhoto: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    type: 'evenement',
    title: 'Grand Concert Live à Ouaga !',
    content: 'Retrouvez-moi ce vendredi au Palais des Sports de Ouaga 2000 pour un concert inédit avec des invités surprises. Les réservations sont ouvertes !',
    mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    likesCount: 124,
    commentsCount: 18,
    sharesCount: 32,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];
let localStories: ArtistStory[] = [
  {
    id: 'story-1',
    artistId: 'art-1',
    artistName: 'Smarty',
    artistPhoto: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600',
    type: 'photo',
    mediaUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800',
    caption: 'Répétitions en studio avant le live 🔥',
    viewsCount: 340,
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString()
  }
];
let localFollows: { [key: string]: boolean } = {};

// ==========================================
// ARTIST PROFILES
// ==========================================

export async function fetchArtistProfile(artistId: string): Promise<ArtistProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('id', artistId)
        .maybeSingle();

      if (!error && data) {
        return mapDbArtistProfile(data);
      }
    } catch (err) {
      console.warn('Supabase fetchArtistProfile error:', err);
    }
  }
  return localArtistProfiles.find(a => a.id === artistId) || null;
}

export async function fetchArtistProfileByUserId(userId: string): Promise<ArtistProfile | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return mapDbArtistProfile(data);
      }
    } catch (err) {
      console.warn('Supabase fetchArtistProfileByUserId error:', err);
    }
  }
  return localArtistProfiles.find(a => a.userId === userId) || null;
}

export async function fetchAllArtists(category?: string, city?: string): Promise<ArtistProfile[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('artist_profiles').select('*');
      if (category && category !== 'Tous') {
        query = query.eq('categorie_artistique', category);
      }
      if (city && city !== 'Toutes') {
        query = query.eq('ville', city);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(mapDbArtistProfile);
      }
    } catch (err) {
      console.warn('Supabase fetchAllArtists error:', err);
    }
  }

  let list = [...localArtistProfiles];
  if (category && category !== 'Tous') {
    list = list.filter(a => a.categorieArtistique === category);
  }
  if (city && city !== 'Toutes') {
    list = list.filter(a => a.ville.toLowerCase() === city.toLowerCase());
  }
  return list;
}

export async function saveArtistProfile(profile: Partial<ArtistProfile> & { userId: string }): Promise<ArtistProfile> {
  const existing = await fetchArtistProfileByUserId(profile.userId);
  const now = new Date().toISOString();

  const toSave: ArtistProfile = {
    id: existing?.id || profile.id || `art-${Date.now()}`,
    userId: profile.userId,
    nomArtiste: profile.nomArtiste || existing?.nomArtiste || 'Artiste',
    nomComplet: profile.nomComplet || existing?.nomComplet,
    categorieArtistique: profile.categorieArtistique || existing?.categorieArtistique || 'Chanteur / Chanteuse',
    genres: profile.genres || existing?.genres || ['Afrobeat'],
    biographie: profile.biographie !== undefined ? profile.biographie : existing?.biographie,
    ville: profile.ville || existing?.ville || 'Ouagadougou',
    pays: profile.pays || existing?.pays || 'Burkina Faso',
    photoProfil: profile.photoProfil || existing?.photoProfil,
    photoCouverture: profile.photoCouverture || existing?.photoCouverture,
    whatsappPro: profile.whatsappPro || existing?.whatsappPro,
    telephonePro: profile.telephonePro || existing?.telephonePro,
    reseauxSociaux: profile.reseauxSociaux || existing?.reseauxSociaux,
    liensMusicaux: profile.liensMusicaux || existing?.liensMusicaux,
    verificationStatus: existing?.verificationStatus || 'unverified',
    followersCount: existing?.followersCount || 0,
    bookingsCount: existing?.bookingsCount || 0,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('artist_profiles').upsert({
        id: toSave.id,
        user_id: toSave.userId,
        nom_artiste: toSave.nomArtiste,
        nom_complet: toSave.nomComplet,
        categorie_artistique: toSave.categorieArtistique,
        genres: toSave.genres,
        biographie: toSave.biographie,
        ville: toSave.ville,
        pays: toSave.pays,
        photo_profil: toSave.photoProfil,
        photo_couverture: toSave.photoCouverture,
        whatsapp_pro: toSave.whatsappPro,
        telephone_pro: toSave.telephonePro,
        reseaux_sociaux: toSave.reseauxSociaux,
        liens_musicaux: toSave.liensMusicaux,
        verification_status: toSave.verificationStatus,
        updated_at: now
      });
    } catch (err) {
      console.warn('Supabase saveArtistProfile error:', err);
    }
  }

  // Update local
  const idx = localArtistProfiles.findIndex(a => a.id === toSave.id || a.userId === toSave.userId);
  if (idx >= 0) {
    localArtistProfiles[idx] = toSave;
  } else {
    localArtistProfiles.push(toSave);
  }

  return toSave;
}

// ==========================================
// BOOKINGS
// ==========================================

export async function fetchArtistBookings(artistId: string): Promise<ArtistBooking[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('artist_bookings')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapDbBooking);
      }
    } catch (err) {
      console.warn('Supabase fetchArtistBookings error:', err);
    }
  }
  return localBookings.filter(b => b.artistId === artistId);
}

export async function createArtistBooking(booking: Omit<ArtistBooking, 'id' | 'createdAt' | 'status'>): Promise<ArtistBooking> {
  const newBooking: ArtistBooking = {
    ...booking,
    id: `book-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('artist_bookings').insert({
        id: newBooking.id,
        artist_id: newBooking.artistId,
        artist_name: newBooking.artistName,
        requester_id: newBooking.requesterId,
        requester_name: newBooking.requesterName,
        requester_phone: newBooking.requesterPhone,
        requester_whatsapp: newBooking.requesterWhatsapp,
        establishment_id: newBooking.establishmentId,
        establishment_name: newBooking.establishmentName,
        event_name: newBooking.eventName,
        event_type: newBooking.eventType,
        date: newBooking.date,
        time: newBooking.time,
        location: newBooking.location,
        city: newBooking.city,
        budget: newBooking.budget,
        description: newBooking.description,
        estimated_attendees: newBooking.estimatedAttendees,
        status: newBooking.status,
        created_at: newBooking.createdAt
      });
    } catch (err) {
      console.warn('Supabase createArtistBooking error:', err);
    }
  }

  localBookings.unshift(newBooking);
  return newBooking;
}

export async function updateBookingStatus(
  bookingId: string,
  status: ArtistBooking['status']
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('artist_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);
    } catch (err) {
      console.warn('Supabase updateBookingStatus error:', err);
    }
  }

  const b = localBookings.find(x => x.id === bookingId);
  if (b) {
    b.status = status;
    b.updatedAt = new Date().toISOString();
  }
  return true;
}

// ==========================================
// ARTIST ↔ ÉTABLISSEMENT RELATIONS (RÉSIDENCE / COLLAB)
// ==========================================

export async function fetchArtistEstablishmentRelations(
  filter: { artistId?: string; establishmentId?: string }
): Promise<ArtistEstablishmentRelation[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('artist_establishment_relations').select('*');
      if (filter.artistId) query = query.eq('artist_id', filter.artistId);
      if (filter.establishmentId) query = query.eq('establishment_id', filter.establishmentId);
      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapDbRelation);
      }
    } catch (err) {
      console.warn('Supabase fetchArtistEstablishmentRelations error:', err);
    }
  }

  return localRelations.filter(r => {
    if (filter.artistId && r.artistId !== filter.artistId) return false;
    if (filter.establishmentId && r.establishmentId !== filter.establishmentId) return false;
    return true;
  });
}

export async function proposeEstablishmentRelation(
  relation: Omit<ArtistEstablishmentRelation, 'id' | 'createdAt' | 'status'>
): Promise<ArtistEstablishmentRelation> {
  const newRel: ArtistEstablishmentRelation = {
    ...relation,
    id: `rel-${Date.now()}`,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('artist_establishment_relations').insert({
        id: newRel.id,
        artist_id: newRel.artistId,
        artist_name: newRel.artistName,
        establishment_id: newRel.establishmentId,
        establishment_name: newRel.establishmentName,
        relation_type: newRel.relationType,
        status: newRel.status,
        initiated_by: newRel.initiatedBy,
        notes: newRel.notes,
        start_date: newRel.startDate,
        end_date: newRel.endDate,
        created_at: newRel.createdAt
      });
    } catch (err) {
      console.warn('Supabase proposeEstablishmentRelation error:', err);
    }
  }

  localRelations.unshift(newRel);
  return newRel;
}

export async function updateRelationStatus(
  relationId: string,
  status: ArtistEstablishmentRelation['status']
): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('artist_establishment_relations')
        .update({ status })
        .eq('id', relationId);
    } catch (err) {
      console.warn('Supabase updateRelationStatus error:', err);
    }
  }

  const r = localRelations.find(x => x.id === relationId);
  if (r) r.status = status;
  return true;
}

// ==========================================
// FOLLOW SYSTEM
// ==========================================

export async function toggleFollowArtist(artistId: string, userId: string): Promise<boolean> {
  const key = `${artistId}_${userId}`;
  const isFollowing = localFollows[key];
  const nextState = !isFollowing;
  localFollows[key] = nextState;

  // Update profile followers count locally
  const artist = localArtistProfiles.find(a => a.id === artistId);
  if (artist) {
    artist.followersCount = Math.max(0, (artist.followersCount || 0) + (nextState ? 1 : -1));
  }

  if (isSupabaseConfigured) {
    try {
      if (nextState) {
        await supabase.from('artist_follows').insert({
          artist_id: artistId,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      } else {
        await supabase.from('artist_follows').delete().match({ artist_id: artistId, user_id: userId });
      }
    } catch (err) {
      console.warn('Supabase toggleFollowArtist error:', err);
    }
  }

  return nextState;
}

export function checkIsFollowing(artistId: string, userId: string): boolean {
  return !!localFollows[`${artistId}_${userId}`];
}

// ==========================================
// PUBLICATIONS & STORIES
// ==========================================

export async function fetchArtistPosts(artistId?: string): Promise<ArtistPost[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('artist_posts').select('*').order('created_at', { ascending: false });
      if (artistId) query = query.eq('artist_id', artistId);
      const { data, error } = await query;
      if (!error && data) return data.map(mapDbPost);
    } catch (err) {
      console.warn('Supabase fetchArtistPosts error:', err);
    }
  }

  return artistId ? localPosts.filter(p => p.artistId === artistId) : localPosts;
}

export async function createArtistPost(post: Omit<ArtistPost, 'id' | 'createdAt' | 'likesCount' | 'commentsCount' | 'sharesCount'>): Promise<ArtistPost> {
  const newPost: ArtistPost = {
    ...post,
    id: `post-${Date.now()}`,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('artist_posts').insert({
        id: newPost.id,
        artist_id: newPost.artistId,
        artist_name: newPost.artistName,
        artist_photo: newPost.artistPhoto,
        type: newPost.type,
        title: newPost.title,
        content: newPost.content,
        media_url: newPost.mediaUrl,
        created_at: newPost.createdAt
      });
    } catch (err) {
      console.warn('Supabase createArtistPost error:', err);
    }
  }

  localPosts.unshift(newPost);
  return newPost;
}

export async function fetchArtistStories(artistId?: string): Promise<ArtistStory[]> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('artist_stories').select('*').gt('expires_at', now).order('created_at', { ascending: false });
      if (artistId) query = query.eq('artist_id', artistId);
      const { data, error } = await query;
      if (!error && data) return data.map(mapDbStory);
    } catch (err) {
      console.warn('Supabase fetchArtistStories error:', err);
    }
  }

  return localStories.filter(s => (!artistId || s.artistId === artistId) && s.expiresAt > now);
}

export async function createArtistStory(story: Omit<ArtistStory, 'id' | 'createdAt' | 'viewsCount' | 'expiresAt'>): Promise<ArtistStory> {
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const newStory: ArtistStory = {
    ...story,
    id: `story-${Date.now()}`,
    viewsCount: 0,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString()
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.from('artist_stories').insert({
        id: newStory.id,
        artist_id: newStory.artistId,
        artist_name: newStory.artistName,
        artist_photo: newStory.artistPhoto,
        type: newStory.type,
        media_url: newStory.mediaUrl,
        caption: newStory.caption,
        views_count: 0,
        expires_at: newStory.expiresAt,
        created_at: newStory.createdAt
      });
    } catch (err) {
      console.warn('Supabase createArtistStory error:', err);
    }
  }

  localStories.unshift(newStory);
  return newStory;
}

// ==========================================
// DB MAPPERS
// ==========================================

function mapDbArtistProfile(item: any): ArtistProfile {
  return {
    id: item.id,
    userId: item.user_id,
    nomArtiste: item.nom_artiste || 'Artiste',
    nomComplet: item.nom_complet,
    categorieArtistique: item.categorie_artistique || 'Chanteur / Chanteuse',
    genres: item.genres || [],
    biographie: item.biographie,
    ville: item.ville || 'Ouagadougou',
    pays: item.pays || 'Burkina Faso',
    photoProfil: item.photo_profil,
    photoCouverture: item.photo_couverture,
    whatsappPro: item.whatsapp_pro,
    telephonePro: item.telephone_pro,
    reseauxSociaux: item.reseaux_sociaux || {},
    liensMusicaux: item.liens_musicaux || {},
    photos: item.photos || [],
    videos: item.videos || [],
    verificationStatus: item.verification_status || 'unverified',
    followersCount: item.followers_count || 0,
    bookingsCount: item.bookings_count || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

function mapDbBooking(item: any): ArtistBooking {
  return {
    id: item.id,
    artistId: item.artist_id,
    artistName: item.artist_name,
    requesterId: item.requester_id,
    requesterName: item.requester_name,
    requesterPhone: item.requester_phone,
    requesterWhatsapp: item.requester_whatsapp,
    establishmentId: item.establishment_id,
    establishmentName: item.establishment_name,
    eventId: item.event_id,
    eventName: item.event_name,
    eventType: item.event_type,
    date: item.date,
    time: item.time,
    location: item.location,
    city: item.city,
    budget: item.budget,
    description: item.description,
    estimatedAttendees: item.estimated_attendees,
    status: item.status,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  };
}

function mapDbRelation(item: any): ArtistEstablishmentRelation {
  return {
    id: item.id,
    artistId: item.artist_id,
    artistName: item.artist_name,
    establishmentId: item.establishment_id,
    establishmentName: item.establishment_name,
    relationType: item.relation_type,
    status: item.status,
    initiatedBy: item.initiated_by,
    notes: item.notes,
    startDate: item.start_date,
    endDate: item.end_date,
    createdAt: item.created_at
  };
}

function mapDbPost(item: any): ArtistPost {
  return {
    id: item.id,
    artistId: item.artist_id,
    artistName: item.artist_name,
    artistPhoto: item.artist_photo,
    type: item.type,
    title: item.title,
    content: item.content,
    mediaUrl: item.media_url,
    likesCount: item.likes_count || 0,
    commentsCount: item.comments_count || 0,
    sharesCount: item.shares_count || 0,
    createdAt: item.created_at
  };
}

function mapDbStory(item: any): ArtistStory {
  return {
    id: item.id,
    artistId: item.artist_id,
    artistName: item.artist_name,
    artistPhoto: item.artist_photo,
    type: item.type,
    mediaUrl: item.media_url,
    caption: item.caption,
    viewsCount: item.views_count || 0,
    expiresAt: item.expires_at,
    createdAt: item.created_at
  };
}
