import { cn } from '@/lib/utils/cn';
import type { ResearchSection } from '@/lib/types';

export function MetricsSection({ section }: { section: ResearchSection }) {
  const metrics = section.metrics ?? [];
  if (metrics.length === 0) return null;

  return (
    <div className="rv-section rv-section--metrics">
      {metrics.map((m, i) => {
        /* Length-aware sizing — numbers display, sentences read at
         * body scale. */
        const len = String(m.value ?? '').length;
        const sizeClass =
          len <= 8 ? 'is-short' : len <= 20 ? 'is-medium' : 'is-long';
        return (
          <div key={i} className="rv-metric">
            <span className="rv-metric__label">{m.label}</span>
            <span className={cn('rv-metric__value', sizeClass)}>
              {m.value}
            </span>
            {m.note && <span className="rv-metric__note">{m.note}</span>}
          </div>
        );
      })}
    </div>
  );
}
