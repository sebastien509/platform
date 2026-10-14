import { FileText, ExternalLink } from 'lucide-react';

export interface SourceCitation {
  id: string;
  title?: string;
  label?: string;
  status?: string;
  sourcePage?: string;
  target?: unknown;
  url?: string;
}

interface Props {
  citations: SourceCitation[];
  onOpen?: (c: SourceCitation) => void;
}

/**
 * DocumentSourcesRail — the left rail in the document viewer.
 * Lists every cited source for the open document. Clicking opens
 * the source (either another doc in the app or an external URL).
 */
export function DocumentSourcesRail({ citations, onOpen }: Props) {
  if (!citations || citations.length === 0) {
    return (
      <aside className="doc-rail doc-rail--sources">
        <div className="doc-rail__head">
          <span className="doc-rail__label">Sources</span>
        </div>
        <p className="doc-rail__empty">
          No sources cited for this document.
        </p>
      </aside>
    );
  }

  return (
    <aside className="doc-rail doc-rail--sources">
      <div className="doc-rail__head">
        <span className="doc-rail__label">Sources</span>
        <span className="doc-rail__count">{citations.length}</span>
      </div>

      <ul className="doc-rail__list">
        {citations.map((c) => {
          const external = Boolean(c.url);
          return (
            <li key={c.id}>
              <button
                type="button"
                className="doc-source-row"
                onClick={() => {
                  if (external) {
                    window.open(c.url!, '_blank', 'noopener');
                    return;
                  }
                  onOpen?.(c);
                }}
              >
                <span className="doc-source-row__icon">
                  <FileText className="h-3.5 w-3.5" />
                </span>
                <span className="doc-source-row__body">
                  <span className="doc-source-row__title">
                    {c.title ?? c.label ?? 'Untitled source'}
                  </span>
                  {c.sourcePage && (
                    <span className="doc-source-row__meta">
                      {c.sourcePage}
                      {c.status ? ` · ${c.status}` : ''}
                    </span>
                  )}
                </span>
                {external && (
                  <ExternalLink className="doc-source-row__ext h-3 w-3" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
