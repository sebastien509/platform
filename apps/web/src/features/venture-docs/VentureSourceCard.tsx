import { useState } from 'react';
import {
  FileText,
  Check,
  AlertCircle,
  PenLine,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useOpenDeliverable } from '@/features/venture-actions/useOpenDeliverable';
import { getRenderTypeMeta } from '@/features/venture-actions/renderTypeLabel';
import { getActionDef } from '@/features/venture-actions/page-actions';
import type { VentureDocCitation } from '@/lib/types';
import type { Deliverable } from '@/lib/deliverables';

type AnyCitation = Partial<VentureDocCitation> & {
  id?: string;
  label?: string;
  title?: string;
  status?: string;
  docId?: string;
};

interface VentureSourceCardProps {
  citations: AnyCitation[];
  deliverables?: Deliverable[];
  onOpen?: (docId: string) => void;
  defaultOpen?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'text-[var(--success)]',
  draft: 'text-[var(--warning)]',
  needs_revision: 'text-[var(--error)]',
};

const STATUS_ICONS: Record<string, typeof Check> = {
  approved: Check,
  draft: PenLine,
  needs_revision: AlertCircle,
};

export function VentureSourceCard({
  citations,
  deliverables = [],
  onOpen,
  defaultOpen = false,
}: VentureSourceCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const openDeliverable = useOpenDeliverable();

  const hasCitations = citations.length > 0;
  const hasDeliverables = deliverables.length > 0;
  const nothingToShow = !hasCitations && !hasDeliverables;

  const summary = (() => {
    if (nothingToShow) return 'Nothing yet';
    const parts: string[] = [];
    if (hasDeliverables) {
      parts.push(`${deliverables.length} validated`);
    }
    if (hasCitations) {
      parts.push(
        `${citations.length} ${citations.length === 1 ? 'source' : 'sources'}`
      );
    }
    return parts.join(' · ');
  })();

  if (nothingToShow) {
    return (
      <div className="venture-bento__card venture-bento__sources">
        <span className="venture-bento__label">Sources &amp; validated</span>
        <p className="venture-bento__field-value">
          Nothing yet. As ops produce output, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="venture-bento__card venture-bento__sources">
      <button
        type="button"
        className="sources-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <span className="sources-toggle__label">
          Sources &amp; validated
        </span>
        <span className="sources-toggle__summary">{summary}</span>
        <ChevronDown
          className={cn(
            'sources-toggle__chevron',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="sources-content">
          {hasDeliverables && (
            <div className="sources-group">
              <span className="sources-group__label">Validated</span>
              <ul className="venture-bento__citations">
                {deliverables.map((d) => {
                  const rt =
                    d.renderType ??
                    getActionDef(d.opId)?.renderType ??
                    'markdown';
                  const meta = getRenderTypeMeta(rt);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => openDeliverable(d)}
                        className="venture-bento__citation venture-bento__citation--validated"
                      >
                        <span className="venture-bento__citation-type">
                          {meta.short}
                        </span>
                        <span className="venture-bento__citation-title">
                          {d.title}
                        </span>
                        <span className="venture-bento__citation-meta">
                          v{d.version}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {hasCitations && (
            <div className="sources-group">
              <span className="sources-group__label">Sources</span>
              <ul className="venture-bento__citations">
                {citations.map((c, i) => {
                  const status = c.status ?? '';
                  const Icon = STATUS_ICONS[status];
                  const statusClass = STATUS_STYLES[status];
                  const label = c.title ?? c.label ?? 'Untitled source';
                  const key = c.docId ?? c.id ?? `cite-${i}`;
                  const clickable = Boolean(c.docId && onOpen);

                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => {
                          if (c.docId) onOpen?.(c.docId);
                        }}
                        disabled={!clickable}
                        className={cn(
                          'venture-bento__citation',
                          !clickable && 'is-static'
                        )}
                      >
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="venture-bento__citation-title">
                          {label}
                        </span>
                        {Icon && (
                          <Icon
                            className={cn('h-3 w-3 shrink-0', statusClass)}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
