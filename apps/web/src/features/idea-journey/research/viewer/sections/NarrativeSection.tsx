import type { ResearchSection } from '@/lib/types';

export function NarrativeSection({ section }: { section: ResearchSection }) {
  const n = section.narrative;
  if (!n) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <div className="rv-narrative">
          {n.heading && (
            <h3 className="rv-narrative__heading">{n.heading}</h3>
          )}
          {n.paragraphs?.map((p, i) => (
            <p key={i} className="rv-narrative__p">{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
