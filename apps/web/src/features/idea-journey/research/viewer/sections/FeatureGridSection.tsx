import type { ResearchSection } from '@/lib/types';

export function FeatureGridSection({ section }: { section: ResearchSection }) {
  const items = section.featureGrid ?? [];
  if (items.length === 0) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <div className="rv-feature-grid">
          {items.map((f, i) => (
            <div key={i} className="rv-feature">
              <span className="rv-feature__title">{f.title}</span>
              <span className="rv-feature__body">{f.body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
