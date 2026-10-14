import { ArrowRight, Check, AlertCircle, X, HelpCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { VentureSection, OutcomeState } from './engine/types';

const STATE_META: Record<OutcomeState, { label: string; icon: any; tone: string }> = {
  positive: { label: 'Positive', icon: Check, tone: 'positive' },
  mixed: { label: 'Mixed', icon: AlertCircle, tone: 'mixed' },
  negative: { label: 'Negative', icon: X, tone: 'negative' },
  inconclusive: { label: 'Inconclusive', icon: HelpCircle, tone: 'inconclusive' },
  pending: { label: 'Pending evidence', icon: Clock, tone: 'pending' },
};

export function OutcomeCards({
  section,
}: {
  section: Extract<VentureSection, { type: 'outcome-cards' }>;
}) {
  return (
    <div className="outcome-cards">
      {section.cards.map((card) => {
        const meta = STATE_META[card.state];
        const Icon = meta.icon;

        return (
          <article
            key={card.id}
            className={cn('outcome-card', `is-${meta.tone}`)}
          >
            <span className="outcome-card__rail" aria-hidden />

            <header className="outcome-card__head">
              <span className="outcome-card__page">{card.page}</span>
              <span className={cn('outcome-card__state', `is-${meta.tone}`)}>
                <Icon className="h-3 w-3" />
                {meta.label}
              </span>
            </header>

            <h3 className="outcome-card__title">{card.title}</h3>

            <div className="outcome-card__hypothesis">
              <span className="outcome-card__label">Hypothesis</span>
              <p className="outcome-card__hypothesis-body">{card.hypothesis}</p>
            </div>

            {(card.expected || card.actual) && (
              <div className="outcome-card__compare">
                {card.expected && (
                  <div className="outcome-card__compare-col">
                    <span className="outcome-card__label">Expected</span>
                    {card.expected.map((e) => (
                      <div key={e.label} className="outcome-card__row">
                        <span className="outcome-card__row-label">{e.label}</span>
                        <span className="outcome-card__row-value">{e.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {card.actual && (
                  <div className="outcome-card__compare-col">
                    <span className="outcome-card__label">Actual</span>
                    {card.actual.map((a) => (
                      <div key={a.label} className="outcome-card__row">
                        <span className="outcome-card__row-label">{a.label}</span>
                        <span className="outcome-card__row-value">{a.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {typeof card.confidenceFrom === 'number' &&
              typeof card.confidenceTo === 'number' && (
                <div className="outcome-card__confidence">
                  <span className="outcome-card__label">Confidence</span>
                  <div className="confidence-move">
                    <span className="confidence-move__from">
                      {card.confidenceFrom}%
                    </span>
                    <span className="confidence-move__bar">
                      <span
                        className="confidence-move__fill"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              ((card.confidenceTo - card.confidenceFrom) /
                                Math.max(card.confidenceFrom, 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </span>
                    <span className="confidence-move__to">
                      {card.confidenceTo}%
                    </span>
                    <span className="confidence-move__delta">
                      +{card.confidenceTo - card.confidenceFrom}
                    </span>
                  </div>
                </div>
              )}

            {card.decision && (
              <div className="outcome-card__decision">
                <span className="outcome-card__label">Decision</span>
                <p className="outcome-card__decision-body">{card.decision}</p>
              </div>
            )}

            {card.evidence && card.evidence.length > 0 && (
              <footer className="outcome-card__footer">
                <span className="outcome-card__label">Based on</span>
                <span className="outcome-card__evidence">
                  {card.evidence.join(' · ')}
                </span>
                <button type="button" className="outcome-card__open">
                  Open outcome
                  <ArrowRight className="h-3 w-3" />
                </button>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}
