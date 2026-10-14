import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * PageHeader — title + optional description + optional actions.
 *
 * Eyebrow and page-state chip are intentionally not rendered.
 * Every extra label on the header adds visual weight without
 * telling the founder anything they don't already know from
 * the page they clicked. If a future page genuinely needs one,
 * pass showEyebrow / showState explicitly.
 */
export interface PageState {
  stage: string;
  detail?: string;
  pendingCount?: number;
  tone?: 'default' | 'attention' | 'ready';
}

interface PageHeaderProps {
  /** Accepted but not rendered unless showEyebrow is true. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Accepted but not rendered unless showState is true. */
  state?: PageState;
  /** Actions cluster, right-aligned. */
  actions?: ReactNode;
  /** Opt-in — off by default. */
  showEyebrow?: boolean;
  /** Opt-in — off by default. */
  showState?: boolean;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  state,
  actions,
  showEyebrow = false,
  showState = false,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('page-header', className)}>
      <div className="page-header__content">
        {showEyebrow && eyebrow && (
          <span className="page-header__eyebrow">{eyebrow}</span>
        )}
        <h1 className="page-header__title">{title}</h1>
        {description && (
          <p className="page-header__description">{description}</p>
        )}
      </div>

      {(showState && state || actions) && (
        <div className="page-header__aside">
          {showState && state && (
            <div
              className={cn(
                'page-header__state',
                state.tone && `is-${state.tone}`
              )}
              aria-label="Page state"
            >
              <span className="page-header__state-dot" />
              <span className="page-header__state-stage">{state.stage}</span>
              {state.detail && (
                <>
                  <span className="page-header__state-sep" aria-hidden>·</span>
                  <span className="page-header__state-detail">{state.detail}</span>
                </>
              )}
              {typeof state.pendingCount === 'number' && state.pendingCount > 0 && (
                <span className="page-header__state-badge">{state.pendingCount}</span>
              )}
            </div>
          )}
          {actions && <div className="page-header__actions">{actions}</div>}
        </div>
      )}
    </header>
  );
}
