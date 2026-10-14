import { useState } from 'react';
import {
  Building2,
  Plus,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  Crown,
  Shield,
  User as UserIcon,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { useWorkspace } from '@/features/settings/useWorkspace';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { PortalMenu } from '@/components/ui/PortalMenu';
import { TeamInviteGate } from '@/features/upgrade';
import { useWorkspacePlan } from '@/lib/hooks/useWorkspacePlan';
import {
  useWorkspaceMembers,
  useInviteMember,
  useRevokeInvite,
  useRemoveMember,
  useSetMemberRole,
  type WorkspaceRole,
} from '@/lib/hooks/useWorkspaceMembers';

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

const ROLE_ICON: Record<WorkspaceRole, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  member: UserIcon,
  viewer: Eye,
};

/** Open dropdown state — anchor element + the member it belongs to. */
interface OpenMenu {
  memberId: string;
  anchor: HTMLElement;
}

export function WorkspaceCard() {
  const workspace = useWorkspace();
  const me = useCurrentUser();
  const members = useWorkspaceMembers(workspace.data?.id);

  const invite = useInviteMember();
  const revoke = useRevokeInvite();
  const remove = useRemoveMember();
  const setMemberRole = useSetMemberRole();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [error, setError] = useState<string | null>(null);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState<string | null>(null);
  const [inviteGateOpen, setInviteGateOpen] = useState(false);
  const { config: tierConfig } = useWorkspacePlan();
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);

  const myRole = members.data?.role ?? 'member';
  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  const memberList = members.data?.members ?? [];
  const inviteList = members.data?.invites ?? [];
  const meId = me.data?.profile?.id;
  const workspaceId = workspace.data?.id;

  async function handleInvite() {
    setError(null);
    setSentNotice(null);
    if (!workspaceId) return;
    try {
      const res = await invite.mutateAsync({
        workspaceId,
        email: email.trim(),
        role,
      });
      setEmail('');
      if (res.emailSent) {
        setSentNotice(`Invite email sent to ${res.invite.email}.`);
      } else {
        setSentNotice(
          `Invite created for ${res.invite.email}. Copy the link below and send it directly.`,
        );
      }
      setTimeout(() => setSentNotice(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send invite.');
    }
  }

  async function copyLink(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setJustCopied(id);
      setTimeout(() => setJustCopied(null), 1400);
    } catch {
      /* clipboard blocked */
    }
  }

  /* The menu lookup — resolves the current open menu's member. */
  const openMember = openMenu
    ? memberList.find((m) => m.id === openMenu.memberId)
    : null;

  const openMemberCanRemove =
    openMember && canManage && openMember.userId !== meId && openMember.role !== 'owner';
  const openMemberCanChangeRole =
    openMember && isOwner && openMember.role !== 'owner';

  return (
    <section className="settings-card">
      <header className="settings-card__head">
        <span className="settings-card__icon">
          <Building2 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="settings-card__title">Workspace</h2>
          <p className="settings-card__lede">
            Who's building with you — and what they can do.
          </p>
        </div>
      </header>

      <div className="settings-rows">
        {/* ── Members ── */}
        <div className="ws-members">
          <span className="ws-section-label">
            Members ({memberList.length})
          </span>
          <ul className="ws-member-list">
            {memberList.map((m) => {
              const Icon = ROLE_ICON[m.role];
              const isMe = m.userId === meId;
              const canRemoveRow = canManage && !isMe && m.role !== 'owner';
              const canChangeRoleRow = isOwner && m.role !== 'owner';
              const menuOpen = openMenu?.memberId === m.id;

              return (
                <li key={m.id} className="ws-member-row">
                  <span className="ws-member-row__avatar">
                    {(m.name ?? m.email).slice(0, 1).toUpperCase()}
                  </span>
                  <div className="ws-member-row__body">
                    <span className="ws-member-row__name">
                      {m.name ?? m.email}
                      {isMe && <span className="ws-member-row__you">· you</span>}
                    </span>
                    <span className="ws-member-row__email">{m.email}</span>
                  </div>
                  <span className={cn('ws-role-pill', `is-${m.role}`)}>
                    <Icon className="h-3 w-3" />
                    {ROLE_LABEL[m.role]}
                  </span>
                  {(canRemoveRow || canChangeRoleRow) && (
                    <div className="ws-member-row__menu">
                      <button
                        type="button"
                        className={cn(
                          'ws-member-row__menu-btn',
                          menuOpen && 'is-open',
                        )}
                        onClick={(e) => {
                          if (menuOpen) {
                            setOpenMenu(null);
                          } else {
                            setOpenMenu({
                              memberId: m.id,
                              anchor: e.currentTarget,
                            });
                          }
                        }}
                        aria-label="Member actions"
                        aria-expanded={menuOpen}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* ── Pending invites ── */}
        {inviteList.length > 0 && (
          <div className="ws-members">
            <span className="ws-section-label">
              Pending invites ({inviteList.length})
            </span>
            <ul className="ws-member-list">
              {inviteList.map((inv) => (
                <li
                  key={inv.id}
                  className="ws-member-row ws-member-row--invite"
                >
                  <span className="ws-member-row__avatar is-invite">
                    {inv.email.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="ws-member-row__body">
                    <span className="ws-member-row__name">{inv.email}</span>
                    <span className="ws-member-row__email">
                      Invited · {ROLE_LABEL[inv.role]}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ws-invite-copy"
                    onClick={() => copyLink(inv.inviteUrl, inv.id)}
                  >
                    {justCopied === inv.id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy link
                      </>
                    )}
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      className="ws-member-row__menu-btn"
                      onClick={() => {
                        if (!workspaceId) return;
                        revoke.mutate({ inviteId: inv.id, workspaceId });
                      }}
                      aria-label="Revoke invite"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Invite row ── */}
        {canManage && tierConfig.canInvite && (
          <div className="ws-invite-form">
            <span className="ws-section-label">Invite a teammate</span>
            <div className="ws-invite-form__row">
              <Input
                type="email"
                placeholder="teammate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleInvite();
                  }
                }}
                className="settings-input"
              />
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as 'admin' | 'member' | 'viewer')
                }
                className="ws-invite-form__role"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                size="sm"
                onClick={handleInvite}
                disabled={!email.trim() || invite.isPending}
                className="gap-1.5"
              >
                {invite.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Invite
              </Button>
            </div>
            <p className="ws-invite-form__hint">
              We'll email the invite automatically. If the email is already
              registered, copy the link from the pending list below.
            </p>
            {sentNotice && (
              <p className="ws-invite-form__notice">
                <Check className="h-3 w-3" />
                {sentNotice}
              </p>
            )}
            {error && (
              <p className="ws-invite-form__error">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>
        )}

        {/* Founder can't invite — show the upgrade path. */}
        {canManage && !tierConfig.canInvite && (
          <div className="ws-invite-form">
            <span className="ws-section-label">Invite a teammate</span>
            <p className="ws-invite-form__hint">
              Team access is $149/mo — unlock invites, roles, and shared
              work across your whole team.
            </p>
            <Button
              size="sm"
              onClick={() => setInviteGateOpen(true)}
              className="gap-1.5 mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Upgrade to invite
            </Button>
          </div>
        )}
      </div>

      {/* ── Portaled member menu ── */}
      {openMenu && openMember && (
        <PortalMenu
          anchor={openMenu.anchor}
          open
          onClose={() => setOpenMenu(null)}
          estimatedWidth={200}
        >
          {openMemberCanChangeRole && (
            <>
              {(['admin', 'member', 'viewer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className="ws-member-menu__item"
                  onClick={() => {
                    if (!workspaceId) return;
                    setMemberRole.mutate({
                      membershipId: openMember.id,
                      role: r,
                      workspaceId,
                    });
                    setOpenMenu(null);
                  }}
                >
                  Make {ROLE_LABEL[r]}
                </button>
              ))}
              {openMemberCanRemove && <div className="ws-member-menu__divider" />}
            </>
          )}
          {openMemberCanRemove && (
            <button
              type="button"
              className="ws-member-menu__item is-danger"
              onClick={() => {
                if (!workspaceId) return;
                remove.mutate({
                  membershipId: openMember.id,
                  workspaceId,
                });
                setOpenMenu(null);
              }}
            >
              Remove from workspace
            </button>
          )}
        </PortalMenu>
      )}
      <TeamInviteGate
        open={inviteGateOpen}
        onClose={() => setInviteGateOpen(false)}
      />

    </section>
  );
}
