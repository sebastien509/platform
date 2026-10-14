import {
  Check,
  AlertCircle,
  PenLine,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CollectionItem } from '../types';

interface CardsViewProps {
  items: CollectionItem[];
}

const STATUS_ICONS: Record<string, typeof Check> = {
  approved: Check,
  validated: CheckCircle2,
  draft: PenLine,
  needs_revision: AlertCircle,
};

export function CardsView({ items }: CardsViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">No entries yet.</div>;
  }

  return (
    <div className="collection-cards">
      {items.map((item) => {
        const statusKey = (item.status ?? '').toLowerCase();
        const StatusIcon = STATUS_ICONS[statusKey];

        const clickable = Boolean(item.onClick);
        return (
          <article
            key={item.id}
            className={cn(
              'collection-card',
              clickable && 'is-clickable'
            )}
            onClick={item.onClick}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
          >
            <header className="collection-card__head">
              {item.icon && (
                <span className="collection-card__icon">{item.icon}</span>
              )}
              {item.meta && (
                <span className="collection-card__kind">{item.meta}</span>
              )}
            </header>

            <h3 className="collection-card__title">{item.title}</h3>

            {item.body && (
              <p className="collection-card__body">{item.body}</p>
            )}

            <footer className="collection-card__footer">
              {item.status ? (
                <>
                  <span
                    className={cn(
                      'collection-card__status',
                      `is-${item.statusTone ?? 'neutral'}`
                    )}
                  >
                    {StatusIcon && <StatusIcon className="h-3 w-3" />}
                    {item.status}
                  </span>
                </>
              ) : (
                <span />
              )}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
