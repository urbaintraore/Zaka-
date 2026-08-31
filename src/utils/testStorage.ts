import { uploadToSupabaseStorage, downloadFromSupabaseStorage, deleteFromSupabaseStorage, StorageBucket } from '../lib/supabaseStorage';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface StorageTestResult {
  bucket: StorageBucket;
  uploadSuccess: boolean;
  downloadSuccess: boolean;
  deleteSuccess: boolean;
  publicUrl?: string;
  error?: string;
  timestamp: string;
}

/**
 * Generates a dummy SVG/PNG image blob for testing storage bucket upload & RLS policies.
 */
function createDummyImageBlob(label = 'ZAKA+ Test Image'): Blob {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#059669"/>
      <circle cx="150" cy="100" r="40" fill="#ffffff" opacity="0.8"/>
      <text x="150" y="160" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">
        ${label}
      </text>
    </svg>
  `;
  return new Blob([svgString], { type: 'image/svg+xml' });
}

/**
 * Tests upload, download, and deletion of a dummy test image on a given Supabase Storage bucket.
 * Validates that storage bucket RLS policies are active and permit file operations.
 */
export async function testStorageUpload(
  bucket: StorageBucket = 'establishments'
): Promise<StorageTestResult> {
  const result: StorageTestResult = {
    bucket,
    uploadSuccess: false,
    downloadSuccess: false,
    deleteSuccess: false,
    timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    result.error = 'Supabase client non configuré (SUPABASE_URL ou SUPABASE_ANON_KEY manquant).';
    console.error(`[testStorage] ❌ ${result.error}`);
    return result;
  }

  const testFileName = `healthcheck-dummy-${Date.now()}.svg`;
  const dummyImage = createDummyImageBlob(`Test RLS ${bucket}`);

  try {
    console.log(`[testStorage] 1. Tentative d'upload de l'image factice dans le bucket '${bucket}/${testFileName}'...`);
    const uploadRes = await uploadToSupabaseStorage(bucket, testFileName, dummyImage, {
      contentType: 'image/svg+xml',
      upsert: true,
    });

    if (uploadRes.error || !uploadRes.url) {
      result.error = `Échec de l'upload: ${uploadRes.error || 'Aucune URL publique générée'}`;
      console.error(`[testStorage] ❌ ${result.error}`);
      return result;
    }

    result.uploadSuccess = true;
    result.publicUrl = uploadRes.url;
    console.log(`[testStorage] ✅ Upload réussi. URL publique générée : ${uploadRes.url}`);

    // 2. Test de téléchargement
    console.log(`[testStorage] 2. Tentative de téléchargement de '${testFileName}' depuis '${bucket}'...`);
    const downloadRes = await downloadFromSupabaseStorage(bucket, testFileName);
    if (downloadRes.error || !downloadRes.data) {
      result.error = `Échec du download: ${downloadRes.error || 'Aucun blob reçu'}`;
      console.error(`[testStorage] ❌ ${result.error}`);
    } else {
      result.downloadSuccess = true;
      console.log(`[testStorage] ✅ Téléchargement validé (${downloadRes.data.size} octets reçus).`);
    }

    // 3. Test de suppression
    console.log(`[testStorage] 3. Nettoyage et suppression de '${testFileName}'...`);
    const deleteRes = await deleteFromSupabaseStorage(bucket, [testFileName]);
    if (!deleteRes.success || deleteRes.error) {
      result.error = `Échec de suppression: ${deleteRes.error || 'Erreur inconnue'}`;
      console.error(`[testStorage] ❌ ${result.error}`);
    } else {
      result.deleteSuccess = true;
      console.log(`[testStorage] ✅ Fichier de test nettoyé avec succès.`);
    }

    return result;
  } catch (err: any) {
    result.error = `Exception non gérée: ${err?.message || err}`;
    console.error(`[testStorage] ❌ ${result.error}`);
    return result;
  }
}

/**
 * Diagnostic helper to list files and verify read permissions on a bucket.
 */
export async function checkBucketListing(bucket: StorageBucket, path = ''): Promise<{ ok: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false, count: 0, error: 'Supabase non configuré' };
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 10 });
    if (error) {
      return { ok: false, count: 0, error: error.message };
    }
    return { ok: true, count: data?.length || 0 };
  } catch (err: any) {
    return { ok: false, count: 0, error: err?.message || err };
  }
}
