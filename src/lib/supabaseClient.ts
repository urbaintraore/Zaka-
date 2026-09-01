import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both naming conventions (with and without VITE_ prefix)
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (typeof window !== 'undefined') {
  console.log('[Supabase Client] Initializing...', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'MISSING',
    hasKey: !!supabaseAnonKey,
    isConfigured: isSupabaseConfigured
  });
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Validates whether the Supabase client communicates with the project.
 */
export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured) {
    return { 
      ok: false, 
      message: 'Supabase credentials (SUPABASE_URL / VITE_SUPABASE_URL, SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY) are not configured in environment variables.' 
    };
  }

  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return { ok: false, message: `Supabase query error: ${error.message}` };
    }
    return { ok: true, message: 'Supabase connection verified successfully.' };
  } catch (err: any) {
    return { ok: false, message: `Failed to connect to Supabase: ${err?.message || err}` };
  }
}
