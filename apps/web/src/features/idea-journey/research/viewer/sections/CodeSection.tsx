import type { ResearchSection } from '@/lib/types';

export function CodeSection({ section }: { section: ResearchSection }) {
  const code = section.code;
  if (!code) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <div className="rv-code">
          {code.language && (
            <span className="rv-code__lang">{code.language}</span>
          )}
          <pre className="rv-code__pre">{code.code}</pre>
        </div>
      </div>
    </section>
  );
}
