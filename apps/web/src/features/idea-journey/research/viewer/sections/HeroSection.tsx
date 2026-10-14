import type { ResearchSection } from '@/lib/types';

export function HeroSection({ section }: { section: ResearchSection }) {
  const h = section.hero;
  if (!h) return null;
  return (
    <section className="rv-section rv-section--hero">
      {h.eyebrow && <span className="rv-hero__eyebrow">{h.eyebrow}</span>}
      <h2 className="rv-hero__headline">{h.headline}</h2>
      {h.subhead && <p className="rv-hero__subhead">{h.subhead}</p>}
      {h.ctaLabel && (
        <div className="rv-hero__actions">
          <span className="rv-hero__cta">{h.ctaLabel}</span>
        </div>
      )}
    </section>
  );
}
