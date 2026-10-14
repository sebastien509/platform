import { useEffect, useState } from 'react';
import {
  Check,
  AlertCircle,
  PenLine,
  FileText,
  Edit3,
  Eye,
} from 'lucide-react';
import { DrawerShell } from '@/components/containers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/cn';
import { useArtifactEditor } from '@/lib/stores/artifactEditorStore';
import { useVentureStore } from '@/lib/stores/ventureStore';
import { useDocumentViewer } from '@/lib/stores/documentViewerStore';
import { VentureSourceCard } from './VentureSourceCard';

/**
 * ArtifactDrawer — inspect + edit a produced artifact.
 *
 * Sibling to DocumentViewerDrawer. This is the *editing* surface.
 * The bottom sheet is the *reading* surface.
 *
 *   - Inspect mode: full artifact content, revision notes, sources, status
 *   - Edit mode: editable content, save / cancel / request revision
 *   - Approve action lives here (founder decides in-place)
 *   - "Read as document" opens the bottom sheet for long-form reading
 */

const STATUS_CONFIG = {
  approved: { icon: Check, className: 'text-[var(--success)]', label: 'Approved' },
  draft: { icon: PenLine, className: 'text-[var(--warning)]', label: 'Draft' },
  needs_revision: {
    icon: AlertCircle,
    className: 'text-[var(--error)]',
    label: 'Needs revision',
  },
};

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

export function ArtifactDrawer() {
  const { open, docId, mode, setMode, close } = useArtifactEditor();
  const doc = useVentureStore((s) => (docId ? s.documents[docId] : undefined));
  const upsertDocument = useVentureStore((s) => s.upsertDocument);
  const approveDocument = useVentureStore((s) => s.approveDocument);
  const requestRevision = useVentureStore((s) => s.requestRevision);
  const openDocument = useDocumentViewer((s) => s.openDocument);

  const [draftContent, setDraftContent] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionInput, setShowRevisionInput] = useState(false);

  useEffect(() => {
    if (doc) {
      setDraftContent(doc.content);
      setRevisionNote('');
      setShowRevisionInput(false);
    }
  }, [doc?.id, doc?.updatedAt]);

  if (!doc) {
    return (
      <DrawerShell
        open={open}
        onOpenChange={(v) => !v && close()}
        title="Artifact"
        side="right"
        width={640}
      >
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          Artifact not found.
        </p>
      </DrawerShell>
    );
  }

  const config = STATUS_CONFIG[doc.status];
  const StatusIcon = config.icon;
  const isDirty = draftContent !== doc.content;

  function handleSave() {
    if (!doc) return;
    upsertDocument({
      ...doc,
      content: draftContent,
      updatedAt: new Date().toISOString(),
    });
    setMode('inspect');
  }

  function handleApprove() {
    if (!doc) return;
    approveDocument(doc.id);
    close();
  }

  function handleRequestRevision() {
    if (!doc) return;
    if (!revisionNote.trim()) {
      setShowRevisionInput(true);
      return;
    }
    requestRevision(doc.id, revisionNote.trim());
    setShowRevisionInput(false);
    close();
  }

  function handleReadAsDocument() {
    if (!doc) return;
    close();
    openDocument(doc.id);
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={(v) => !v && close()}
      title={doc.title}
      description={`${PAGE_LABELS[doc.producedBy] ?? doc.producedBy} · ${doc.isHeadline ? 'Headline' : 'Supporting'}`}
      side="right"
      width={640}
    >
      <div className="artifact-drawer">
        {/* ---------- Header strip ---------- */}
        <div className="artifact-drawer__header">
          <div className="artifact-drawer__header-left">
            <Badge className={cn('gap-1', config.className)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
            {doc.builtOnDraftInput && (
              <Badge className="text-2xs bg-[var(--warning-muted)] text-[var(--warning)]">
                Built on draft
              </Badge>
            )}
          </div>

          <div className="artifact-drawer__mode-switch" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'inspect'}
              onClick={() => setMode('inspect')}
              className={cn(
                'artifact-drawer__mode-btn',
                mode === 'inspect' && 'is-active'
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              Inspect
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'edit'}
              onClick={() => setMode('edit')}
              className={cn(
                'artifact-drawer__mode-btn',
                mode === 'edit' && 'is-active'
              )}
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>

        {/* ---------- Revision note (if present) ---------- */}
        {doc.revisionNote && mode === 'inspect' && (
          <div className="artifact-drawer__revision-note">
            <p className="artifact-drawer__section-label artifact-drawer__section-label--error">
              Revision note
            </p>
            <p className="artifact-drawer__revision-text">{doc.revisionNote}</p>
          </div>
        )}

        {/* ---------- Content ---------- */}
        <div className="artifact-drawer__content">
          <p className="artifact-drawer__section-label">Content</p>
          {mode === 'inspect' ? (
            <pre className="artifact-drawer__read-view">{doc.content}</pre>
          ) : (
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="artifact-drawer__edit-view"
              rows={20}
            />
          )}
        </div>

        {/* ---------- Citations ---------- */}
        {doc.citations.length > 0 && (
          <div className="artifact-drawer__content">
            <p className="artifact-drawer__section-label">Sources</p>
            <VentureSourceCard citations={doc.citations} />
          </div>
        )}

        {/* ---------- Revision input (only when requested) ---------- */}
        {showRevisionInput && (
          <div className="artifact-drawer__revision-input">
            <p className="artifact-drawer__section-label">
              Why does this need revision?
            </p>
            <Textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Give the agent guidance so the next pass is closer."
              rows={3}
              autoFocus
            />
            <div className="artifact-drawer__revision-input-actions">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowRevisionInput(false);
                  setRevisionNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRequestRevision}
                disabled={!revisionNote.trim()}
              >
                Send back for revision
              </Button>
            </div>
          </div>
        )}

        {/* ---------- Actions ---------- */}
        <div className="artifact-drawer__actions">
          {mode === 'edit' ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={!isDirty}>
                Save changes
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraftContent(doc.content);
                  setMode('inspect');
                }}
              >
                Discard
              </Button>
            </>
          ) : (
            <>
              {doc.status !== 'approved' && (
                <Button size="sm" onClick={handleApprove} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
              )}
              {!showRevisionInput && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestRevision}
                  className="gap-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Request revision
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReadAsDocument}
                className="gap-1.5 ml-auto"
              >
                <FileText className="h-3.5 w-3.5" />
                Read as document
              </Button>
            </>
          )}
        </div>

        {/* ---------- Meta footer ---------- */}
        <div className="artifact-drawer__footer-meta">
          <span>Kind: {doc.kind.replace(/_/g, ' ')}</span>
          <span>·</span>
          <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
          {doc.approvedAt && (
            <>
              <span>·</span>
              <span>Approved {new Date(doc.approvedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}
