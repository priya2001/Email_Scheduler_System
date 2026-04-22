import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { Request, Response } from 'express';
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

export function createSupabaseRouteClient(req: Request, res: Response) {
  if (!environment.supabase.url || !environment.supabase.anonKey) {
    throw new Error('Supabase auth environment variables are not configured');
  }

  return createServerClient(environment.supabase.url, environment.supabase.anonKey, {
    cookies: {
      getAll() {
        return Object.entries(req.cookies || {}).map(([name, value]) => ({
          name,
          value: String(value),
        }));
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookie(name, value, options);
        });
      },
    },
  });
}
