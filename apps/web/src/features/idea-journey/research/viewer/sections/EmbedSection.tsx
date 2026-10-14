import { cn } from '@/lib/utils/cn';
import type { ResearchSection } from '@/lib/types';

export function EmbedSection({ section }: { section: ResearchSection }) {
  const e = section.embed;
  if (!e) return null;
  return (
    <section className="rv-section rv-section--embed">
      {section.label && (
        <p className="rv-section__label">{section.label}</p>
      )}
      <div
        className={cn(
          'rv-embed',
          e.aspect === 'video' && 'is-video',
          e.aspect === 'square' && 'is-square'
        )}
      >
        <iframe
          title={section.label ?? 'Embedded content'}
          srcDoc={e.html}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </section>
  );
}
