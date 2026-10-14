import { Circle, CircleDot, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CollectionItem } from '../types';

interface ChecklistViewProps {
  items: CollectionItem[];
}

const ICON = {
  todo: Circle,
  doing: CircleDot,
  done: CheckCircle2,
  blocked: AlertCircle,
};

export function ChecklistView({ items }: ChecklistViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">No items yet.</div>;
  }

  return (
    <ul className="collection-checklist">
      {items.map((item) => {
        const status = item.checklistStatus ?? 'todo';
        const Icon = ICON[status];
        return (
          <li
            key={item.id}
            className={cn('collection-checklist__item', `is-${status}`)}
          >
            <Icon className="collection-checklist__icon" />
            <div className="collection-checklist__content">
              <span className="collection-checklist__title">{item.title}</span>
              {item.body && (
                <span className="collection-checklist__body">{item.body}</span>
              )}
            </div>
            {item.owner && (
              <span className="collection-checklist__owner">{item.owner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
