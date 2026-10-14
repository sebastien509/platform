import { StatusBadge } from '../../objects';
import type { CollectionItem, CollectionColumn } from '../types';

interface KanbanViewProps {
  items: CollectionItem[];
  columns: CollectionColumn[];
}

export function KanbanView({ items, columns }: KanbanViewProps) {
  if (columns.length === 0) {
    return <div className="collection-empty">No columns defined.</div>;
  }

  return (
    <div className="collection-kanban">
      {columns.map((col) => {
        const colItems = items.filter((i) => i.columnId === col.id);
        return (
          <div key={col.id} className="collection-kanban__column">
            <header className="collection-kanban__head">
              <span className="collection-kanban__title">{col.title}</span>
              {col.meta && (
                <span className="collection-kanban__meta">{col.meta}</span>
              )}
            </header>
            <div className="collection-kanban__items">
              {colItems.map((item) => (
                <div key={item.id} className="collection-kanban__card">
                  {item.icon && (
                    <span className="collection-kanban__card-icon">{item.icon}</span>
                  )}
                  <span className="collection-kanban__card-title">
                    {item.title}
                  </span>
                  {item.body && (
                    <span className="collection-kanban__card-body">
                      {item.body}
                    </span>
                  )}
                  {(item.status || item.meta) && (
                    <div className="collection-kanban__card-footer">
                      {item.status ? (
                        <StatusBadge tone={item.statusTone ?? 'neutral'}>
                          {item.status}
                        </StatusBadge>
                      ) : (
                        <span className="collection-kanban__card-meta">
                          {item.meta}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {colItems.length === 0 && (
                <div className="collection-kanban__empty">Empty</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
