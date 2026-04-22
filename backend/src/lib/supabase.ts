import { createClient } from '@supabase/supabase-js';
import { environment } from '../config/environment';

export function createSupabaseServerClient() {
  if (!environment.supabase.url || !environment.supabase.anonKey) {
    throw new Error('Supabase auth environment variables are not configured');
  }

  return createClient(environment.supabase.url, environment.supabase.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
