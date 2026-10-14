import type { ResearchSection } from '@/lib/types';

export function ParagraphSection({ section }: { section: ResearchSection }) {
  const body = section.paragraph ?? '';
  if (!body) return null;
  return (
    <section className="rv-section">
      {section.label && (
        <div className="rv-section__rail">
          <span>{section.label}</span>
        </div>
      )}
      <div className="rv-section__content">
        <p className="rv-paragraph">{body}</p>
      </div>
    </section>
  );
}
