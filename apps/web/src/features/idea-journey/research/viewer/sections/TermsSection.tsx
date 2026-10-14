import type { ResearchSection } from '@/lib/types';

export function TermsSection({ section }: { section: ResearchSection }) {
  const items = section.terms ?? [];
  if (items.length === 0) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail"><span>{section.label}</span></div>
      )}
      <div className="rv-section__content">
        <dl className="rv-terms">
          {items.map((item, i) => (
            <div key={i} className="rv-term">
              <dt className="rv-term__label">{item.label}</dt>
              <dd className="rv-term__body">{item.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
