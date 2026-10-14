import { cn } from '@/lib/utils/cn';
import type { VentureSection } from './engine/types';

export function SignalHero({
  section,
}: {
  section: Extract<VentureSection, { type: 'signal-hero' }>;
}) {
  return (
    <section className="signal-hero">
      {section.eyebrow && (
        <span className="signal-hero__eyebrow">{section.eyebrow}</span>
      )}
      <h2 className="signal-hero__headline">{section.headline}</h2>
      <p className="signal-hero__body">{section.body}</p>

      {section.stats && section.stats.length > 0 && (
        <div className="signal-hero__stats">
          {section.stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                'signal-hero__stat',
                s.tone && s.tone !== 'default' && `is-${s.tone}`
              )}
            >
              <span className="signal-hero__stat-value">{s.value}</span>
              <span className="signal-hero__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
