import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { ShareSection } from '@/lib/share';

/**
 * SurfaceSections — renders any ShareSection.
 * Every shared surface composes from this so section styling stays
 * consistent across Brief, Prototype, Docs, Plan, Landing, Proposal.
 */
export function SurfaceSections({ sections }: { sections: ShareSection[] }) {
  return (
    <div className="surface-sections">
      {sections.map((section) => (
        <SurfaceSection key={section.id} section={section} />
      ))}
    </div>
  );
}

function SurfaceSection({ section }: { section: ShareSection }) {
  switch (section.type) {
    case 'paragraph':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <p className="surface-paragraph">{section.body}</p>
        </section>
      );

    case 'metrics':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <div className="surface-metrics">
            {section.items.map((m) => {
              /* Value length dictates the treatment:
               *   short  (≤8)   → display font, 26px — numbers, prices, %
               *   medium (≤20)  → sans, 17px, weight 650 — short phrases
               *   long   (>20)  → sans, 14.5px, weight 500 — full sentences
               * The LLM never styles; the renderer adapts. */
              const raw = String(m.value ?? '');
              const len = raw.length;
              const sizeClass =
                len <= 8 ? 'is-short' : len <= 20 ? 'is-medium' : 'is-long';
              return (
                <div key={m.label} className="surface-metric">
                  <span className="surface-metric__label">{m.label}</span>
                  <span className={cn('surface-metric__value', sizeClass)}>
                    {m.value}
                  </span>
                  {m.delta && (
                    <span className={cn('surface-metric__delta', `is-${m.trend ?? 'flat'}`)}>
                      {m.delta}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );

    case 'list': {
      /* Archetype detection — a list whose items are named people
       * (title matches "Firstname Lastname" pattern) renders as
       * individual profile cards with avatars. Everything else
       * renders as one grouped card with internal dividers. */
      const isArchetype =
        section.items.length >= 2 &&
        section.items.every(
          (i) =>
            typeof i.title === 'string' &&
            /^[A-Z][a-z]+\s+[A-Z]/.test(i.title.trim())
        );

      if (isArchetype) {
        return (
          <section className="surface-section">
            {section.label && <Label>{section.label}</Label>}
            <ul className="surface-archetypes">
              {section.items.map((item, i) => {
                const initials = getInitials(item.title ?? '');
                return (
                  <li key={i} className="surface-archetype">
                    <span className="surface-archetype__avatar">{initials}</span>
                    <div className="surface-archetype__body">
                      <span className="surface-archetype__name">{item.title}</span>
                      {item.body && (
                        <span className="surface-archetype__detail">{item.body}</span>
                      )}
                    </div>
                    {item.meta && (
                      <span className="surface-archetype__meta">{item.meta}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      }

      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <ul className="surface-list">
            {section.items.map((item, i) => (
              <li key={i} className="surface-list__item">
                <div className="surface-list__main">
                  <span className="surface-list__title">{item.title}</span>
                  {item.body && <span className="surface-list__body">{item.body}</span>}
                </div>
                {item.meta && <span className="surface-list__meta">{item.meta}</span>}
              </li>
            ))}
          </ul>
        </section>
      );
    }

    case 'callout':
      return (
        <section className={cn('surface-callout', `is-${section.tone}`)}>
          <span className="surface-callout__icon">
            {section.tone === 'attention' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </span>
          <div className="surface-callout__content">
            {section.label && <Label>{section.label}</Label>}
            <p className="surface-paragraph">{section.body}</p>
          </div>
        </section>
      );

    case 'code':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <div className="surface-code" data-language={section.language}>
            <pre>{section.code}</pre>
          </div>
        </section>
      );

    case 'timeline':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <ol className="surface-timeline">
            {section.items.map((item, i) => (
              <li key={i} className="surface-timeline__item">
                <div className="surface-timeline__rail">
                  <span className="surface-timeline__dot" />
                  {i < section.items.length - 1 && (
                    <span className="surface-timeline__line" />
                  )}
                </div>
                <div className="surface-timeline__content">
                  <div className="surface-timeline__head">
                    <span className="surface-timeline__when">{item.when}</span>
                    {item.status && (
                      <span className="surface-timeline__status">{item.status}</span>
                    )}
                  </div>
                  <span className="surface-timeline__title">{item.title}</span>
                  {item.body && <span className="surface-timeline__body">{item.body}</span>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      );

    case 'hero':
      return (
        <section className="surface-hero">
          {section.eyebrow && <span className="surface-hero__eyebrow">{section.eyebrow}</span>}
          <h2 className="surface-hero__headline">{section.headline}</h2>
          {section.subhead && <p className="surface-hero__subhead">{section.subhead}</p>}
          {(section.cta || section.secondaryCta) && (
            <div className="surface-hero__actions">
              {section.cta && (
                <span className="surface-hero__cta is-primary">
                  {section.cta.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
              {section.secondaryCta && (
                <span className="surface-hero__cta">
                  {section.secondaryCta.label}
                </span>
              )}
            </div>
          )}
        </section>
      );

    case 'feature-grid':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <div className="surface-feature-grid">
            {section.items.map((f, i) => (
              <div key={i} className="surface-feature">
                <span className="surface-feature__title">{f.title}</span>
                <span className="surface-feature__body">{f.body}</span>
              </div>
            ))}
          </div>
        </section>
      );

    case 'pricing':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <div className="surface-pricing">
            {section.tiers.map((tier) => (
              <div
                key={tier.name}
                className={cn('surface-pricing__tier', tier.highlighted && 'is-highlighted')}
              >
                <span className="surface-pricing__name">{tier.name}</span>
                <div className="surface-pricing__price">
                  <span className="surface-pricing__amount">{tier.price}</span>
                  {tier.cadence && (
                    <span className="surface-pricing__cadence">/ {tier.cadence}</span>
                  )}
                </div>
                <ul className="surface-pricing__features">
                  {tier.features.map((f, i) => (
                    <li key={i} className="surface-pricing__feature">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );

    case 'embed':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <div
            className={cn(
              'surface-embed',
              section.aspect === 'video' && 'is-video',
              section.aspect === 'square' && 'is-square'
            )}
          >
            <iframe
              title={section.label ?? 'Embedded surface'}
              srcDoc={section.html}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </section>
      );

    case 'terms':
      return (
        <section className="surface-section">
          {section.label && <Label>{section.label}</Label>}
          <dl className="surface-terms">
            {section.items.map((item, i) => (
              <div key={i} className="surface-terms__row">
                <dt className="surface-terms__label">{item.label}</dt>
                <dd className="surface-terms__body">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      );

    default:
      return null;
  }
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/[\s,]+/)
    .filter((w) => w.length > 0 && /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function Label({ children }: { children: string }) {
  return <span className="surface-section__label">{children}</span>;
}
