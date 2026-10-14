import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertCircle, PenLine } from 'lucide-react';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { useVentureStore } from '@/lib/stores/ventureStore';
import { useKnowledge } from '@/lib/hooks/useKnowledge';
import { unwrapList } from '@/lib/utils/unwrap';
import { knowledgeEntryToDocument } from './adapters';
import type { KnowledgeEntry, VentureDocument } from '@/lib/types';
import { ResearchDocumentContent } from '@/features/idea-journey/research/viewer';
import { documentToResearchEntry } from '@/features/idea-journey/research/viewer/documentToResearchEntry';
import { DocumentSourcesRail } from './DocumentSourcesRail';
import { DocumentCommentsRail } from './DocumentCommentsRail';

/* ------------------------------------------------------------
   Status — "validated" is the platform's terminal state.
   "approved" is legacy naming for the same; both render as
   Validated. Draft → In review. */

/* Normalized status — collapses every source's status string into
   one of three states. Both 'approved' (VentureDocument) and
   'validated' (Deliverable) map to "validated". Everything else
   that isn't explicitly "needs_revision" is treated as "in_review". */
type NormalizedStatus = 'validated' | 'in_review' | 'needs_revision';

const STATUS_PRESENTATION: Record<
  NormalizedStatus,
  {
    icon: typeof Check;
    label: string;
    className: string;
  }
> = {
  validated: {
    icon: Check,
    label: 'Validated',
    className: 'doc-status-pill doc-status-pill--validated',
  },
  in_review: {
    icon: PenLine,
    label: 'In review',
    className: 'doc-status-pill doc-status-pill--in-review',
  },
  needs_revision: {
    icon: AlertCircle,
    label: 'Needs revision',
    className: 'doc-status-pill doc-status-pill--needs-revision',
  },
};

function normalizeStatus(status: unknown): NormalizedStatus {
  if (status === 'approved' || status === 'validated') return 'validated';
  if (status === 'needs_revision') return 'needs_revision';
  return 'in_review';
}

const PAGE_LABELS: Record<string, string> = {
  strategy: 'Strategy',
  product: 'Product',
  engineering: 'Engineering',
  gtm: 'GTM',
  campaigns: 'Campaigns',
  sales: 'Sales',
  growth: 'Growth',
  analytics: 'Analytics',
  knowledge: 'Knowledge',
  outcomes: 'Outcomes',
};

interface DocumentViewerDrawerProps {
  document?: VentureDocument | null;
  onClose?: () => void;
  renderCitations?: (citations: any[]) => ReactNode;
}

/** A UUID check — comments only make sense on a real outputs row. */
function isUuid(s: string | undefined | null): boolean {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s
  );
}

export function DocumentViewerDrawer({
  document: propDocument,
  onClose,
  renderCitations,
}: DocumentViewerDrawerProps = {}) {
  const store = useDocumentViewer();
  const storeDoc = useVentureStore((s) =>
    store.docId ? s.documents[store.docId] : undefined
  );

  const inlineDoc = store.inlineDoc;

  const { data: knowledgeData } = useKnowledge();
  const allKnowledge = unwrapList<KnowledgeEntry>(knowledgeData);

  const knowledgeEntry =
    !storeDoc && store.docId
      ? allKnowledge.find((k) => k.id === store.docId)
      : undefined;

  const adaptedKnowledgeDoc = knowledgeEntry
    ? knowledgeEntryToDocument(knowledgeEntry)
    : undefined;

  const usingProp = propDocument !== undefined;
  const doc = usingProp
    ? propDocument
    : inlineDoc ?? storeDoc ?? adaptedKnowledgeDoc;

  const open = usingProp ? Boolean(propDocument) : store.open;
  const close = usingProp ? onClose ?? (() => {}) : store.close;

  useEffect(() => {
    if (!open || !doc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, doc, close]);

  useEffect(() => {
    if (!open || !doc) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, doc]);

  /* Compute the comments rail state. Only show it when the doc
     is validated AND we have a real outputs id. */
  const normalizedStatus = normalizeStatus(doc?.status);
  const statusCfg = STATUS_PRESENTATION[normalizedStatus];
  const isValidated = normalizedStatus === 'validated';
  const outputId = doc && isUuid(doc.id) ? doc.id : null;
  const commentsEnabled = isValidated && outputId !== null;

  return (
    <AnimatePresence>
      {open && doc && (
        <div
          className="document-sheet"
          role="dialog"
          aria-modal="true"
          aria-label={doc.title}
        >
          <motion.div
            className="document-sheet__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          <motion.div
            className="document-sheet__panel document-sheet__panel--3zone"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="document-sheet__header">
              <div className="document-sheet__header-left">
                <span className="document-sheet__eyebrow">
                  {PAGE_LABELS[doc.producedBy] ?? doc.producedBy} ·{' '}
                  {doc.isHeadline ? 'Headline' : 'Supporting'}
                </span>
                <h2 className="document-sheet__title">{doc.title}</h2>
              </div>

              <div className="document-sheet__header-right">
                <span className={statusCfg.className}>
                  {(() => {
                    const StatusIcon = statusCfg.icon;
                    return <StatusIcon className="h-3 w-3" />;
                  })()}
                  {statusCfg.label}
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close document"
                  className="document-sheet__close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Three-zone grid */}
            <div className="document-sheet__grid">
              {/* Left rail — sources */}
              <DocumentSourcesRail
                citations={(doc.citations as any) ?? []}
              />

              {/* Center — the document */}
              <div className="document-sheet__center">
                <div className="document-sheet__meta-strip">
                  {isValidated && doc.approvedAt && (
                    <span>
                      Validated{' '}
                      {new Date(doc.approvedAt).toLocaleDateString()}
                    </span>
                  )}
                  {!isValidated && (
                    <span className="document-sheet__in-review-note">
                      In review — validate on the ops card to save to the venture
                    </span>
                  )}
                  {doc.builtOnDraftInput && (
                    <span className="document-sheet__warning">
                      Built on draft input — downstream review recommended
                    </span>
                  )}
                </div>

                {doc.summary && (
                  <div className="document-sheet__section">
                    <p className="document-sheet__section-label">Summary</p>
                    <p className="document-sheet__summary">{doc.summary}</p>
                  </div>
                )}

                {doc.revisionNote && (
                  <div className="document-sheet__revision">
                    <p className="document-sheet__section-label document-sheet__section-label--error">
                      Revision note
                    </p>
                    <p className="document-sheet__revision-text">
                      {doc.revisionNote}
                    </p>
                  </div>
                )}

                {doc.sections && doc.sections.length > 0 ? (
                  <div className="document-sheet__section">
                    <ResearchDocumentContent
                      entry={documentToResearchEntry(doc)}
                      status={doc.status}
                    />
                  </div>
                ) : doc.content ? (
                  <div className="document-sheet__section">
                    <p className="document-sheet__section-label">Document</p>
                    <div className="document-sheet__document">
                      {doc.content}
                    </div>
                  </div>
                ) : null}

                {/* If a caller overrides citations, render here instead. */}
                {renderCitations &&
                  doc.citations &&
                  doc.citations.length > 0 && (
                    <div className="document-sheet__section">
                      <p className="document-sheet__section-label">Sources</p>
                      {renderCitations(doc.citations)}
                    </div>
                  )}

                <div className="document-sheet__footer-meta">
                  <span>Kind: {String(doc.kind).replace('_', ' ')}</span>
                  <span>·</span>
                  <span>
                    Created {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                  <span>·</span>
                  <span>
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Right rail — comments (only after validation) */}
              <DocumentCommentsRail
                outputId={commentsEnabled ? outputId : null}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
