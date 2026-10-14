import { type ReactNode } from 'react';
import { Share2, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SurfaceFrameProps {
  /** Small caps eyebrow */
  eyebrow?: string;
  title: string;
  kicker?: string;
  /** Right-side meta — date, author, version */
  meta?: ReactNode;
  /** Actions row — copy link, download, etc. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * SurfaceFrame — the shell every shared surface renders inside.
 * Gives consistency across Brief, Prototype, Docs, Plan, Landing,
 * Proposal. The content varies; the frame doesn't.
 */
export function SurfaceFrame({
  eyebrow,
  title,
  kicker,
  meta,
  actions,
  className,
  children,
}: SurfaceFrameProps) {
  return (
    <div className={cn('surface-frame', className)}>
      <header className="surface-frame__header">
        <div className="surface-frame__heading">
          {eyebrow && <span className="surface-frame__eyebrow">{eyebrow}</span>}
          <h1 className="surface-frame__title">{title}</h1>
          {kicker && <p className="surface-frame__kicker">{kicker}</p>}
        </div>
        {actions && <div className="surface-frame__actions">{actions}</div>}
      </header>

      <div className="surface-frame__body">{children}</div>

      <footer className="surface-frame__footer">
        <div className="surface-frame__brand">
          <span className="surface-frame__brand-mark">
            <Share2 className="h-3 w-3" />
          </span>
          <span>Shared from IV</span>
        </div>
        {meta && <div className="surface-frame__meta">{meta}</div>}
      </footer>
    </div>
  );
}

/** A compact "copy link" button used inside surface headers. */
export function CopyLinkButton({
  onClick,
  copied,
}: {
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface-frame__copy-btn"
    >
      <Link2 className="h-3.5 w-3.5" />
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}
