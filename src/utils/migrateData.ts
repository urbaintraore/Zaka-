import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface MigrationSummary {
  collection: string;
  total: number;
  migrated: number;
  failed: number;
  errors: string[];
}

export interface FullMigrationReport {
  startedAt: string;
  completedAt: string;
  success: boolean;
  summaries: MigrationSummary[];
}

/**
 * Fetches all documents from a Firestore collection and upserts them into a Supabase table.
 */
export async function migrateCollection(
  firestoreCollection: string,
  supabaseTable: string,
  transform?: (docData: any, docId: string) => any
): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    collection: firestoreCollection,
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  if (!isSupabaseConfigured) {
    summary.errors.push('Supabase is not configured. Please set SUPABASE_URL / VITE_SUPABASE_URL and SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY.');
    return summary;
  }

  try {
    const snap = await getDocs(collection(db, firestoreCollection));
    summary.total = snap.size;

    const rows: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const transformed = transform ? transform(data, docSnap.id) : { id: docSnap.id, ...data };
      if (transformed) {
        rows.push(transformed);
      }
    });

    if (rows.length > 0) {
      // Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(supabaseTable).upsert(chunk, { onConflict: 'id' });
        if (error) {
          summary.failed += chunk.length;
          summary.errors.push(`Batch ${i}-${i + chunk.length}: ${error.message}`);
        } else {
          summary.migrated += chunk.length;
        }
      }
    }
  } catch (err: any) {
    summary.errors.push(`Firestore read failed: ${err?.message || err}`);
  }

  return summary;
}

/**
 * Runs full migration from Firestore to Supabase in relational dependency order.
 */
export async function runFullDataMigration(): Promise<FullMigrationReport> {
  const report: FullMigrationReport = {
    startedAt: new Date().toISOString(),
    completedAt: '',
    success: true,
    summaries: [],
  };

  // 1. Users
  report.summaries.push(await migrateCollection('users', 'users', (d, id) => ({
    id,
    email: d.email || null,
    phone: d.phone || null,
    name: d.name || '',
    role: d.role || 'client',
    country: d.country || 'Burkina Faso',
    city: d.city || 'Ouagadougou',
    avatar: d.avatar || null,
    category: d.category || null,
    code_parrainage: d.code_parrainage || null,
    parrainId: d.parrainId || null,
    zakaPoints: d.zakaPoints || 0,
    points: d.points || 0,
    isVerified: Boolean(d.isVerified),
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 2. Establishments
  report.summaries.push(await migrateCollection('establishments', 'establishments', (d, id) => ({
    id,
    ownerId: d.ownerId,
    name: d.name || 'Établissement',
    category: d.category || 'maquis',
    country: d.country || 'Burkina Faso',
    city: d.city || 'Ouagadougou',
    neighborhood: d.neighborhood || '',
    address: d.address || '',
    phone: d.phone || '',
    description: d.description || '',
    photos: d.photos || [],
    tags: d.tags || [],
    geolocation: d.geolocation || '',
    openingHours: d.openingHours || '',
    menuPdfUrl: d.menuPdfUrl || null,
    menuImages: d.menuImages || [],
    status: d.status || 'valide',
    averageRating: d.averageRating || 0,
    hairSalonData: d.hairSalonData || null,
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 3. Reviews
  report.summaries.push(await migrateCollection('reviews', 'reviews', (d, id) => ({
    id,
    establishmentId: d.establishmentId,
    clientId: d.clientId,
    clientName: d.clientName || 'Client',
    clientAvatar: d.clientAvatar || null,
    rating: d.rating || 5,
    comment: d.comment || '',
    photos: d.photos || [],
    reply: d.reply || null,
    date: d.date || new Date().toISOString(),
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 4. Reservations
  report.summaries.push(await migrateCollection('reservations', 'reservations', (d, id) => ({
    id,
    clientId: d.clientId,
    clientName: d.clientName || '',
    clientPhone: d.clientPhone || '',
    establishmentId: d.establishmentId,
    establishmentName: d.establishmentName || '',
    date: d.date || '',
    time: d.time || '',
    guests: d.guests || 1,
    specialRequests: d.specialRequests || '',
    status: d.status || 'en_attente',
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 5. Publications
  report.summaries.push(await migrateCollection('publications', 'publications', (d, id) => ({
    id,
    establishmentId: d.establishmentId,
    type: d.type || 'evenement',
    title: d.title || '',
    description: d.description || '',
    imageUrl: d.imageUrl || null,
    startDate: d.startDate || null,
    endDate: d.endDate || null,
    status: d.status || 'active',
    views: d.views || 0,
    clicks: d.clicks || 0,
    isEmergency: Boolean(d.isEmergency),
    whatsapp: d.whatsapp || null,
    applyEmail: d.applyEmail || null,
    expiresAt: d.expiresAt || null,
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 6. Applications
  report.summaries.push(await migrateCollection('applications', 'applications', (d, id) => ({
    id,
    clientId: d.clientId,
    clientName: d.clientName || '',
    publicationId: d.publicationId,
    publicationTitle: d.publicationTitle || '',
    establishmentId: d.establishmentId,
    establishmentName: d.establishmentName || '',
    message: d.message || '',
    status: d.status || 'en_attente',
    date: d.date || new Date().toISOString(),
  })));

  // 7. Carnet Entrées
  report.summaries.push(await migrateCollection('carnet_entrees', 'carnet_entrees', (d, id) => ({
    id,
    clientId: d.clientId,
    establishmentId: d.establishmentId,
    type: d.type || 'standard',
    date: d.date || new Date().toISOString(),
    privateNote: d.privateNote || null,
    createdAt: d.createdAt || new Date().toISOString(),
  })));

  // 8. Loyalty Cards
  report.summaries.push(await migrateCollection('loyalty_cards', 'loyalty_cards', (d, id) => ({
    id,
    clientId: d.clientId,
    establishmentId: d.establishmentId,
    points: d.points || 0,
    tier: d.tier || 'bronze',
    history: d.history || [],
    lastUpdated: d.lastUpdated || new Date().toISOString(),
  })));

  report.completedAt = new Date().toISOString();
  report.success = report.summaries.every((s) => s.failed === 0 && s.errors.length === 0);
  return report;
}
