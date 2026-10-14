import { cn } from '@/lib/utils/cn';
import type { VentureSection } from './engine/types';

export function DataTable({
  section,
}: {
  section: Extract<VentureSection, { type: 'data-table' }>;
}) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {section.columns.map((col) => (
              <th
                key={col.key}
                className={cn(col.align === 'right' && 'is-right')}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, i) => (
            <tr key={row.id ?? i}>
              {section.columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(col.align === 'right' && 'is-right')}
                >
                  {row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
