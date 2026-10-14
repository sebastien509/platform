import type { ResearchSection } from '@/lib/types';

export function HeadlineSection({ section }: { section: ResearchSection }) {
  const h = section.headline;
  if (!h) return null;
  return (
    <section className="rv-section">
      <div className="rv-section__rail" />
      <div className="rv-section__content">
        <div className="rv-headline">
          <h2 className="rv-headline__title">{h.title}</h2>
          {h.kicker && <p className="rv-headline__kicker">{h.kicker}</p>}
        </div>
      </div>
    </section>
  );
}
