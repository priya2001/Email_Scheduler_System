import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create a singleton Supabase client instance
 * This ensures only one client is used across the entire app
 */
export function createClientComponentClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );

  return supabaseClient;
}

/**
 * Get the current Supabase client instance (returns null if not yet created)
 */
export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}
