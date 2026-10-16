import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { useAcceptInvite } from '@/lib/hooks/useWorkspaceMembers';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Edit3,
  Users as UsersIcon,
  CreditCard,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

type State =
  | { status: 'loading' }
  | { status: 'preview'; role: string; workspaceName: string; invitedBy: string | null }
  | { status: 'accepting' }
  | { status: 'ok'; workspaceId: string }
  | { status: 'error'; message: string };

interface Capability {
  icon: typeof Eye;
  label: string;
  detail: string;
}

/**
 * Capability sets — what the invited role will be able to do.
 * Shown on the preview step BEFORE the founder accepts, so they
 * understand their access level up front.
 */
const CAPABILITIES: Record<string, { title: string; capabilities: Capability[] }> = {
  viewer: {
    title: 'Viewer access',
    capabilities: [
      { icon: Eye, label: 'Read everything', detail: 'Ventures, deliverables, research, and knowledge.' },
      { icon: Edit3, label: 'Comment', detail: 'Leave feedback on deliverables. Threads stay attached to the artifact.' },
      { icon: ShieldCheck, label: 'Cannot run ops', detail: 'You can watch the work happen, not trigger it.' },
    ],
  },
  member: {
    title: 'Member access',
    capabilities: [
      { icon: Eye, label: 'Read everything', detail: 'Ventures, deliverables, research, and knowledge.' },
      { icon: Edit3, label: 'Run operations', detail: 'Run any op on any venture in this workspace.' },
      { icon: UsersIcon, label: 'Collaborate', detail: 'Comment, share, and work with the team.' },
    ],
  },
  admin: {
    title: 'Admin access',
    capabilities: [
      { icon: Eye, label: 'Read everything', detail: 'Ventures, deliverables, research, and knowledge.' },
      { icon: Edit3, label: 'Run operations', detail: 'Run any op on any venture in this workspace.' },
      { icon: UsersIcon, label: 'Invite teammates', detail: 'Add or remove workspace members.' },
    ],
  },
  owner: {
    title: 'Owner access',
    capabilities: [
      { icon: Eye, label: 'Read everything', detail: 'Ventures, deliverables, research, and knowledge.' },
      { icon: Edit3, label: 'Run operations', detail: 'Run any op on any venture in this workspace.' },
      { icon: UsersIcon, label: 'Invite teammates', detail: 'Add or remove workspace members.' },
      { icon: CreditCard, label: 'Manage billing', detail: 'Full control over the workspace plan and payment method.' },
    ],
  },
};

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  member: 'Member',
  admin: 'Admin',
  owner: 'Owner',
};

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const me = useCurrentUser();
  const accept = useAcceptInvite();
  const [state, setState] = useState<State>({ status: 'loading' });

  /* Step 1 — read the invite metadata so we can show a preview. */
  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Missing invite token.' });
      return;
    }
    if (me.isLoading) return;

    if (!me.data) {
      navigate(`/login?next=${encodeURIComponent(`/invite/${token}`)}`, {
        replace: true,
      });
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from('workspace_invites')
          .select('role, workspace_id, workspaces(name)')
          .eq('token', token)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setState({ status: 'error', message: error.message });
          return;
        }
        if (!data) {
          setState({
            status: 'error',
            message: 'This invite is invalid or has already been accepted.',
          });
          return;
        }

        const ws: any = (data as any).workspaces;
        setState({
          status: 'preview',
          role: (data as any).role ?? 'member',
          workspaceName: ws?.name ?? 'this workspace',
          invitedBy: null,
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: 'error',
          message: e instanceof Error ? e.message : 'Could not load invite.',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, me.isLoading, me.data, navigate]);

  /* Step 2 — the founder confirms. Then we accept. */
  const handleAccept = async () => {
    if (!token) return;
    setState({ status: 'accepting' });
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
  };

  return (
    <PageContainer width="narrow">
      <div className="invite-accept">
        {state.status === 'loading' && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <h1 className="invite-accept__title">Loading your invite…</h1>
          </>
        )}

        {state.status === 'preview' && (
          <div className="invite-preview">
            <span className="invite-preview__badge">
              <Sparkles className="h-3.5 w-3.5" />
              You're invited
            </span>
            <h1 className="invite-preview__title">
              Join {state.workspaceName}
            </h1>
            <p className="invite-preview__role">
              You'll join as{' '}
              <strong>{ROLE_LABELS[state.role] ?? state.role}</strong>
            </p>

            <div className="invite-preview__caps">
              {(CAPABILITIES[state.role] ?? CAPABILITIES.member).capabilities.map(
                (cap) => {
                  const Icon = cap.icon;
                  return (
                    <div key={cap.label} className="invite-preview__cap">
                      <span className="invite-preview__cap-icon">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="invite-preview__cap-body">
                        <span className="invite-preview__cap-label">
                          {cap.label}
                        </span>
                        <span className="invite-preview__cap-detail">
                          {cap.detail}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="invite-preview__actions">
              <Button
                onClick={handleAccept}
                className="gap-2"
                disabled={accept.isPending}
              >
                Accept invite
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                className="invite-preview__decline"
                onClick={() => navigate('/login')}
              >
                Decline
              </button>
            </div>

            <p className="invite-preview__footnote">
              You can leave the workspace anytime from Settings.
            </p>
          </div>
        )}

        {state.status === 'accepting' && (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
            <h1 className="invite-accept__title">Joining the workspace…</h1>
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
            <h1 className="invite-accept__title">
              Couldn't accept this invite
            </h1>
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
