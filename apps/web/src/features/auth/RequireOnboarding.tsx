import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCurrentUser } from './useCurrentUser';
import { usePendingInvite } from './usePendingInvite';
import { useHasMembership } from './useHasMembership';

/**
 * RequireOnboarding — gates the platform behind completed onboarding.
 *
 * Order of resolution (top wins):
 *   1. On the accept page itself → render
 *   2. Member of ANY workspace → render (skip onboarding entirely;
 *      they already belong somewhere)
 *   3. Pending invite → redirect to /invite/:token (only for
 *      users who aren't yet in any workspace)
 *   4. Not onboarded_at → /onboarding
 *   5. Otherwise → render
 *
 * The membership check comes BEFORE the invite check so that an
 * existing onboarded user with a stale invite for their own email
 * isn't force-redirected to the accept page every login.
 *
 * The invite check runs only for users with no workspace — a fresh
 * invitee who signed up via the invite link.
 */
export function RequireOnboarding() {
  /* Local draft journeys live outside this guard — they don't
     require a workspace. Belt-and-suspenders in case they get
     nested under this route accidentally. */
  const __loc = window.location.pathname;
  if (__loc.startsWith('/ideas/local/')) {
    return <Outlet />;
  }

  const { data: me, isLoading, isError } = useCurrentUser();
  const invite = usePendingInvite();
  const hasMembership = useHasMembership();
  const location = useLocation();

  if (isLoading || invite.isLoading || hasMembership.isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-0)',
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  if (isError) return <Navigate to="/login" replace />;
  if (!me?.profile) return <Navigate to="/login" replace />;

  /* TEMP diagnostic — remove once the flow is confirmed. */
  if (typeof window !== 'undefined') {
    (window as any).__iv_guard = {
      path: location.pathname,
      hasProfile: !!me?.profile,
      onboardedAt: me?.profile?.onboarded_at ?? null,
      hasMembership: hasMembership.data ?? null,
      pendingInvite: invite.data?.token ?? null,
    };
    console.log('[guard]', (window as any).__iv_guard);
  }

  /* Already on the accept page? Let it render. */
  if (location.pathname.startsWith('/invite/')) return <Outlet />;

  /* Member of any workspace → render. Skip both invite and onboarding. */
  if (hasMembership.data) return <Outlet />;

  /* No workspace yet, but a pending invite → send them to accept it. */
  if (invite.data) {
    return <Navigate to={`/invite/${invite.data.token}`} replace />;
  }

  /* Fresh user, no invite, no workspace → onboard them. */
  if (!me.profile.onboarded_at) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
