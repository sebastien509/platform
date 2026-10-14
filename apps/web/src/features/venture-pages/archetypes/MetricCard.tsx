import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getIcon } from '../iconMap';
import type { CardSpec, CardMetric } from '../types';

/**
 * Metric — the number is the hero.
 * Used for health, conversion, readiness, retention.
 * No body copy. Optional single metric or a grid of 2–4.
 */
export function MetricCard({ card }: { card: CardSpec }) {
  const Icon = getIcon(card.icon);
  const metrics = card.metrics ?? [];

  return (
    <article
      className={cn(
        'venture-bento__card archetype-metric',
        `span-${card.span}`,
        metrics.length === 1 && 'archetype-metric--single',
        metrics.length === 2 && 'archetype-metric--pair'
      )}
      data-status={card.status}
      data-archetype="metric"
    >
      <header className="archetype-metric__head">
        <span className="venture-bento__label">
          {Icon && <Icon className="venture-bento__icon" />}
          {card.label}
        </span>
      </header>

      <div className="archetype-metric__values">
        {metrics.map((m) => (
          <MetricValue key={m.label} metric={m} single={metrics.length === 1} />
        ))}
      </div>

      {card.title && <p className="archetype-metric__caption">{card.title}</p>}
    </article>
  );
}

function MetricValue({ metric, single }: { metric: CardMetric; single: boolean }) {
  const Trend = metric.trend === 'up' ? ArrowUp : metric.trend === 'down' ? ArrowDown : Minus;
  return (
    <div className={cn('archetype-metric__value', single && 'is-single')}>
      <span className="archetype-metric__value-label">{metric.label}</span>
      <span className="archetype-metric__value-number">{metric.value}</span>
      {metric.delta && (
        <span className={cn('archetype-metric__delta', `is-${metric.trend ?? 'flat'}`)}>
          <Trend className="h-3 w-3" />
          {metric.delta}
        </span>
      )}
    </div>
  );
}
