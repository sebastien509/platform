import type { ResearchEntry } from '@/lib/types';
import { PrintDocFrame, splitSections } from './PrintDocFrame';
import { SectionRenderer } from './SectionRenderer';

interface Props {
  entry: ResearchEntry;
  status?: string;
}

export function ResearchDocumentContent({ entry, status }: Props) {
  const { hero, facts, rest } = splitSections(entry.sections);

  /* ── Full-bleed HTML path ──
   * When the doc is a single embed section (LLM-produced HTML
   * artifact — landing page, prototype, UI spec), the iframe
   * IS the deliverable. Editorial chrome around it is wrong. */
  const isEmbedOnly =
    rest.length === 1 &&
    rest[0].type === 'embed';

  if (isEmbedOnly) {
    const embed = rest[0] as any;
    return (
      <div className="doc-html-full">
        <iframe
          title={entry.title}
          srcDoc={embed.html ?? ''}
          sandbox="allow-scripts allow-same-origin"
          className="doc-html-full__frame"
        />
      </div>
    );
  }

  return (
    <PrintDocFrame
      kind={entry.kind}
      typeLabel={entry.typeLabel}
      title={entry.title}
      summary={entry.summary}
      confidence={entry.confidence}
      founderPrompt={entry.founderPrompt}
      hero={hero}
      facts={facts}
      status={status}
    >
      {rest.map((section, idx) => (
        <SectionRenderer key={section.id ?? `sec-${idx}`} section={section} />
      ))}
    </PrintDocFrame>
  );
}
