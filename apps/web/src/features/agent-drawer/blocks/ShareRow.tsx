import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useConnectors } from '@/lib/hooks/useConnectors';
import { useOutputShares } from '@/lib/hooks/useOutputShares';
import { useDeliverablesStore } from '@/lib/deliverables';
import { shareOutput } from '@/lib/connectors/shareOutput';
import type { ShareSnapshot } from '@/lib/share';

interface ShareRowProps {
  outputId: string;
  snapshot: ShareSnapshot;
}

type Busy = 'slack' | 'notion' | null;

export function ShareRow({ outputId, snapshot }: ShareRowProps) {
  const { connectors } = useConnectors();
  const qc = useQueryClient();
  const { data: shares } = useOutputShares(outputId);

  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [channelOpen, setChannelOpen] = useState(false);
  const [channel, setChannel] = useState('#general');

  /* Read the current share link id from the store — it flips from
     the local sh_xxx to the DB sl_xxx when the async write lands.
     The URL we put in the Slack message is the DB one. */
  const shareLinkId = useDeliverablesStore(
    (s) => s.deliverables[outputId]?.shareLinkId
  );
  const shareUrl = useMemo(() => {
    if (!shareLinkId || typeof window === 'undefined') return undefined;
    /* Prefer DB-backed tokens — those resolve for guests. */
    if (!shareLinkId.startsWith('sl_')) return undefined;
    return `${window.location.origin}/share/${shareLinkId}`;
  }, [shareLinkId]);

  const slackConnected = connectors.some(
    (c) => c.provider === 'slack' && c.status === 'connected'
  );
  const notionConnected = connectors.some(
    (c) => c.provider === 'notion' && c.status === 'connected'
  );

  const slackShare = shares?.find((s) => s.action === 'slack.post-message');
  const notionShare = shares?.find(
    (s) => s.action === 'notion.create-page'
  );

  async function doShare(provider: 'slack' | 'notion', ch?: string) {
    setBusy(provider);
    setError(null);
    const res = await shareOutput({
      outputId,
      provider,
      snapshot,
      shareUrl,
      channel: ch,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? 'Share failed');
      return;
    }
    setChannelOpen(false);
    /* Refresh the share state so the button flips to Shared. */
    qc.invalidateQueries({ queryKey: ['output-shares', outputId] });
  }

  if (!slackConnected && !notionConnected) {
    return (
      <div className="share-row share-row--empty">
        <span className="share-row__hint">
          Connect Slack or Notion on Connectors to share.
        </span>
      </div>
    );
  }

  return (
    <div className="share-row">
      <span className="share-row__label">Share</span>

      {slackConnected &&
        (slackShare ? (
          <a
            className="share-btn is-shared"
            href={`https://slack.com/app_redirect?channel=${(
              slackShare.response as any
            )?.channel ?? ''}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CheckCircle2 className="h-3 w-3" />
            Slack
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <button
            type="button"
            className="share-btn"
            onClick={() => setChannelOpen((v) => !v)}
            disabled={busy === 'slack'}
          >
            {busy === 'slack' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MessageSquare className="h-3 w-3" />
            )}
            Slack
          </button>
        ))}

      {notionConnected &&
        (notionShare ? (
          <a
            className="share-btn is-shared"
            href={(notionShare.external_id as string) ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CheckCircle2 className="h-3 w-3" />
            Notion
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : (
          <button
            type="button"
            className="share-btn"
            onClick={() => doShare('notion')}
            disabled={busy === 'notion'}
          >
            {busy === 'notion' ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <FileText className="h-3 w-3" />
            )}
            Notion
          </button>
        ))}

      {channelOpen && !slackShare && (
        <div className="share-row__channel">
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="#general"
            className="share-row__channel-input"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') doShare('slack', channel);
              if (e.key === 'Escape') setChannelOpen(false);
            }}
          />
          <button
            type="button"
            className="share-btn is-primary"
            onClick={() => doShare('slack', channel)}
            disabled={busy === 'slack' || !channel.trim()}
          >
            Send
          </button>
        </div>
      )}

      {error && (
        <span className="share-row__error">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
    </div>
  );
}
