import { ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { getIcon } from '../iconMap';
import type { CardSpec, ModelStep, ModelLayer, ModelStage } from '../types';

/**
 * Model — the visual IS the content.
 * Four sub-kinds:
 *   · flow     — horizontal step sequence (PRD stages, pipeline steps)
 *   · funnel   — vertical stages with proportional bars (pipeline, cohorts)
 *   · stack    — vertical layers (architecture, deployment)
 *   · sequence — vertical numbered steps (drip, workflow)
 */
export function ModelCard({ card }: { card: CardSpec }) {
  const Icon = getIcon(card.icon);
  const kind = card.model ?? 'flow';

  return (
    <article
      className={cn(
        'venture-bento__card archetype-model',
        `span-${card.span}`,
        `archetype-model--${kind}`
      )}
      data-status={card.status}
      data-archetype="model"
      data-model={kind}
    >
      <header className="archetype-model__head">
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

      {card.title && <h3 className="archetype-model__title">{card.title}</h3>}

      <div className="archetype-model__canvas">
        {kind === 'flow' && <FlowDiagram steps={card.steps ?? []} />}
        {kind === 'funnel' && <FunnelDiagram stages={card.stages ?? []} />}
        {kind === 'stack' && <StackDiagram layers={card.layers ?? []} />}
        {kind === 'sequence' && <SequenceDiagram steps={card.steps ?? []} />}
      </div>
    </article>
  );
}

/* ============================================================
   FLOW — horizontal sequence of steps
   ============================================================ */
function FlowDiagram({ steps }: { steps: ModelStep[] }) {
  if (steps.length === 0) {
    return <div className="archetype-model__empty">No flow defined yet.</div>;
  }
  return (
    <div className="model-flow">
      {steps.map((step, i) => (
        <div key={step.id} className="model-flow__step">
          <div
            className={cn(
              'model-flow__node',
              step.status && `is-${step.status}`
            )}
          >
            <span className="model-flow__index">{i + 1}</span>
            <span className="model-flow__label">{step.label}</span>
            {step.description && (
              <span className="model-flow__desc">{step.description}</span>
            )}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="model-flow__arrow" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   FUNNEL — vertical stages with proportional bars
   ============================================================ */
function FunnelDiagram({ stages }: { stages: ModelStage[] }) {
  if (stages.length === 0) {
    return <div className="archetype-model__empty">No stages defined yet.</div>;
  }
  const maxPercent = Math.max(...stages.map((s) => s.percent ?? 100), 100);
  return (
    <div className="model-funnel">
      {stages.map((stage) => {
        const pct = stage.percent ?? 100;
        return (
          <div key={stage.id} className="model-funnel__stage">
            <div className="model-funnel__head">
              <span className="model-funnel__label">{stage.label}</span>
              <span className="model-funnel__count">
                {stage.count ?? stage.value ?? ''}
              </span>
            </div>
            <div className="model-funnel__bar">
              <div
                className={cn(
                  'model-funnel__bar-fill',
                  stage.status && `is-${stage.status}`
                )}
                style={{ width: `${(pct / maxPercent) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   STACK — vertical layers
   ============================================================ */
function StackDiagram({ layers }: { layers: ModelLayer[] }) {
  if (layers.length === 0) {
    return <div className="archetype-model__empty">No layers defined yet.</div>;
  }
  return (
    <div className="model-stack">
      {layers.map((layer, i) => (
        <div key={layer.id} className="model-stack__slot">
          <div
            className={cn(
              'model-stack__layer',
              layer.status && `is-${layer.status}`
            )}
          >
            <span className="model-stack__label">{layer.label}</span>
            {layer.description && (
              <span className="model-stack__desc">{layer.description}</span>
            )}
          </div>
          {i < layers.length - 1 && (
            <ChevronDown className="model-stack__connector" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SEQUENCE — vertical numbered steps
   ============================================================ */
function SequenceDiagram({ steps }: { steps: ModelStep[] }) {
  if (steps.length === 0) {
    return <div className="archetype-model__empty">No steps defined yet.</div>;
  }
  return (
    <ol className="model-sequence">
      {steps.map((step, i) => (
        <li key={step.id} className="model-sequence__step">
          <span
            className={cn(
              'model-sequence__marker',
              step.status && `is-${step.status}`
            )}
          >
            {i + 1}
          </span>
          <div className="model-sequence__body">
            <span className="model-sequence__label">{step.label}</span>
            {step.description && (
              <span className="model-sequence__desc">{step.description}</span>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
