'use client';

import { createContext, ReactNode, useContext, useEffect } from 'react';
import { createClientComponentClient } from './client';
import { SupabaseClient } from '@supabase/supabase-js';

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  // Initialize the singleton client once when the provider mounts
  useEffect(() => {
    createClientComponentClient();
  }, []);

  const supabaseClient = createClientComponentClient();

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}

/**
 * Hook to use Supabase client in components
 * Ensures the same instance is used throughout the app
 */
export function useSupabase(): SupabaseClient {
  const supabase = useContext(SupabaseContext);
  if (!supabase) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return supabase;
}
