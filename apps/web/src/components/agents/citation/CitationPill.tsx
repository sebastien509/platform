import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface Citation {
  id: string;
  label: string;
  onClick?: () => void;
}

interface CitationPillProps {
  citation: Citation;
  className?: string;
}

export function CitationPill({ citation, className }: CitationPillProps) {
  return (
    <button
      type="button"
      className={cn('citation-pill', className)}
      onClick={citation.onClick}
      aria-label={`View source: ${citation.label}`}
    >
      <FileText className="citation-pill__icon" aria-hidden="true" />
      <span className="citation-pill__label">{citation.label}</span>
      <span className="citation-pill__arrow" aria-hidden="true">→</span>
    </button>
  );
}
