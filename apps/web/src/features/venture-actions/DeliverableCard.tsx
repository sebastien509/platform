import { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MoreHorizontal,
  Sparkles,
} from 'lucide-react';
import { useOpenDeliverable } from './useOpenDeliverable';
import { getRenderTypeMeta } from './renderTypeLabel';
import { getActionDef } from './page-actions';
import { runAction } from './runAction';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { DeliverableCardMenu } from './DeliverableCardMenu';
import type { Deliverable } from '@/lib/deliverables';

interface DeliverableCardProps {
  deliverable: Deliverable;
  variant?: 'compact' | 'full';
  ventureId?: string;
}

/**
 * DeliverableCard — the permanent page object.
 *
 * Full variant:
 *   · 3-dot menu in the header (See threads / Download / Share / Comments)
 *   · Hover-revealed "Update" chip for producing a new version
 *   · Footer keeps Open + Re-run
 *
 * Compact variant: unchanged — a one-line entry in an ops list.
 */
export function DeliverableCard({
  deliverable,
  variant = 'compact',
  ventureId,
}: DeliverableCardProps) {
  const openDeliverable = useOpenDeliverable();
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const [menuOpen, setMenuOpen] = useState(false);

  const renderType =
    deliverable.renderType ??
    getActionDef(deliverable.opId)?.renderType ??
    'markdown';
  const renderTypeMeta = getRenderTypeMeta(renderType);

  const handleOpen = () => {
    void openDeliverable(deliverable);
  };

  const handleRerun = (e: React.MouseEvent) => {
    e.stopPropagation();
    const def = getActionDef(deliverable.opId);
    if (!def) return;
    runAction(def, { ventureId, pageId: deliverable.pageId });
  };

  const handleSeeThreads = () => {
    if (!deliverable.runId) return;
    openDrawer(deliverable.runId);
  };

  const validatedDate = deliverable.validatedAt
    ? new Date(deliverable.validatedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '';

  /* ---------- Compact variant (unchanged) ---------- */
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="deliverable-card deliverable-card--compact"
      >
        <span className="deliverable-card__check">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <span className="deliverable-card__type-badge">
          {renderTypeMeta.short}
        </span>
        <span className="deliverable-card__title">{deliverable.title}</span>
        <span className="deliverable-card__version">v{deliverable.version}</span>
        <span className="deliverable-card__date">{validatedDate}</span>
        <span className="deliverable-card__actions">
          <span className="deliverable-card__open">
            Open
            <ArrowRight className="h-3 w-3" />
          </span>
        </span>
      </button>
    );
  }

  /* ---------- Full variant ---------- */
  return (
    <article className="deliverable-card deliverable-card--full">
      <header className="deliverable-card__head">
        <div>
          <span className="deliverable-card__eyebrow">
            {deliverable.pageId}
          </span>
          <h3 className="deliverable-card__full-title">
            {deliverable.title}
          </h3>
        </div>

        <div className="deliverable-card__head-actions">
          {/* Hover-revealed update button — produces a new version */}
          <button
            type="button"
            className="deliverable-card__update-chip"
            onClick={handleRerun}
            title="Produce a new version"
          >
            <Sparkles className="h-3 w-3" />
            Update
          </button>

          {/* 3-dot menu — always available, subtle */}
          <button
            type="button"
            className="deliverable-card__menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <MoreHorizontal className="h-3.5 w-3.5" />
            ) : (
              <MoreHorizontal className="h-3.5 w-3.5" />
            )}
          </button>

          {menuOpen && (
            <DeliverableCardMenu
              deliverable={deliverable}
              onClose={() => setMenuOpen(false)}
              onSeeThreads={handleSeeThreads}
            />
          )}
        </div>
      </header>

      <div className="deliverable-card__meta">
        <span className="deliverable-card__badge">
          <CheckCircle2 className="h-3 w-3" />
          Validated
        </span>
        <span className="deliverable-card__type-badge">
          {renderTypeMeta.short}
        </span>
        <span>v{deliverable.version}</span>
        {validatedDate && (
          <>
            <span>·</span>
            <span>{validatedDate}</span>
          </>
        )}
        {deliverable.snapshot.sections.length > 0 && (
          <>
            <span>·</span>
            <span>{deliverable.snapshot.sections.length} sections</span>
          </>
        )}
      </div>

      <footer className="deliverable-card__footer">
        <button
          type="button"
          className="deliverable-card__btn is-primary"
          onClick={handleOpen}
        >
          Open
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="deliverable-card__btn"
          onClick={handleRerun}
        >
          <RefreshCw className="h-3 w-3" />
          Re-run
        </button>
      </footer>
    </article>
  );
}
