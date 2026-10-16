import { useState } from 'react';
import {
  Sparkles,
  Share2,
  Download,
  Send,
  Calendar,
  ArrowUpRight,
  Users,
  Github,
  Rocket,
  Database,
  Play,
  Mail,
  Plus,
  Phone,
  Pause,
  XCircle,
  Check,
  Search,
  MessageCircle,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils/cn';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import {
  useLatestDeliverable,
  useDeliverablesStore,
} from '@/lib/deliverables';
import { useOpenDeliverable } from './useOpenDeliverable';
import { runAction } from './runAction';
import { DeliverableCardMenu } from './DeliverableCardMenu';
import { VersionsModal } from './VersionsModal';
import type { ActionDef } from './page-actions';
import { getOpsPreview } from '@/lib/opsPreviewResolver';
import './ops-card-electric.css';
const ICONS: Record<string, any> = {
  share: Share2, download: Download, send: Send, calendar: Calendar,
  sparkles: Sparkles, 'arrow-up-right': ArrowUpRight, users: Users,
  github: Github, rocket: Rocket, database: Database, play: Play,
  mail: Mail, plus: Plus, phone: Phone, pause: Pause,
  'x-circle': XCircle, check: Check, search: Search,
  'message-circle': MessageCircle, 'file-text': FileText,
};
interface OpsCardProps {
  def: ActionDef;
  pageId: string;
  ventureId?: string;
  pageBlocked?: boolean;
}
export function OpsCard({
  def,
  pageId,
  ventureId,
  /* Kept for API compatibility with OpsGrid. The card no longer
     gates on page-level state — that's the banner's job. */
  pageBlocked: _pageBlocked = false,
}: OpsCardProps) {
  const { ventureId: routeVentureId } = useParams<{ ventureId: string }>();
  const deliverable = useLatestDeliverable(pageId, def.id);
  const Icon = def.icon ? ICONS[def.icon] : null;
  const preview = getOpsPreview(def);
  const openDeliverable = useOpenDeliverable();
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const dismissFailedRun = useAgentDrawerStore((s) => s.dismissFailedRun);
  const runs = useAgentDrawerStore((s) => s.runs);
  const allDeliverables = useDeliverablesStore((s) => s.deliverables);
  const [menuOpen, setMenuOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  /* Live run for this op on this page, scoped to the venture.
     Excludes:
       · runs from other ventures
       · closed runs (validated / failed / manually dismissed)
       · runs already in a terminal state */
  const activeRun = Object.values(runs).find(
    (r) =>
      (r as any).opId === def.id &&
      r.page === pageId &&
      !r.closedAt &&
      (!ventureId || r.ventureId === ventureId) &&
      (r.status === 'working' ||
        r.status === 'needs_you' ||
        r.status === 'review_ready')
  );
  /* Most recent run for this op on this page, regardless of
     closedAt. Used to detect a fresh failure. */
  const mostRecentRun = Object.values(runs)
    .filter(
      (r) =>
        (r as any).opId === def.id &&
        r.page === pageId &&
        (!ventureId || r.ventureId === ventureId)
    )
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
  /* A failure surfaces on the card only when:
       · no active run is in flight
       · no validated deliverable exists for this op
       · the most recent run closed with closedReason = 'failed' */
  const hasFreshFailure =
    !activeRun &&
    (!deliverable || deliverable.status !== 'validated') &&
    mostRecentRun?.closedReason === 'failed';
  /* Cross-op dependency check */
  const dependencies = (def.requiresOps ?? []).map((opId) => {
    const depPage = opId.split('.')[0] || pageId;
    return { opId, pageId: depPage };
  });
  const blockedBy = dependencies.filter((dep) => {
    const latest = Object.values(allDeliverables)
      .filter((d) => d.pageId === dep.pageId && d.opId === dep.opId)
      .sort((a, b) => b.version - a.version)[0];
    return !latest || latest.status !== 'validated';
  });
  /* Individual op state — gated only by this op's own
     requiresOps, never by the page-level banner. The banner
     communicates page status; the card communicates op status. */
  /* Precedence:
       1. Active run (working / needs_you / review_ready)
          — a re-run over an existing deliverable must still show
            the run state, not "complete".
       2. Validated deliverable → complete
       3. Blocked by missing dependencies
       4. Available */
  const state:
    | 'available'
    | 'running'
    | 'needs_input'
    | 'ready'
    | 'complete'
    | 'blocked'
    | 'failed' =
    activeRun?.status === 'needs_you'
      ? 'needs_input'
      : activeRun?.status === 'working'
      ? 'running'
      : activeRun?.status === 'review_ready'
      ? 'ready'
      : deliverable && deliverable.status === 'validated'
      ? 'complete'
      : hasFreshFailure
      ? 'failed'
      : blockedBy.length > 0
      ? 'blocked'
      : 'available';
  const handleRun = () => {
    runAction(def, { ventureId, pageId });
  };
  const handleViewRun = () => {
    if (activeRun) openDrawer(activeRun.id);
  };
  const handleOpenDeliverable = () => {
    if (!deliverable) return;
    openDeliverable(deliverable);
  };
  const handleRerun = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRun();
  };
  const openRunReadOnly = useAgentDrawerStore((s) => s.openRunReadOnly);
  const handleDismissFailed = () => {
    if (mostRecentRun?.id) {
      dismissFailedRun(mostRecentRun.id);
    }
  };
  const handleSeeThreads = () => {
    /* Prefer the deliverable's runId (the run that produced it).
       Fall back to the current active run if there is one. Opens
       in read-only mode — no composer, no action buttons. */
    const target = deliverable?.runId ?? activeRun?.id;
    if (target) openRunReadOnly(target);
  };
  /* Count versions of this op on this page. Used for the
     "Versions (N)" label. */
  const versionCount = Object.values(allDeliverables).filter(
    (d) =>
      d.pageId === pageId &&
      d.opId === def.id &&
      (!ventureId || d.ventureId === ventureId)
  ).length;
  const showMenu = state === 'complete' && Boolean(deliverable);
  return (
    <article className={cn('ops-card', 'ops-card--electric', `ops-card--${state}`)} data-output-type={preview.type}>
      <div className="ops-card__cover">
        {def.produces && (
          <span className="ops-card__produces" aria-hidden="true">
            {def.produces}
          </span>
        )}
        <img src={preview.src} alt={preview.alt} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.style.opacity = '0'; }} />
        <span className="ops-card__cover-type">{preview.label}</span>
        {state === 'running' && <span className="ops-card__cover-running" aria-label="Operation running"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Running</span>}
      </div>
      <div className="ops-card__content">
      <header className="ops-card__head">
        <span className="ops-card__icon">
          {Icon ? <Icon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        </span>
        <h3 className="ops-card__verb">{def.verb}</h3>
        {showMenu && deliverable && (
          <div className="ops-card__head-actions">
            <button
              type="button"
              className="ops-card__update-chip"
              onClick={handleRerun}
              title="Produce a new version"
            >
              <Sparkles className="h-3 w-3" />
              Update
            </button>
            <button
              type="button"
              className={cn(
                'ops-card__menu-btn',
                menuOpen && 'is-open'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              aria-label="More actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <DeliverableCardMenu
                deliverable={deliverable}
                versionCount={versionCount}
                onOpenVersions={() => {
                  setMenuOpen(false);
                  setVersionsOpen(true);
                }}
                onClose={() => setMenuOpen(false)}
                onSeeThreads={handleSeeThreads}
              />
            )}
          </div>
        )}
      </header>
      {def.description && (
        <p className="ops-card__description">{def.description}</p>
      )}
      {(def.produces || def.requiresLabels?.length || def.softDependency) && (
        <div className="ops-card__meta">
          {def.produces && (
            <div className="ops-card__meta-row">
              <span className="ops-card__meta-label">Produces</span>
              <span className="ops-card__meta-value">{def.produces}</span>
            </div>
          )}
          {def.requiresLabels && def.requiresLabels.length > 0 && (
            <div className="ops-card__meta-row">
              <span className="ops-card__meta-label">Requires</span>
              <span className="ops-card__meta-chips">
                {def.requiresLabels.map((r) => (
                  <span key={r} className="ops-card__chip">
                    {r}
                  </span>
                ))}
              </span>
            </div>
          )}
          {def.softDependency && (
            <div className="ops-card__meta-soft">
              ⓘ {def.softDependency}
            </div>
          )}
        </div>
      )}
      <footer className="ops-card__footer">
        {state === 'blocked' && blockedBy.length > 0 && (
          <div className="ops-card__blocked">
            <span className="ops-card__blocked-label">Requires</span>
            {blockedBy.map((dep, i) => {
              const rawLabel = def.requiresLabels?.[i] ?? dep.opId;
              /* Dedup — the same label can appear twice when an op
                 has multiple requiresOps pointing at the same page. */
              const label = rawLabel;
              const earlierDupes = blockedBy
                .slice(0, i)
                .filter((_, j) => (def.requiresLabels?.[j] ?? blockedBy[j].opId) === rawLabel);
              if (earlierDupes.length > 0) return null;
              return (
                <Link
                  key={dep.opId}
                  to={`/ventures/${routeVentureId ?? ventureId}/${dep.pageId}`}
                  className="ops-card__blocked-link"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}
        {state === 'available' && (
          <button
            type="button"
            className="ops-card__btn is-primary"
            onClick={handleRun}
          >
            {def.primary ? <Sparkles className="h-3 w-3" /> : null}
            Run
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {state === 'running' && (
          <button
            type="button"
            className="ops-card__btn is-working"
            onClick={handleViewRun}
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            Working
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {state === 'needs_input' && (
          <button
            type="button"
            className="ops-card__btn is-attention"
            onClick={handleViewRun}
          >
            <AlertCircle className="h-3 w-3" />
            Needs input
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {state === 'ready' && (
          <button
            type="button"
            className="ops-card__btn is-ready"
            onClick={handleViewRun}
          >
            <CheckCircle2 className="h-3 w-3" />
            Review
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {state === 'complete' && deliverable && (
          <button
            type="button"
            className="ops-card__btn is-complete"
            onClick={handleOpenDeliverable}
          >
            <CheckCircle2 className="h-3 w-3" />
            Open v{deliverable.version}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
        {state === 'failed' && (
          <div className="ops-card__failed-actions">
            <span className="ops-card__failed-note">
              <AlertCircle className="h-3 w-3" />
              Failed {relativeTime(mostRecentRun?.closedAt ?? mostRecentRun?.completedAt ?? '')}
            </span>
            <div className="ops-card__failed-buttons">
              <button
                type="button"
                className="ops-card__btn is-discard"
                onClick={handleDismissFailed}
                title="Clear this failure — no output was saved"
              >
                <XCircle className="h-3 w-3" />
                Discard
              </button>
              <button
                type="button"
                className="ops-card__btn is-retry"
                onClick={handleRun}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          </div>
        )}
      </footer>
      </div>
      {versionsOpen && (
        <VersionsModal
          open={versionsOpen}
          onClose={() => setVersionsOpen(false)}
          opId={def.id}
          pageId={pageId}
          ventureId={ventureId}
          opVerb={def.verb}
          destination={def.destination}
        />
      )}
    </article>
  );
}
/** Short relative time — "2m", "1h", "3d". */
function relativeTime(iso: string): string {
  if (!iso) return 'just now';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
