import { Citation, CitationPill } from './CitationPill';
import { cn } from '@/lib/utils/cn';

interface CitationStackProps {
  citations: Citation[];
  maxVisible?: number;
  className?: string;
}

export function CitationStack({
  citations,
  maxVisible = 1,
  className,
}: CitationStackProps) {
  const visible = citations.slice(0, maxVisible);
  const remaining = citations.length - visible.length;

  return (
    <span className={cn('citation-stack', className)}>
      {visible.map((c) => (
        <CitationPill key={c.id} citation={c} />
      ))}
      {remaining > 0 && (
        <span className="citation-stack__more">+{remaining}</span>
      )}
    </span>
  );
}
