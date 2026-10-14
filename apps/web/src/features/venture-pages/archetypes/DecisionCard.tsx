import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { CardSpec } from '../types';

/**
 * Decision — the founder must act.
 * Amber-tinted. Prompt dominant. Options visible.
 * Used for "choose an outreach sequence", "approve the PRD", etc.
 */
export function DecisionCard({
  card,
  onDecide,
}: {
  card: CardSpec;
  onDecide?: (cardId: string, value: string) => void;
}) {
  return (
    <article
      className={cn(
        'venture-bento__card archetype-decision',
        `span-${card.span}`
      )}
      data-archetype="decision"
    >
      <span className="archetype-decision__eyebrow">
        <AlertCircle className="h-3 w-3" />
        Needs your input
      </span>

      {card.title && (
        <h3 className="archetype-decision__title">{card.title}</h3>
      )}

      {card.body && <p className="archetype-decision__body">{card.body}</p>}

      {card.options && card.options.length > 0 && (
        <div className="archetype-decision__options">
          {card.options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={cn(
                'archetype-decision__option',
                o.primary && 'is-primary',
                o.destructive && 'is-destructive'
              )}
              onClick={() => onDecide?.(card.id, o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
