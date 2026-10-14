import { cn } from '@/lib/utils/cn';
import { StatusBadge } from '../../objects';
import { CardActions } from '@/features/venture-actions';
import type { CollectionItem } from '../types';

interface TimelineViewProps {
  items: CollectionItem[];
}

export function TimelineView({ items }: TimelineViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">Nothing on the timeline yet.</div>;
  }

  return (
    <ol className="collection-timeline">
      {items.map((item, i) => (
        <li
          key={item.id}
          className={cn(
            'collection-timeline__item',
            item.featured && 'is-featured'
          )}
        >
          <div className="collection-timeline__rail">
            <span className="collection-timeline__dot" />
            {i < items.length - 1 && (
              <span className="collection-timeline__line" />
            )}
          </div>
          <div className="collection-timeline__content">
            <div className="collection-timeline__head">
              {item.when && (
                <span className="collection-timeline__when">{item.when}</span>
              )}
              {item.status && (
                <StatusBadge tone={item.statusTone ?? 'neutral'}>
                  {item.status}
                </StatusBadge>
              )}
            </div>
            <span className="collection-timeline__title">{item.title}</span>
            {item.body && (
              <span className="collection-timeline__body">{item.body}</span>
            )}
            {item.actions && item.actions.length > 0 && (
              <div className="collection-timeline__actions">
                <CardActions actionIds={item.actions} />
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
