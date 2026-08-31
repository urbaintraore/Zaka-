import { supabase, isSupabaseConfigured } from './supabaseClient';

export type StorageBucket = 
  | 'establishments' 
  | 'avatars' 
  | 'stories' 
  | 'social-posts' 
  | 'documents-rh' 
  | 'invoices';

export interface StorageUploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload a media file/blob to a specific Supabase storage bucket.
 */
export async function uploadToSupabaseStorage(
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  options?: { contentType?: string; upsert?: boolean }
): Promise<StorageUploadResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL / VITE_SUPABASE_URL and SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      upsert: options?.upsert ?? true,
      cacheControl: '3600',
    });

  if (error) {
    console.error(`[Supabase Storage] Upload error in bucket ${bucket}:`, error);
    return { url: '', path: '', error: error.message };
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}

/**
 * Get the public URL for an existing asset in Supabase storage.
 */
export function getSupabasePublicUrl(bucket: StorageBucket, path: string): string {
  if (!isSupabaseConfigured || !path) return '';
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download a file from Supabase storage.
 */
export async function downloadFromSupabaseStorage(
  bucket: StorageBucket,
  path: string
): Promise<{ data: Blob | null; error?: string }> {
  if (!isSupabaseConfigured) return { data: null, error: 'Supabase not configured' };

  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) {
    return { data: null, error: error.message };
  }
  return { data };
}

/**
 * Delete a file from Supabase storage.
 */
export async function deleteFromSupabaseStorage(
  bucket: StorageBucket,
  paths: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
