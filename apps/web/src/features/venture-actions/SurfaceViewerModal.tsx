import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Link2,
  Check,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { useSurfaceViewer } from '@/lib/stores/surfaceViewerStore';
import { useLink, copyShareUrl } from '@/lib/share';
import { useAgentDrawerStore } from '@/lib/stores/agentDrawerStore';
import { useDeliverablesStore } from '@/lib/deliverables';
import { getSurfaceRenderer } from './surfaces';
import { getActionDef } from './page-actions';
import { PdfView } from './surfaces/views/PdfView';
import { DeckView } from './surfaces/views/DeckView';

export function SurfaceViewerModal() {
  const openLinkId = useSurfaceViewer((s) => s.openLinkId);
  const runId = useSurfaceViewer((s) => s.runId);
  const deliverableId = useSurfaceViewer((s) => s.deliverableId);
  /* Format is driven by the op that produced this output — the
     agent sends exactly one renderType and we render exactly that.
     No manual switching between html / pdf / deck. */
  const formatOverride = useSurfaceViewer((s) => s.format);
  const close = useSurfaceViewer((s) => s.close);

  const link = useLink(openLinkId ?? undefined);
  const [copied, setCopied] = useState(false);

  const endRun = useAgentDrawerStore((s) => s.endRun);
  const openDrawer = useAgentDrawerStore((s) => s.openDrawer);
  const addDeliverable = useDeliverablesStore((s) => s.addDeliverable);

  const mode: 'active' | 'validated' | 'browse' = runId
    ? 'active'
    : deliverableId
    ? 'validated'
    : 'browse';

  /* Compute the effective format from the source of truth:
     the op's renderType. Falls back to the store default only
     when the op can't be resolved. */
  const effectiveFormat = (() => {
    /* From the run */
    if (runId) {
      const run = useAgentDrawerStore.getState().runs[runId];
      const opId = (run as any)?.opId;
      const def = opId ? getActionDef(opId) : undefined;
      const rt = def?.renderType;
      if (rt === 'html') return 'html' as const;
      if (rt === 'deck') return 'deck' as const;
    }
    /* From the deliverable */
    if (deliverableId) {
      const del = useDeliverablesStore
        .getState()
        .deliverables[deliverableId];
      const rt = (del as any)?.renderType;
      if (rt === 'html') return 'html' as const;
      if (rt === 'deck') return 'deck' as const;
    }
    /* Fallback — the store's default (usually html) */
    return (formatOverride ?? 'html') as 'html' | 'pdf' | 'deck';
  })();

  useEffect(() => {
    if (!openLinkId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openLinkId, close]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const open = Boolean(openLinkId && link);
  const Renderer = link ? getSurfaceRenderer(link.surfaceId) : undefined;

  const handleCopy = async () => {
    if (!link) return;
    if (await copyShareUrl(link)) setCopied(true);
  };

  const handleValidate = () => {
    if (!link || !runId) return;

    /* Read the op id + page from the run — must match the def.id
     * that OpsRowItem uses to look up deliverables. */
    const run = useAgentDrawerStore.getState().runs[runId];
    const opId = (run as any)?.opId ?? link.surfaceId;
    const pageId = run?.page ?? link.surfaceId.split('.')[0];
    const def = getActionDef(opId);

    addDeliverable({
      opId,
      pageId,
      ventureId: link.ventureId,
      title: link.snapshot.title,
      kind: 'document',
      surfaceId: link.surfaceId,
      snapshot: link.snapshot,
      shareLinkId: link.id,
      runId,
      renderType: (def?.renderType ?? 'markdown') as any,
      tier: (def?.tier ?? 'primary') as any,
    });

    endRun(runId, 'done');
    close();
  };

  const handleImprove = () => {
    close();
    if (runId) openDrawer(runId);
  };

  const handleRerun = () => {
    close();
  };

  return (
    <AnimatePresence>
      {open && link && Renderer && (
        <div
          className="action-preview action-preview--wide"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="action-preview__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          <motion.div
            className="action-preview__panel action-preview__panel--surface"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="action-preview__header">
              <div className="action-preview__heading">
                <span className="action-preview__eyebrow">
                  {mode === 'active'
                    ? 'Live · draft'
                    : mode === 'validated'
                    ? 'Delivered'
                    : 'Shared surface'}
                </span>
                <h2 className="action-preview__title">{link.snapshot.title}</h2>
                <span className="action-preview__destination">
                  {mode === 'active'
                    ? 'Validate to save this to the venture'
                    : 'Anyone with the link can comment'}
                </span>
              </div>
              <div className="action-preview__header-right">
                <button
                  type="button"
                  onClick={close}
                  className="action-preview__close"
                  aria-label="Close surface"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="action-preview__body action-preview__body--surface">
              {effectiveFormat === 'html' && (
                <div className="action-preview__surface">
                  <Renderer linkId={link.id} />
                </div>
              )}
              {effectiveFormat === 'pdf' && <PdfView linkId={link.id} />}
              {effectiveFormat === 'deck' && <DeckView linkId={link.id} />}
            </div>

            <footer className="action-preview__footer">
              {mode === 'active' && (
                <>
                  <div className="action-preview__meta">
                    <span className="action-preview__live-dot" />
                    Draft — not yet part of the venture
                  </div>
                  <div className="action-preview__actions">
                    <button
                      type="button"
                      className="action-preview__btn"
                      onClick={handleImprove}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Improve
                    </button>
                    <button
                      type="button"
                      className="action-preview__btn action-preview__btn--primary"
                      onClick={handleValidate}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Validate &amp; Save
                    </button>
                  </div>
                </>
              )}

              {mode === 'validated' && (
                <>
                  <div className="action-preview__meta">
                    <CheckCircle2 className="h-3 w-3" />
                    Validated · part of the venture
                  </div>
                  <div className="action-preview__actions">
                    <button
                      type="button"
                      className="action-preview__btn"
                      onClick={handleRerun}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Re-run
                    </button>
                    <button
                      type="button"
                      className="action-preview__btn action-preview__btn--primary"
                      onClick={handleCopy}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {copied ? 'Link copied' : 'Copy share link'}
                    </button>
                  </div>
                </>
              )}

              {mode === 'browse' && (
                <>
                  <div className="action-preview__meta">
                    <Link2 className="h-3 w-3" />
                    Anyone with the link can comment
                  </div>
                  <div className="action-preview__actions">
                    <button
                      type="button"
                      className="action-preview__btn"
                      onClick={close}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="action-preview__btn action-preview__btn--primary"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Link copied
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" />
                          Copy share link
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
