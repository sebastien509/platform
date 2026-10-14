import { useState } from 'react';
import {
  Link2,
  MessageSquare,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useConnectors } from '@/lib/hooks/useConnectors';
import { shareOutput } from '@/lib/connectors/shareOutput';
import type { ShareSnapshot } from '@/lib/share';

export interface MenuTarget {
  id: string;
  title: string;
  summary?: string;
  snapshot?: ShareSnapshot;
  /** Where the entry lives in the app — used for Copy link. */
  internalPath?: string;
  /** Where the entry lives externally — used for Open. */
  externalUrl?: string;
}

interface Props {
  target: MenuTarget;
  onClose: () => void;
}

export function KnowledgeEntryMenu({ target, onClose }: Props) {
  const { connectors } = useConnectors();
  const [busy, setBusy] = useState<'notion' | 'slack' | null>(null);
  const [copied, setCopied] = useState(false);
  const [commented, setCommented] = useState(false);

  const slackConnected = connectors.some(
    (c) => c.provider === 'slack' && c.status === 'connected'
  );
  const notionConnected = connectors.some(
    (c) => c.provider === 'notion' && c.status === 'connected'
  );

  const snapshot: ShareSnapshot = target.snapshot ?? {
    title: target.title,
    sections: target.summary
      ? [{ type: 'paragraph', id: 'summary', body: target.summary }]
      : [],
  };

  async function doShare(provider: 'slack' | 'notion') {
    setBusy(provider);
    const res = await shareOutput({
      outputId: target.id,
      provider,
      snapshot,
    });
    setBusy(null);
    if (res.ok) onClose();
  }

  async function copyShareLink() {
    const path = target.internalPath ?? `/knowledge/${target.id}`;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${path}`
        : path;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => onClose(), 800);
    } catch {
      /* Non-fatal */
    }
  }

  function openComment() {
    /* Dispatch an event — the comment panel listens. Fallback is a
       toast in the future. */
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('iv:open-comments', {
          detail: { entryId: target.id, title: target.title },
        })
      );
    }
    setCommented(true);
    setTimeout(() => onClose(), 700);
  }

  return (
    <div className="kb-menu" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="kb-menu__item"
        onClick={copyShareLink}
        disabled={busy !== null}
      >
        {copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        {copied ? 'Link copied' : 'Share link'}
      </button>

      <button
        type="button"
        className="kb-menu__item"
        onClick={openComment}
        disabled={busy !== null}
      >
        {commented ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
        ) : (
          <MessageSquare className="h-3.5 w-3.5" />
        )}
        {commented ? 'Opened' : 'Comment'}
      </button>

      {(notionConnected || slackConnected) && (
        <div className="kb-menu__divider" />
      )}

      {notionConnected && (
        <button
          type="button"
          className="kb-menu__item"
          disabled={busy !== null}
          onClick={() => doShare('notion')}
        >
          {busy === 'notion' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          Share to Notion
        </button>
      )}

      {slackConnected && (
        <button
          type="button"
          className="kb-menu__item"
          disabled={busy !== null}
          onClick={() => doShare('slack')}
        >
          {busy === 'slack' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageSquare className="h-3.5 w-3.5" />
          )}
          Share to Slack
        </button>
      )}

      {target.externalUrl && (
        <>
          <div className="kb-menu__divider" />
          <button
            type="button"
            className="kb-menu__item"
            onClick={() => {
              window.open(target.externalUrl!, '_blank', 'noopener');
              onClose();
            }}
          >
            <Link2 className="h-3.5 w-3.5" />
            Open external
          </button>
        </>
      )}
    </div>
  );
}
