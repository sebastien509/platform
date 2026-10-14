import { cn } from '@/lib/utils/cn';
import type { ResearchSection } from '@/lib/types';

/** A price is "long" if it's a phrase, not a clean number/currency. */
function isLongPrice(price: string): boolean {
  const s = String(price).trim();
  if (s.length > 12) return true;
  return !/^[\s$€£¥+-]?[\d,.]+(\s*\/\s*\w+)?$/i.test(s);
}

export function PricingSection({ section }: { section: ResearchSection }) {
  const tiers = section.pricing ?? [];
  if (tiers.length === 0) return null;

  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <div className="rv-pricing" data-count={tiers.length}>
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={cn('rv-tier', tier.highlighted && 'is-highlighted')}
            >
              {tier.highlighted && (
                <span className="rv-tier__badge">Recommended</span>
              )}
              <span className="rv-tier__name">{tier.name}</span>
              <div className="rv-tier__price">
                <span
                  className="rv-tier__amount"
                  data-long={isLongPrice(tier.price) ? 'true' : undefined}
                >
                  {tier.price}
                </span>
                {tier.cadence && (
                  <span className="rv-tier__cadence">/ {tier.cadence}</span>
                )}
              </div>
              {tier.features && tier.features.length > 0 && (
                <ul className="rv-tier__features">
                  {tier.features.map((f, fi) => (
                    <li key={fi}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
