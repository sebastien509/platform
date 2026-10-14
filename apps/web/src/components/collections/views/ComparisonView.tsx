import { cn } from '@/lib/utils/cn';
import { CardActions } from '@/features/venture-actions';
import type { CollectionItem } from '../types';

interface ComparisonViewProps {
  items: CollectionItem[];
}

export function ComparisonView({ items }: ComparisonViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">No variants to compare.</div>;
  }

  return (
    <div className="collection-comparison">
      {items.map((item) => (
        <article
          key={item.id}
          className={cn(
            'collection-comparison__variant',
            item.winning && 'is-winner'
          )}
        >
          <span className="collection-comparison__title">{item.title}</span>
          {item.body && (
            <span className="collection-comparison__body">{item.body}</span>
          )}
          {item.variantMetrics && item.variantMetrics.length > 0 && (
            <div className="collection-comparison__metrics">
              {item.variantMetrics.map((m) => (
                <div key={m.label} className="collection-comparison__metric">
                  <span className="collection-comparison__metric-label">
                    {m.label}
                  </span>
                  <span className="collection-comparison__metric-value">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {item.actions && item.actions.length > 0 && (
            <div className="collection-comparison__actions">
              <CardActions actionIds={item.actions} />
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
