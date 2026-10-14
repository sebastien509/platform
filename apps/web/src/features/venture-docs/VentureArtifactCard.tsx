import { Check, AlertCircle, PenLine, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { VentureDocument } from '@/lib/types';

interface VentureArtifactCardProps {
  doc: VentureDocument;
  onOpen: (docId: string) => void;
}

const STATUS_CONFIG = {
  approved: { icon: Check, class: 'text-[var(--success)]', label: 'Approved' },
  draft: { icon: PenLine, class: 'text-[var(--warning)]', label: 'Draft' },
  needs_revision: {
    icon: AlertCircle,
    class: 'text-[var(--error)]',
    label: 'Needs revision',
  },
};

export function VentureArtifactCard({ doc, onOpen }: VentureArtifactCardProps) {
  const config = STATUS_CONFIG[doc.status];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(doc.id)}
      className="venture-bento__card venture-bento__artifact"
    >
      <div className="venture-bento__artifact-header">
        <span className="venture-bento__label">{doc.title}</span>
        <Icon className={cn('h-3.5 w-3.5 shrink-0', config.class)} />
      </div>
      <p className="venture-bento__artifact-summary">{doc.summary}</p>
      <div className="venture-bento__artifact-footer">
        <span className={cn('venture-bento__artifact-status', config.class)}>
          {config.label}
        </span>
        {doc.builtOnDraftInput && (
          <span className="venture-bento__artifact-warning">
            Built on draft input
          </span>
        )}
        <ArrowRight className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
      </div>
    </button>
  );
}
