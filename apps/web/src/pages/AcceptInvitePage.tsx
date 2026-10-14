import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { useAcceptInvite } from '@/lib/hooks/useWorkspaceMembers';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

type State =
  | { status: 'pending' }
  | { status: 'ok'; workspaceId: string }
  | { status: 'error'; message: string };

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const accept = useAcceptInvite();
  const [state, setState] = useState<State>({ status: 'pending' });
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Missing invite token.' });
      return;
    }
    /* Wait for auth to settle before firing accept. */
    if (me.isLoading) return;
    /* Only require the SESSION (auth user), not the profile row.
       The trigger on auth.users guarantees a public.users row now,
       but useCurrentUser may lag a beat — the accept edge function
       reads the auth user id directly, so it works either way. */
    if (!me.data) {
      navigate(
        `/login?next=${encodeURIComponent(`/invite/${token}`)}`,
        { replace: true }
      );
      return;
    }
    if (fired) return;
    setFired(true);
    void (async () => {
      try {
        const res = await accept.mutateAsync(token);
        setState({ status: 'ok', workspaceId: res.workspaceId });
        setTimeout(() => {
          navigate('/ventures', { replace: true });
        }, 1200);
      } catch (e) {
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Could not accept invite.',
        });
      }
    })();
  }, [token, me.isLoading, me.data, fired, accept, navigate]);

  return (
    <PageContainer width="narrow">
      <div className="invite-accept">
        {state.status === 'pending' && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <h1 className="invite-accept__title">Accepting your invite…</h1>
          </>
        )}

        {state.status === 'ok' && (
          <>
            <span className="invite-accept__icon is-ok">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h1 className="invite-accept__title">You're in</h1>
            <p className="invite-accept__copy">
              Welcome to the workspace. Taking you to the ventures…
            </p>
          </>
        )}

        {state.status === 'error' && (
          <>
            <span className="invite-accept__icon is-error">
              <AlertCircle className="h-6 w-6" />
            </span>
            <h1 className="invite-accept__title">Couldn't accept this invite</h1>
            <p className="invite-accept__copy">{state.message}</p>
            <Button
              variant="outline"
              onClick={() => navigate('/ventures')}
              className="mt-4"
            >
              Back to ventures
            </Button>
          </>
        )}
      </div>
    </PageContainer>
  );
}
