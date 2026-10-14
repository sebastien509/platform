import { cn } from '@/lib/utils/cn';
import { StatusBadge } from '../../objects';
import type { CollectionItem } from '../types';

interface ListViewProps {
  items: CollectionItem[];
}

export function ListView({ items }: ListViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">No items yet.</div>;
  }

  return (
    <ul className="collection collection--list">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            'collection-row',
            item.onClick && 'is-clickable'
          )}
          onClick={item.onClick}
          role={item.onClick ? 'button' : undefined}
          tabIndex={item.onClick ? 0 : undefined}
        >
          {item.icon && <span className="collection-row__icon">{item.icon}</span>}
          <div className="collection-row__main">
            <span className="collection-row__title">{item.title}</span>
            {item.body && (
              <span className="collection-row__body">{item.body}</span>
            )}
          </div>
          {item.meta && (
            <span className="collection-row__meta">{item.meta}</span>
          )}
          {item.status && (
            <StatusBadge tone={item.statusTone ?? 'neutral'}>
              {item.status}
            </StatusBadge>
          )}
        </li>
      ))}
    </ul>
  );
}
