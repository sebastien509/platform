import { useEffect, useRef } from 'react';
import {
  MessageSquare,
  Download,
  Share2,
  GitBranch,
  Layers,
} from 'lucide-react';
import type { Deliverable } from '@/lib/deliverables';
import { useCommentPanelStore } from '@/lib/stores/commentPanelStore';

interface DeliverableCardMenuProps {
  deliverable: Deliverable;
  onClose: () => void;
  onSeeThreads: () => void;
  onOpenComments?: () => void;
  /** Number of versions for this op. When > 1, a "Versions (N)"
   *  entry appears at the top of the menu. */
  versionCount?: number;
  onOpenVersions?: () => void;
}

export function DeliverableCardMenu({
  deliverable,
  onClose,
  onSeeThreads,
  onOpenComments,
  versionCount,
  onOpenVersions,
}: DeliverableCardMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const openCommentPanel = useCommentPanelStore((s) => s.openPanel);

  /* Click-outside + Escape close */
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function handleDownload() {
    const payload = {
      title: deliverable.title,
      version: deliverable.version,
      validatedAt: deliverable.validatedAt,
      snapshot: deliverable.snapshot,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deliverable.title
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()}-v${deliverable.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  }

  async function handleShare() {
    const shareId = deliverable.shareLinkId;
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = shareId
      ? `${base}/share/${shareId}`
      : `${base}/ventures/${deliverable.ventureId}/${deliverable.pageId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Clipboard may be blocked — silently ignore */
    }
    onClose();
  }

  return (
    <div
      ref={ref}
      role="menu"
      className="deliverable-menu"
      onClick={(e) => e.stopPropagation()}
    >
      {versionCount != null && versionCount > 1 && onOpenVersions && (
        <>
          <button
            type="button"
            role="menuitem"
            className="deliverable-menu__item"
            onClick={() => {
              onOpenVersions();
              onClose();
            }}
          >
            <span className="deliverable-menu__icon">
              <Layers className="h-3.5 w-3.5" />
            </span>
            <div className="deliverable-menu__body">
              <span className="deliverable-menu__label">
                Versions ({versionCount})
              </span>
              <span className="deliverable-menu__hint">
                View, activate, or delete prior versions
              </span>
            </div>
          </button>
          <div className="deliverable-menu__divider" />
        </>
      )}

      <button
        type="button"
        role="menuitem"
        className="deliverable-menu__item"
        onClick={() => {
          onSeeThreads();
          onClose();
        }}
      >
        <span className="deliverable-menu__icon">
          <GitBranch className="h-3.5 w-3.5" />
        </span>
        <div className="deliverable-menu__body">
          <span className="deliverable-menu__label">See agent threads</span>
          <span className="deliverable-menu__hint">
            Reopen the run behind this deliverable
          </span>
        </div>
      </button>

      <button
        type="button"
        role="menuitem"
        className="deliverable-menu__item"
        onClick={handleDownload}
      >
        <span className="deliverable-menu__icon">
          <Download className="h-3.5 w-3.5" />
        </span>
        <div className="deliverable-menu__body">
          <span className="deliverable-menu__label">Download</span>
          <span className="deliverable-menu__hint">
            Save as JSON · v{deliverable.version}
          </span>
        </div>
      </button>

      <button
        type="button"
        role="menuitem"
        className="deliverable-menu__item"
        onClick={handleShare}
      >
        <span className="deliverable-menu__icon">
          <Share2 className="h-3.5 w-3.5" />
        </span>
        <div className="deliverable-menu__body">
          <span className="deliverable-menu__label">Copy share link</span>
          <span className="deliverable-menu__hint">
            {deliverable.shareLinkId ? 'Public surface URL' : 'Page link'}
          </span>
        </div>
      </button>

      <div className="deliverable-menu__divider" />

      <button
        type="button"
        role="menuitem"
        className="deliverable-menu__item"
        onClick={() => {
          /* Deliverable.id is the outputs.id UUID — the comments
             table anchors on that. Falls back to the legacy
             onOpenComments callback when provided. */
          if (deliverable.id) {
            openCommentPanel({
              outputId: deliverable.id,
              title: deliverable.title,
              pageId: deliverable.pageId,
              ventureId: deliverable.ventureId,
              shareLinkId: deliverable.shareLinkId,
            });
          } else {
            onOpenComments?.();
          }
          onClose();
        }}
      >
        <span className="deliverable-menu__icon">
          <MessageSquare className="h-3.5 w-3.5" />
        </span>
        <div className="deliverable-menu__body">
          <span className="deliverable-menu__label">Comments</span>
          <span className="deliverable-menu__hint">Attach a note to this file</span>
        </div>
      </button>
    </div>
  );
}
