import { useEffect, useState } from 'react';
import {
  X,
  MessageSquare,
  Check,
  Send,
  Copy,
  Link2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { supabase } from '@/lib/supabase';
import { useCommentPanelStore } from '@/lib/stores/commentPanelStore';
import { useDeliverablesStore } from '@/lib/deliverables';
import { createShareLink } from '@/lib/share/createLink';
import {
  useComments,
  useCreateComment,
  useResolveComment,
} from '@/lib/hooks/useComments';

/* ============================================================
   DeliverableCommentsPanel — the founder's discussion surface
   for a single deliverable.

   On mount, resolves the DB-backed share token for this output:
     1. Query share_links for an existing sl_xxx token
     2. If none, create one from the persisted output + payload
     3. Patch the local deliverable so future opens use the token

   This makes "Guest link" always point at a real DB-backed URL,
   even for deliverables created before the DB sharing landed.
   ============================================================ */

export function DeliverableCommentsPanel() {
  const open = useCommentPanelStore((s) => s.open);
  const outputId = useCommentPanelStore((s) => s.outputId);
  const context = useCommentPanelStore((s) => s.context);
  const close = useCommentPanelStore((s) => s.closePanel);

  const { data: comments, isLoading, error } = useComments(
    outputId ?? undefined
  );
  const createComment = useCreateComment();
  const resolveComment = useResolveComment();

  const [body, setBody] = useState('');
  const [copied, setCopied] = useState(false);
  const [meId, setMeId] = useState<string | null>(null);

  /* The live DB token. Initialised from context (fast path), then
     verified / replaced by the resolve effect below. */
  const [dbToken, setDbToken] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');

  /* Auth user id — for "You" attribution */
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      setMeId(data.user?.id ?? null);
    });
  }, []);

  /* Escape closes */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  /* Clear composer when switching deliverables */
  useEffect(() => {
    setBody('');
    setDbToken(null);
    setTokenState('idle');
  }, [outputId]);

  /* Reset copied flag */
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  /* ─── Resolve DB token on open ─── */
  useEffect(() => {
    if (!open || !outputId) return;
    let cancelled = false;

    void (async () => {
      setTokenState('loading');

      /* 1. Existing DB share link for this output? */
      const { data: existing } = await supabase
        .from('share_links')
        .select('id')
        .eq('output_id', outputId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (existing?.id) {
        setDbToken(existing.id);
        setTokenState('ready');

        /* Sync the local deliverable so future opens skip this
           lookup on the fast path. */
        useDeliverablesStore
          .getState()
          .updateDeliverable(outputId, { shareLinkId: existing.id });
        return;
      }

      /* 2. None exists — create one from the persisted output +
         payload snapshot. Works for deliverables created before
         the DB sharing landed. */
      const { data: output } = await supabase
        .from('outputs')
        .select('id, venture_id')
        .eq('id', outputId)
        .maybeSingle();

      const { data: payload } = await supabase
        .from('output_payloads')
        .select('snapshot')
        .eq('output_id', outputId)
        .maybeSingle();

      if (cancelled) return;

      if (!output || !payload?.snapshot) {
        setTokenState('error');
        return;
      }

      const res = await createShareLink({
        outputId,
        ventureId: output.venture_id ?? undefined,
        snapshot: payload.snapshot as any,
        commentsEnabled: true,
      });

      if (cancelled) return;

      if ('id' in res) {
        setDbToken(res.id);
        setTokenState('ready');
        useDeliverablesStore
          .getState()
          .updateDeliverable(outputId, { shareLinkId: res.id });
      } else {
        setTokenState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, outputId]);

  if (!open || !outputId || !context) return null;

  const unresolvedCount = (comments ?? []).filter((c) => !c.resolved).length;

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    await createComment.mutateAsync({
      outputId: outputId!,
      body: trimmed,
    });
  }

  async function handleCopyLink() {
    if (!dbToken) return;
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/share/${dbToken}`
        : `/share/${dbToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      /* Silently ignore */
    }
  }

  const shareReady = tokenState === 'ready' && Boolean(dbToken);

  return (
    <aside
      className={cn('comment-panel', open && 'is-open')}
      role="dialog"
      aria-label="Comments"
    >
      <div className="comment-panel__backdrop" onClick={close} />

      <div className="comment-panel__frame">
        {/* Header */}
        <header className="comment-panel__head">
          <div className="comment-panel__head-left">
            <span className="comment-panel__eyebrow">
              {context.pageId}
            </span>
            <h2 className="comment-panel__title">
              {context.title}
            </h2>
            <span className="comment-panel__meta">
              {unresolvedCount > 0
                ? `${unresolvedCount} open · ${comments?.length ?? 0} total`
                : `${comments?.length ?? 0} comment${
                    (comments?.length ?? 0) === 1 ? '' : 's'
                  }`}
            </span>
          </div>

          <div className="comment-panel__head-actions">
            {tokenState === 'loading' && (
              <span className="comment-panel__copy-btn is-loading">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Preparing link…
              </span>
            )}
            {shareReady && (
              <button
                type="button"
                className="comment-panel__copy-btn"
                onClick={handleCopyLink}
                title="Copy guest link"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Guest link
                  </>
                )}
              </button>
            )}
            {tokenState === 'error' && (
              <span className="comment-panel__copy-btn is-error">
                <AlertCircle className="h-3.5 w-3.5" />
                Link unavailable
              </span>
            )}
            <button
              type="button"
              className="comment-panel__close"
              onClick={close}
              aria-label="Close comments"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="comment-panel__body">
          {isLoading && (
            <div className="comment-panel__state">Loading comments…</div>
          )}

          {error && (
            <div className="comment-panel__state is-error">
              <AlertCircle className="h-4 w-4" />
              Could not load comments.
            </div>
          )}

          {!isLoading && !error && (comments?.length ?? 0) === 0 && (
            <div className="comment-panel__empty">
              <MessageSquare className="h-6 w-6" />
              <p className="comment-panel__empty-title">
                No comments yet
              </p>
              <p className="comment-panel__empty-copy">
                Write the first note, or share the guest link to collect
                feedback from your team and advisors.
              </p>
            </div>
          )}

          {!isLoading && !error && (comments?.length ?? 0) > 0 && (
            <ul className="comment-panel__list">
              {comments!.map((c) => (
                <li
                  key={c.id}
                  className={cn(
                    'comment-panel__item',
                    c.resolved && 'is-resolved'
                  )}
                >
                  <header className="comment-panel__item-head">
                    <span className="comment-panel__item-author">
                      {c.author_id === null
                        ? c.author_name ?? 'Guest'
                        : meId && c.author_id === meId
                        ? 'You'
                        : c.author_name ?? 'Team member'}
                      {c.author_id === null && (
                        <span className="comment-panel__item-tag">
                          Guest
                        </span>
                      )}
                    </span>
                    <time className="comment-panel__item-when">
                      {new Date(c.created_at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </header>

                  {c.section_label && (
                    <span className="comment-panel__item-section">
                      re: {c.section_label}
                    </span>
                  )}

                  <p className="comment-panel__item-body">{c.body}</p>

                  <footer className="comment-panel__item-footer">
                    <button
                      type="button"
                      className={cn(
                        'comment-panel__resolve-btn',
                        c.resolved && 'is-resolved'
                      )}
                      onClick={() =>
                        resolveComment.mutate({
                          id: c.id,
                          resolved: !c.resolved,
                        })
                      }
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {c.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                  </footer>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Composer */}
        <div className="comment-panel__composer">
          <div className="comment-panel__composer-field">
            <textarea
              className="comment-panel__composer-input"
              placeholder="Add a comment…"
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <button
              type="button"
              className="comment-panel__composer-send"
              disabled={!body.trim() || createComment.isPending}
              onClick={handleSubmit}
              aria-label="Send comment"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="comment-panel__composer-hint">
            <Link2 className="h-3 w-3" />
            {shareReady
              ? 'Guests can comment through the guest link.'
              : tokenState === 'loading'
              ? 'Preparing the guest link…'
              : tokenState === 'error'
              ? 'Could not prepare a guest link for this deliverable.'
              : 'Share this deliverable to collect guest feedback.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
