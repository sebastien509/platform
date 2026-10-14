import { cn } from '@/lib/utils/cn';
import { getIcon } from '../iconMap';
import { CardActions } from '@/features/venture-actions';
import type { CardSpec } from '../types';

/**
 * Artifact — the classic case.
 * A produced thing: PRD, brief, positioning, plan.
 * Structure: label → title → body → optional supporting metrics.
 */
export function ArtifactCard({ card }: { card: CardSpec }) {
  const Icon = getIcon(card.icon);

  return (
    <article
      className={cn(
        'venture-bento__card archetype-artifact',
        `span-${card.span}`,
        card.variant === 'roomy' && 'venture-bento__card--roomy',
        card.variant === 'compact' && 'venture-bento__card--compact',
        card.variant === 'summary' && 'venture-bento__card--summary',
        card.variant === 'interactive' && 'venture-bento__card--interactive'
      )}
      data-status={card.status}
      data-archetype="artifact"
    >
      <header className="archetype-artifact__head">
        <span className="venture-bento__label">
          {Icon && <Icon className="venture-bento__icon" />}
          {card.label}
        </span>
        {card.status && (
          <span className={cn('venture-bento__status', `is-${card.status}`)}>
            {card.status.replace('_', ' ')}
          </span>
        )}
      </header>

      {card.title && (
        <h3 className="archetype-artifact__title">{card.title}</h3>
      )}

      {card.body && (
        <p className="archetype-artifact__body">
          {card.body.split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      )}

      {card.metrics && card.metrics.length > 0 && (
        <footer className="archetype-artifact__metrics">
          {card.metrics.map((m) => (
            <span key={m.label} className="archetype-artifact__metric">
              <span className="archetype-artifact__metric-label">{m.label}</span>
              <span className="archetype-artifact__metric-value">{m.value}</span>
            </span>
          ))}
        </footer>
      )}

      {card.actions && card.actions.length > 0 && (
        <div className="archetype-artifact__actions">
          <CardActions actionIds={card.actions} />
        </div>
      )}
    </article>
  );
}
