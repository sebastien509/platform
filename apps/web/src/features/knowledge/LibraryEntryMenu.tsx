import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Link2 } from 'lucide-react';
import type { KnowledgeEntry } from '@/lib/types';

interface LibraryEntryMenuProps {
  entry: KnowledgeEntry;
  onClose: () => void;
}

/**
 * LibraryEntryMenu — the 3-dot action menu for a Library row.
 *
 * "Continue research" is the primary action: it routes back to the
 * surface where research actually happens —
 *   · the venture's Knowledge page (research bar) if the entry came
 *     from a validated venture
 *   · the idea's journey if the entry came from an unvalidated idea
 */
export function LibraryEntryMenu({ entry, onClose }: LibraryEntryMenuProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);

  // Cast defensively — these fields may not exist on every entry yet
  const e = entry as KnowledgeEntry & {
    sourceVentureId?: string;
    sourceIdeaId?: string;
  };
  const sourceVentureId = e.sourceVentureId;
  const sourceIdeaId = e.sourceIdeaId;
  const canExtend = Boolean(sourceVentureId || sourceIdeaId);

  const handleExtend = () => {
    if (sourceVentureId) {
      navigate(`/ventures/${sourceVentureId}/knowledge`);
    } else if (sourceIdeaId) {
      navigate(`/ideas/${sourceIdeaId}`);
    }
    onClose();
  };

  const handleCopy = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/library/${entry.id}`
        );
      } catch {
        /* noop */
      }
    }
    onClose();
  };

  return (
    <div ref={ref} className="library-menu" role="menu">
      <button
        type="button"
        className="library-menu__item"
        onClick={handleExtend}
        disabled={!canExtend}
        role="menuitem"
      >
        <span className="library-menu__icon">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="library-menu__body">
          <span className="library-menu__label">Continue research</span>
          <span className="library-menu__hint">
            {sourceVentureId
              ? 'Opens in venture research'
              : sourceIdeaId
              ? 'Opens in idea research'
              : 'No source to extend'}
          </span>
        </span>
      </button>

      <div className="library-menu__divider" />

      <button
        type="button"
        className="library-menu__item"
        onClick={handleCopy}
        role="menuitem"
      >
        <span className="library-menu__icon">
          <Link2 className="h-3.5 w-3.5" />
        </span>
        <span className="library-menu__body">
          <span className="library-menu__label">Copy link</span>
        </span>
      </button>
    </div>
  );
}
