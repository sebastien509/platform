import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { VentureSection } from './engine/types';

export function MetricGrid({
  section,
}: {
  section: Extract<VentureSection, { type: 'metric-grid' }>;
}) {
  const cols = section.columns ?? 4;

  return (
    <div className={cn('metric-grid', `cols-${cols}`)}>
      {section.metrics.map((m) => {
        const Trend = m.trend === 'up' ? ArrowUp : m.trend === 'down' ? ArrowDown : Minus;
        return (
          <div key={m.label} className="metric-grid__item">
            <span className="metric-grid__label">{m.label}</span>
            <span className="metric-grid__value">{m.value}</span>
            {m.delta && (
              <span className={cn('metric-grid__delta', `is-${m.trend ?? 'flat'}`)}>
                <Trend className="h-3 w-3" />
                {m.delta}
              </span>
            )}
            {m.source && (
              <span className="metric-grid__source">{m.source}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
