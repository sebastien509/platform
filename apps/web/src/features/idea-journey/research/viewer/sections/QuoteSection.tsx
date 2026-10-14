import type { ResearchSection } from '@/lib/types';

export function QuoteSection({ section }: { section: ResearchSection }) {
  const q = section.quote;
  if (!q || !q.text) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail"><span>{section.label}</span></div>
      )}
      <div className="rv-section__content">
        <figure className="rv-quote">
          <blockquote className="rv-quote__text">{q.text}</blockquote>
          {q.attribution && <figcaption className="rv-quote__attr">— {q.attribution}</figcaption>}
        </figure>
      </div>
    </section>
  );
}
