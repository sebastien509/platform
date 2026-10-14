import {
  ArtifactCard,
  MetricCard,
  ModelCard,
  DecisionCard,
} from '../archetypes';
import type { CardSpec } from './types';

/**
 * ArchetypeRenderer — dispatches a grid card to its renderer
 * based on `archetype`. Defaults to 'artifact' when unspecified.
 */
export function ArchetypeRenderer({ card }: { card: CardSpec }) {
  switch (card.archetype) {
    case 'metric':
      return <MetricCard card={card as any} />;
    case 'model':
      return <ModelCard card={card as any} />;
    case 'decision':
      return <DecisionCard card={card as any} />;
    case 'artifact':
    default:
      return <ArtifactCard card={card as any} />;
  }
}
