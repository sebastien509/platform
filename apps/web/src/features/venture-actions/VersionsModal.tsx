import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Clock,
  ExternalLink,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useDeliverablesStore } from '@/lib/deliverables';
import { useOpenDeliverable } from './useOpenDeliverable';
import type { Deliverable } from '@/lib/deliverables';

interface VersionsModalProps {
  open: boolean;
  onClose: () => void;
  opId: string;
  pageId: string;
  ventureId?: string;
  opVerb: string;
  destination?: string;
}

/* Relative time helper */
function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function VersionsModal({
  open,
  onClose,
  opId,
  pageId,
  ventureId,
  opVerb,
  destination,
}: VersionsModalProps) {
  const all = useDeliverablesStore((s) => s.deliverables);
  const setActiveVersion = useDeliverablesStore((s) => s.setActiveVersion);
  const removeDeliverable = useDeliverablesStore((s) => s.removeDeliverable);
  const openDeliverable = useOpenDeliverable();

  const versions: Deliverable[] = useMemo(() => {
    return Object.values(all)
      .filter(
        (d) =>
          d.opId === opId &&
          d.pageId === pageId &&
          (!ventureId || d.ventureId === ventureId)
      )
      .sort((a, b) => b.version - a.version);
  }, [all, opId, pageId, ventureId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Portal target — rendered into document.body so `position: fixed`
     escapes any transformed ancestor (hover translate on the card,
     backdrop-filter on a wrapper, etc.). Without this, the modal
     flickers between two containing blocks. */
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="versions-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${opVerb} versions`}
        >
          <motion.div
            className="versions-modal__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            className="versions-modal__panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="versions-modal__header">
              <div className="versions-modal__heading">
                <span className="versions-modal__eyebrow">
                  {destination ?? 'Operations'} ·{' '}
                  {versions.length}{' '}
                  {versions.length === 1 ? 'version' : 'versions'}
                </span>
                <h2 className="versions-modal__title">{opVerb}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close versions"
                className="versions-modal__close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="versions-modal__body">
              {versions.length === 0 ? (
                <p className="versions-modal__empty">
                  No versions yet.
                </p>
              ) : (
                <ul className="version-list">
                  {versions.map((v) => (
                    <VersionRow
                      key={v.id}
                      deliverable={v}
                      isActive={v.status === 'validated'}
                      onOpen={() => {
                        openDeliverable(v);
                        onClose();
                      }}
                      onSetActive={() => setActiveVersion(v.id)}
                      onDelete={() => removeDeliverable(v.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ---------- Row ---------- */

function VersionRow({
  deliverable,
  isActive,
  onOpen,
  onSetActive,
  onDelete,
}: {
  deliverable: Deliverable;
  isActive: boolean;
  onOpen: () => void;
  onSetActive: () => void;
  onDelete: () => void;
}) {
  const externalUrl = (deliverable.snapshot as any)?.externalUrl as
    | string
    | undefined;

  return (
    <li className={cn('version-row', isActive && 'is-active')}>
      <div className="version-row__head">
        <div className="version-row__badge">
          <span className="version-row__v">v{deliverable.version}</span>
          {isActive ? (
            <span className="version-row__status is-active">
              <Check className="h-3 w-3" />
              Active
            </span>
          ) : (
            <span className="version-row__status is-superseded">
              Superseded
            </span>
          )}
        </div>

        <span className="version-row__time">
          <Clock className="h-3 w-3" />
          {relativeTime(deliverable.createdAt)}
        </span>
      </div>

      <p className="version-row__title">{deliverable.title}</p>

      <div className="version-row__actions">
        <button
          type="button"
          className="version-row__btn"
          onClick={onOpen}
        >
          <ArrowUpRight className="h-3 w-3" />
          Open
        </button>

        {externalUrl && (
          <a
            className="version-row__btn"
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-3 w-3" />
            External
          </a>
        )}

        {!isActive && (
          <>
            <button
              type="button"
              className="version-row__btn is-primary"
              onClick={onSetActive}
              title="Make this the current version"
            >
              <Check className="h-3 w-3" />
              Set active
            </button>

            <button
              type="button"
              className="version-row__btn is-danger"
              onClick={onDelete}
              title="Delete this version"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
