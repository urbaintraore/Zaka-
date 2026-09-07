/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Establishment, UserProfile, EstablishmentReview } from '../types';

// Read env variables for Supabase
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && 
  env.VITE_SUPABASE_ANON_KEY &&
  env.VITE_SUPABASE_URL !== 'https://placeholder-supabase-url.supabase.co'
);

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// AUTHENTICATION UTILITIES
// ==========================================

export async function supabaseSignUp(email: string, password: string, userData: Partial<UserProfile>) {
  if (!isSupabaseConfigured) {
    return { data: { user: { id: `u-${Date.now()}`, email } }, error: null };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        role: userData.role || 'client',
        city: userData.city,
        country: userData.country
      }
    }
  });
  return { data, error };
}

export async function supabaseSignIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return { data: { session: null, user: { id: `u-${Date.now()}`, email } }, error: null };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function supabaseSignOut() {
  if (!isSupabaseConfigured) return { error: null };
  return await supabase.auth.signOut();
}

export async function supabaseGetCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ==========================================
// USER PROFILES DATABASE UTILITIES
// ==========================================

export async function fetchUserProfileFromDb(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as UserProfile;
  } catch (err) {
    console.warn('Supabase fetchUserProfileFromDb warning:', err);
    return null;
  }
}

export async function saveUserProfileToDb(profile: UserProfile): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        city: profile.city,
        country: profile.country,
        points: profile.points,
        code_parrainage: profile.code_parrainage
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveUserProfileToDb error:', err);
    return false;
  }
}

// ==========================================
// ESTABLISHMENTS DATABASE UTILITIES
// ==========================================

export async function fetchEstablishmentsFromDb(): Promise<Establishment[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('establishments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description,
      photoUrl: item.photo_url || item.photoUrl,
      neighborhood: item.neighborhood,
      city: item.city,
      country: item.country,
      rating: item.rating,
      priceLevel: item.price_level || item.priceLevel,
      phone: item.phone,
      tags: item.tags,
      ownerId: item.owner_id || item.ownerId
    }));
  } catch (err) {
    console.warn('Supabase fetchEstablishmentsFromDb warning:', err);
    return [];
  }
}

export async function saveEstablishmentToDb(est: Establishment): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase
      .from('establishments')
      .upsert({
        id: est.id,
        name: est.name,
        category: est.category,
        description: est.description,
        photo_url: est.photoUrl,
        neighborhood: est.neighborhood,
        city: est.city,
        country: est.country,
        rating: est.rating,
        price_level: est.priceLevel,
        phone: est.phone,
        tags: est.tags,
        owner_id: est.ownerId
      });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase saveEstablishmentToDb error:', err);
    return false;
  }
}

export async function deleteEstablishmentFromDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase
      .from('establishments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteEstablishmentFromDb error:', err);
    return false;
  }
}

// ==========================================
// REVIEWS & RATINGS UTILITIES
// ==========================================

export async function fetchReviewsFromDb(establishmentId?: string): Promise<EstablishmentReview[]> {
  if (!isSupabaseConfigured) return [];
  try {
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (establishmentId) {
      query = query.eq('establishment_id', establishmentId);
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      establishmentId: item.establishment_id,
      userId: item.user_id,
      userName: item.user_name,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.created_at
    }));
  } catch (err) {
    console.warn('Supabase fetchReviewsFromDb warning:', err);
    return [];
  }
}

export async function addReviewToDb(review: Omit<EstablishmentReview, 'id' | 'createdAt'>): Promise<EstablishmentReview | null> {
  const newReview: EstablishmentReview = {
    ...review,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  if (!isSupabaseConfigured) return newReview;

  try {
    const { error } = await supabase.from('reviews').insert({
      id: newReview.id,
      establishment_id: newReview.establishmentId,
      user_id: newReview.userId,
      user_name: newReview.userName,
      rating: newReview.rating,
      comment: newReview.comment,
      created_at: newReview.createdAt
    });
    if (error) throw error;
    return newReview;
  } catch (err) {
    console.warn('Supabase addReviewToDb error:', err);
    return newReview;
  }
}
