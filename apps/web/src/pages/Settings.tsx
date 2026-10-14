import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  Plug,
  Bell,
  CreditCard,
  Check,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { PageContainer } from '@/components/primary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DevResetDeliverables } from '@/features/venture-actions/DevResetDeliverables';
import {
  useCurrentUser,
  useUpdateProfile,
  useUpdateSettings,
} from '@/features/auth/useCurrentUser';
import { useWorkspace } from '@/features/settings/useWorkspace';
import { WorkspaceCard } from '@/features/settings/WorkspaceCard';

const ROLES = ['technical', 'business', 'design', 'other'] as const;
type Role = (typeof ROLES)[number];

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  founder: 'Founder Premium',
  team: 'Team',
};

const PLAN_PRICES: Record<string, number | null> = {
  starter: null,
  pro: 29,
  founder: 59,
  team: 149,
};

const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  pro: 5,
  founder: 15,
  team: 50,
};


export default function SettingsPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: ws, isLoading: wsLoading } = useWorkspace();
  const updateProfile = useUpdateProfile();
  const updateSettings = useUpdateSettings();
  const navigate = useNavigate();

  // Local form state for text inputs — synced from server, saved on blur.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [spendThreshold, setSpendThreshold] = useState('100');

  useEffect(() => {
    if (me?.profile) {
      setName(me.profile.name ?? '');
      setPhone(me.profile.phone ?? '');
      setRole((me.profile.profile_role as Role) ?? '');
    }
    if (me?.settings) {
      setSpendThreshold(String(me.settings.spend_threshold_usd ?? 100));
    }
  }, [me]);

  if (meLoading || wsLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
        </div>
      </PageContainer>
    );
  }

  const email = me?.profile?.email ?? '';
  const settings = me?.settings;
  const savedName = me?.profile?.name ?? null;

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed === (savedName ?? '')) return;
    updateProfile.mutate({ name: trimmed || null });
  };

  const savePhone = () => {
    const trimmed = phone.trim();
    if (trimmed === (me?.profile?.phone ?? '')) return;
    updateProfile.mutate({ phone: trimmed || null });
  };

  const saveThreshold = () => {
    const n = parseInt(spendThreshold, 10);
    if (Number.isNaN(n) || n < 0) {
      setSpendThreshold(String(settings?.spend_threshold_usd ?? 100));
      return;
    }
    if (n === settings?.spend_threshold_usd) return;
    updateSettings.mutate({ spend_threshold_usd: n });
  };

  return (
    <PageContainer>
      <header className="marketplace-hero">
        <h1 className="marketplace-hero__title">Settings</h1>
        <p className="marketplace-hero__lede">
          Your account, your workspace, and how IV runs on your behalf.
        </p>
      </header>

      <div className="settings-layout" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ─── Personal ─── */}
        <section className="settings-card">
          <header className="settings-card__head">
            <span className="settings-card__icon">
              <UserIcon className="h-4 w-4" />
            </span>
            <div>
              <h2 className="settings-card__title">Personal</h2>
              <p className="settings-card__lede">How you appear across IV.</p>
            </div>
          </header>

          <div className="settings-rows">
            <div className="settings-row settings-row--field">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                className="settings-input"
              />
            </div>
            <div className="settings-row settings-row--field">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                value={email}
                readOnly
                disabled
                className="settings-input"
              />
              <span className="settings-row__hint">
                Managed by your sign-in method.
              </span>
            </div>
            <div className="settings-row settings-row--field">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={savePhone}
                placeholder="Optional"
                className="settings-input"
              />
            </div>
            <div className="settings-row settings-row--field">
              <Label htmlFor="profile-role">Role</Label>
              <select
                id="profile-role"
                value={role}
                onChange={(e) => {
                  const v = e.target.value as Role | '';
                  setRole(v);
                  if (v) updateProfile.mutate({ profile_role: v });
                }}
                className="settings-input"
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--surface-1)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13.5,
                }}
              >
                <option value="">Not set</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
              <span className="settings-row__hint">
                Tailors how agents talk to you. Doesn't lock you in.
              </span>
            </div>
          </div>
        </section>

        {/* ─── Plan & Billing ─── */}
        <section className="settings-card">
          <header className="settings-card__head">
            <span className="settings-card__icon">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <h2 className="settings-card__title">Plan & Billing</h2>
              <p className="settings-card__lede">
                Your subscription, payment method, and invoice history.
              </p>
            </div>
          </header>

          <div className="settings-rows">
            <div className="settings-billing-summary">
              <div className="settings-billing-summary__main">
                <span className="settings-billing-summary__plan">
                  {PLAN_LABELS[ws?.plan_tier ?? 'starter'] ?? 'Starter'}
                </span>
                <span className="settings-billing-summary__meta">
                  {ws?.plan_tier && PLAN_PRICES[ws.plan_tier] != null
                    ? `$${PLAN_PRICES[ws.plan_tier]} / month · ${
                        PLAN_LIMITS[ws.plan_tier] ?? 1
                      } ventures`
                    : 'Free plan · 1 venture'}
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/billing')}
                className="gap-1.5"
              >
                Manage billing
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Workspace ─── */}
        <WorkspaceCard />

        {/* ─── Approvals ─── */}
        <section className="settings-card">
          <header className="settings-card__head">
            <span className="settings-card__icon">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <h2 className="settings-card__title">Approvals</h2>
              <p className="settings-card__lede">
                When should IV ask before acting?
              </p>
            </div>
          </header>

          <div className="settings-rows">
            <div className="settings-row settings-row--field">
              <Label htmlFor="spend-threshold">Spend threshold ($)</Label>
              <Input
                id="spend-threshold"
                type="number"
                value={spendThreshold}
                onChange={(e) => setSpendThreshold(e.target.value)}
                onBlur={saveThreshold}
                className="settings-input settings-input--short"
              />
              <span className="settings-row__hint">
                Approval required for any spend above this amount.
              </span>
            </div>

            <div className="settings-row">
              <div>
                <span className="settings-row__label">
                  Auto-continue phase transitions
                </span>
                <span className="settings-row__hint">
                  Allow ideas to move to the next phase without checkpoint
                  approval.
                </span>
              </div>
              <Switch
                checked={settings?.auto_continue_phases ?? false}
                onCheckedChange={(v) =>
                  updateSettings.mutate({ auto_continue_phases: v })
                }
              />
            </div>
          </div>
        </section>

        {/* ─── Notifications ─── */}
        <section className="settings-card">
          <header className="settings-card__head">
            <span className="settings-card__icon">
              <Bell className="h-4 w-4" />
            </span>
            <div>
              <h2 className="settings-card__title">Notifications</h2>
              <p className="settings-card__lede">
                Where and when IV pings you.
              </p>
            </div>
          </header>

          <div className="settings-rows">
            <div className="settings-row">
              <div>
                <span className="settings-row__label">Email</span>
                <span className="settings-row__hint">
                  Deals, decisions, and needs-you alerts.
                </span>
              </div>
              <Switch
                checked={settings?.notify_email ?? true}
                onCheckedChange={(v) =>
                  updateSettings.mutate({ notify_email: v })
                }
              />
            </div>

            <div className="settings-row">
              <div>
                <span className="settings-row__label">Slack</span>
                <span className="settings-row__hint">
                  Requires a connected Slack workspace.
                </span>
              </div>
              <Switch
                checked={settings?.notify_slack ?? false}
                onCheckedChange={(v) =>
                  updateSettings.mutate({ notify_slack: v })
                }
              />
            </div>

            <div className="settings-row">
              <div>
                <span className="settings-row__label">Weekly digest</span>
                <span className="settings-row__hint">
                  A summary of outcomes and next actions, every Monday.
                </span>
              </div>
              <Switch
                checked={settings?.weekly_digest ?? true}
                onCheckedChange={(v) =>
                  updateSettings.mutate({ weekly_digest: v })
                }
              />
            </div>
          </div>
        </section>

        {/* ─── Connectors shortcut ─── */}
        <section className="settings-card">
          <header className="settings-card__head">
            <span className="settings-card__icon">
              <Plug className="h-4 w-4" />
            </span>
            <div>
              <h2 className="settings-card__title">Connectors</h2>
              <p className="settings-card__lede">
                Manage the tools IV can use to execute ops.
              </p>
            </div>
          </header>
          <div className="settings-rows">
            <div className="settings-row">
              <div>
                <span className="settings-row__label">
                  Open the Connectors page
                </span>
                <span className="settings-row__hint">
                  Connect GitHub, Vercel, Gmail, and more.
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/ventures/ven_001/connectors')}
              >
                Open
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Developer ─── */}
        {import.meta.env.DEV && (
          <section className="settings-card settings-card--dev">
            <header className="settings-card__head">
              <span className="settings-card__icon">
                <Check className="h-4 w-4" />
              </span>
              <div>
                <h2 className="settings-card__title">Developer</h2>
                <p className="settings-card__lede">
                  Local-only tools for testing.
                </p>
              </div>
            </header>
            <div className="settings-rows">
              <DevResetDeliverables />
              <div className="settings-row">
                <div>
                  <span className="settings-row__label">
                    Supabase connection
                  </span>
                  <span className="settings-row__hint settings-row__hint--mono">
                    {import.meta.env.VITE_SUPABASE_URL?.replace(
                      'https://',
                      ''
                    ) ?? 'not configured'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageContainer>
  );
}
