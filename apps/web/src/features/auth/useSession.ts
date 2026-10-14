import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * useSession — the single source of truth for "am I logged in?"
 *
 * Subscribes to Supabase's auth state changes and invalidates the
 * cache whenever sign-in, sign-out, or token refresh fires.
 */
export function useSession() {
  const qc = useQueryClient();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      qc.invalidateQueries({ queryKey: ['session'] });
      if (event === 'SIGNED_OUT') {
        qc.clear();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  return useQuery<Session | null>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: Infinity,
  });
}
