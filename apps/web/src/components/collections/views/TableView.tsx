import { StatusBadge } from '../../objects';
import type { CollectionItem, CollectionTableColumn } from '../types';

interface TableViewProps {
  items: CollectionItem[];
  columns: CollectionTableColumn[];
}

export function TableView({ items, columns }: TableViewProps) {
  if (items.length === 0) {
    return <div className="collection-empty">No rows yet.</div>;
  }

  return (
    <div className="collection-table-wrap">
      <table className="collection-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {columns.map((col, idx) => (
                <td key={col.key}>
                  {idx === 0 ? (
                    <span className="collection-table__title">{item.title}</span>
                  ) : col.key === 'status' && item.status ? (
                    <StatusBadge tone={item.statusTone ?? 'neutral'}>
                      {item.status}
                    </StatusBadge>
                  ) : col.key === 'meta' && item.meta ? (
                    <span className="collection-table__meta">{item.meta}</span>
                  ) : (
                    item.cells?.[col.key] ?? null
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
