import type { ResearchSection } from '@/lib/types';

export function CalloutSection({ section }: { section: ResearchSection }) {
  const c = section.callout;
  if (!c) return null;
  const isAttention = c.tone === 'attention';
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        {isAttention ? (
          <div className="rv-muted-block">
            {c.label && (
              <span className="rv-muted-block__label">{c.label}</span>
            )}
            {c.body}
          </div>
        ) : (
          <div className="rv-signal">
            {c.label && (
              <span className="rv-signal__label">{c.label}</span>
            )}
            <p>{c.body}</p>
          </div>
        )}
      </div>
    </section>
  );
}
