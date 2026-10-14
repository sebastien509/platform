import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useShareStore } from '@/lib/share';
import { buildShareUrl } from '@/lib/share';
import { getSurfaceRenderer } from './surfaces';
import type { ActionDef, ActionPayload } from './page-actions';
import type { Action } from '@/lib/types';

interface ActionPreviewModalProps {
  action: Action | null;
  def: ActionDef | null;
  payload: ActionPayload | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ActionPreviewModal({
  action,
  def,
  payload,
  onClose,
  onConfirm,
}: ActionPreviewModalProps) {
  const open = Boolean(action && def && payload);
  const [surfaceLinkId, setSurfaceLinkId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createLink = useShareStore((s) => s.createLink);

  /* When the action declares a surface, create a share link the
   * moment the modal opens. The founder shares by copying the URL. */
  useEffect(() => {
    if (!open || !def?.surfaceId || !def.buildSnapshot || surfaceLinkId) return;
    const id = createLink({
      surfaceId: def.surfaceId,
      ventureId: '',
      snapshot: def.buildSnapshot(),
      createdBy: 'Founder',
      commentsEnabled: true,
      expiresAt: null,
    });
    setSurfaceLinkId(id);
  }, [open, def, surfaceLinkId, createLink]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const isConnected = def?.mode === 'connected';
  const isFallback = isConnected;
  const hasSurface = Boolean(def?.surfaceId && surfaceLinkId);
  const SurfaceRenderer = def?.surfaceId
    ? getSurfaceRenderer(def.surfaceId)
    : undefined;

  const handleCopyLink = async () => {
    if (!surfaceLinkId) return;
    const url = buildShareUrl({
      // minimal shape for buildShareUrl
      id: surfaceLinkId,
    } as any);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        /* noop */
      }
    }
  };

  return (
    <AnimatePresence>
      {open && action && def && payload && (
        <div
          className={cn(
            'action-preview',
            hasSurface && 'action-preview--wide'
          )}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            className="action-preview__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="action-preview__panel"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="action-preview__header">
              <div className="action-preview__heading">
                <span className="action-preview__eyebrow">
                  {hasSurface
                    ? 'Shared surface'
                    : isFallback
                    ? 'Preview — Copy and open'
                    : 'Preview — Confirm to ship'}
                </span>
                <h2 className="action-preview__title">{def.verb}</h2>
                <span className="action-preview__destination">
                  {def.destination}
                  {def.connector && ` · ${def.connector}`}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="action-preview__close"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="action-preview__body">
              {hasSurface && SurfaceRenderer ? (
                <div className="action-preview__surface">
                  <SurfaceRenderer linkId={surfaceLinkId!} />
                </div>
              ) : (
                <div className="action-preview__content">
                  {def.description && (
                    <div className="action-preview__section">
                      <span className="action-preview__label">
                        What this does
                      </span>
                      <p className="action-preview__value">
                        {def.description}
                      </p>
                    </div>
                  )}
                  <PayloadView payload={payload} />
                </div>
              )}
            </div>

            <footer className="action-preview__footer">
              <div className="action-preview__meta">
                {hasSurface ? (
                  <>
                    <Link2 className="h-3 w-3" />
                    Anyone with the link can comment
                  </>
                ) : isFallback ? (
                  <>
                    <ExternalLink className="h-3 w-3" />
                    Connect {def.connector} to ship from IV
                  </>
                ) : (
                  <>Ships from IV — no connectors required</>
                )}
              </div>
              <div className="action-preview__actions">
                <button
                  type="button"
                  className="action-preview__btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
                {hasSurface ? (
                  <button
                    type="button"
                    className="action-preview__btn action-preview__btn--primary"
                    onClick={handleCopyLink}
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {copied ? 'Link copied' : 'Copy share link'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="action-preview__btn action-preview__btn--primary"
                    onClick={onConfirm}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isFallback ? 'Copy and open' : 'Ship it'}
                  </button>
                )}
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Payload renderer ---------- */
function PayloadView({ payload }: { payload: ActionPayload }) {
  switch (payload.type) {
    case 'confirm':
      return (
        <div className="action-preview__section">
          <span className="action-preview__label">{payload.heading}</span>
          <p className="action-preview__value">{payload.body}</p>
        </div>
      );
    case 'text':
      return (
        <div className="action-preview__section">
          <span className="action-preview__label">{payload.label}</span>
          <pre className="action-preview__code">{payload.text}</pre>
        </div>
      );
    case 'email':
      return (
        <>
          <div className="action-preview__section">
            <span className="action-preview__label">To</span>
            <p className="action-preview__value">{payload.to}</p>
          </div>
          <div className="action-preview__section">
            <span className="action-preview__label">Subject</span>
            <p className="action-preview__value">{payload.subject}</p>
          </div>
          <div className="action-preview__section">
            <span className="action-preview__label">Body</span>
            <p className="action-preview__value">{payload.body}</p>
          </div>
        </>
      );
    case 'html':
      return (
        <div className="action-preview__section">
          <span className="action-preview__label">{payload.label}</span>
          <div className="action-preview__frame">
            <iframe
              title={payload.label}
              srcDoc={payload.html}
              sandbox=""
            />
          </div>
        </div>
      );
    case 'json':
      return (
        <div className="action-preview__section">
          <span className="action-preview__label">{payload.label}</span>
          <pre className="action-preview__code">
            {JSON.stringify(payload.data, null, 2)}
          </pre>
        </div>
      );
    case 'link':
      return (
        <div className="action-preview__section">
          <span className="action-preview__label">{payload.label}</span>
          <p className="action-preview__value">{payload.url}</p>
          {payload.description && (
            <p className="action-preview__value action-preview__value--muted">
              {payload.description}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}
