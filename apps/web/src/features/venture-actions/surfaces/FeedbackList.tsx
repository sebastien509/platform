import { useMemo } from 'react';
import { MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useVentureComments, useShareStore } from '@/lib/share';
import type { SurfaceId } from '@/lib/share';

const SURFACE_LABELS: Record<SurfaceId, string> = {
  'strategy.brief': 'Strategy brief',
  'product.prototype': 'Prototype',
  'engineering.docs': 'Technical docs',
  'gtm.plan': '90-day plan',
  'gtm.landing': 'GTM landing',
  'campaigns.landing': 'Campaign landing',
  'sales.proposal': 'Proposal',
};

interface FeedbackListProps {
  ventureId: string;
  /** Optional filter to a specific surface. */
  surfaceFilter?: SurfaceId;
  className?: string;
}

/**
 * FeedbackList — the founder's inbox for viewer comments.
 * Aggregates every comment across every share link. Each comment
 * shows which surface it belongs to, who wrote it, and whether
 * the founder has read it.
 */
export function FeedbackList({
  ventureId,
  surfaceFilter,
  className,
}: FeedbackListProps) {
  const all = useVentureComments(ventureId);
  const markRead = useShareStore((s) => s.markCommentRead);

  const comments = useMemo(
    () =>
      surfaceFilter
        ? all.filter((c) => c.link.surfaceId === surfaceFilter)
        : all,
    [all, surfaceFilter]
  );

  if (comments.length === 0) {
    return (
      <div className={cn('feedback-list feedback-list--empty', className)}>
        <span className="feedback-list__empty-icon">
          <MessageSquare className="h-5 w-5" />
        </span>
        <h3 className="feedback-list__empty-title">No comments yet</h3>
        <p className="feedback-list__empty-body">
          Share a surface — a brief, prototype, plan, or proposal — and comments
          from viewers will land here.
        </p>
      </div>
    );
  }

  const unread = comments.filter((c) => !c.readAt).length;

  return (
    <div className={cn('feedback-list', className)}>
      <header className="feedback-list__head">
        <span className="feedback-list__label">
          {surfaceFilter ? SURFACE_LABELS[surfaceFilter] : 'All feedback'}
        </span>
        <div className="feedback-list__meta">
          {unread > 0 && (
            <span className="feedback-list__unread">{unread} new</span>
          )}
          <span className="feedback-list__count">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </header>

      <ul className="feedback-list__items">
        {comments.map((c) => (
          <li
            key={c.id}
            className={cn(
              'feedback-item',
              !c.readAt && 'feedback-item--unread'
            )}
          >
            <div className="feedback-item__rail">
              <span className="feedback-item__dot" />
              {!c.readAt && <span className="feedback-item__new-badge">New</span>}
            </div>

            <div className="feedback-item__content">
              <header className="feedback-item__head">
                <div className="feedback-item__meta">
                  <span className="feedback-item__author">{c.author}</span>
                  <span className="feedback-item__sep">·</span>
                  <span className="feedback-item__surface">
                    {SURFACE_LABELS[c.link.surfaceId]}
                  </span>
                  {c.sectionLabel && (
                    <>
                      <span className="feedback-item__sep">·</span>
                      <span className="feedback-item__section">
                        {c.sectionLabel}
                      </span>
                    </>
                  )}
                </div>
                <time className="feedback-item__when">
                  {new Date(c.createdAt).toLocaleDateString()}
                </time>
              </header>

              <p className="feedback-item__body">{c.body}</p>

              {!c.readAt && (
                <button
                  type="button"
                  className="feedback-item__read-btn"
                  onClick={() => markRead(c.id, c.link.id)}
                >
                  <Check className="h-3 w-3" />
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
