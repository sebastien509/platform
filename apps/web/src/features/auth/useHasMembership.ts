import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * useHasMembership — true when the current user belongs to at
 * least one workspace (via invite or own onboarding).
 *
 * Used by RequireOnboarding: a user with a membership is a
 * "member of a team" and doesn't need to create their own
 * workspace. Onboarding is for founders only.
 */
export function useHasMembership() {
  return useQuery<boolean>({
    queryKey: ['has-membership'],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { count, error } = await supabase
        .from('memberships')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', auth.user.id);
      if (error) return false;
      return (count ?? 0) > 0;
    },
    staleTime: 15_000,
  });
}
