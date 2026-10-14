import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  Loader2,
  Send,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import { PrintDocFrame } from '@/features/idea-journey/research/viewer/PrintDocFrame';
import { SectionRenderer } from '@/features/idea-journey/research/viewer/SectionRenderer';
import { shareSectionToResearchSection } from '@/features/venture-actions/viewers/deliverableToDocument';
import {
  readSharedOutput,
  writeGuestComment,
  type GuestComment,
  type GuestShare,
} from '@/lib/share/guest';
import type { ResearchSection } from '@/lib/types';

/* ============================================================
   SharedOutputPage — the public guest view.

   Route: /share/:token

   Rendered through a portal to document.body so it escapes the
   platform shell's height/overflow lock entirely. The shell uses
   `height: 100vh; overflow: hidden` on #root, and position:fixed
   can be defeated by a transformed ancestor — the portal is the
   bulletproof escape.
   ============================================================ */

type ViewState =
  | { status: 'loading' }
  | { status: 'not_found'; message: string }
  | { status: 'ready'; share: GuestShare; comments: GuestComment[] };

function SharedOutputContent() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const [draft, setDraft] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [posting, setPosting] = useState(false);

  /* Portal is outside the shell — reset body scroll defensively.
     On unmount, restore whatever was there so returning to the
     app doesn't lose its state. */
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      rootOverflow: root?.style.overflow ?? '',
      rootHeight: root?.style.height ?? '',
    };

    html.style.overflow = 'auto';
    html.style.height = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';
    if (root) {
      root.style.overflow = 'visible';
      root.style.height = 'auto';
    }

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      if (root) {
        root.style.overflow = prev.rootOverflow;
        root.style.height = prev.rootHeight;
      }
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    void (async () => {
      const { share, comments, error } = await readSharedOutput(token);
      if (cancelled) return;

      if (!share) {
        setState({
          status: 'not_found',
          message:
            error ?? 'This link is invalid, expired, or was revoked.',
        });
        return;
      }

      setState({ status: 'ready', share, comments });
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handlePost() {
    if (!token || state.status !== 'ready') return;
    const body = draft.trim();
    if (!body) return;

    setPosting(true);
    const { comment, error } = await writeGuestComment({
      token,
      body,
      authorName: authorName.trim() || 'Guest',
    });
    setPosting(false);

    if (error || !comment) return;

    setState({
      ...state,
      comments: [...state.comments, comment],
    });
    setDraft('');
  }

  if (state.status === 'loading') {
    return (
      <div className="shared-page shared-page--state">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p>Loading…</p>
      </div>
    );
  }

  if (state.status === 'not_found') {
    return (
      <div className="shared-page shared-page--state">
        <AlertCircle className="h-5 w-5" />
        <h1 className="shared-page__state-title">
          This link is no longer available
        </h1>
        <p className="shared-page__state-copy">{state.message}</p>
      </div>
    );
  }

  const { share, comments } = state;
  const sections: ResearchSection[] = share.snapshot.sections.map(
    shareSectionToResearchSection
  );

  const surfaceLabel =
    share.surface_id?.split('.').map((s) => s.replace(/-/g, ' '))[1] ??
    'Document';

  return (
    <div className="shared-page">
      <div className="shared-page__paper">
        <PrintDocFrame
          kind="market"
          typeLabel={surfaceLabel.toUpperCase()}
          title={share.snapshot.title}
          summary={share.snapshot.kicker}
        >
          {sections.map((s, idx) => (
            <SectionRenderer key={s.id ?? `sec-${idx}`} section={s} />
          ))}
        </PrintDocFrame>
      </div>

      <div className="shared-page__comments">
        <header className="shared-page__comments-head">
          <MessageSquare className="h-4 w-4" />
          <h2 className="shared-page__comments-title">
            Comments
            {comments.length > 0 && (
              <span className="shared-page__comments-count">
                {comments.length}
              </span>
            )}
          </h2>
        </header>

        {comments.length === 0 && (
          <p className="shared-page__comments-empty">
            No comments yet. Leave the first note.
          </p>
        )}

        {comments.length > 0 && (
          <ul className="shared-page__comments-list">
            {comments.map((c) => (
              <li key={c.id} className="shared-page__comment">
                <header className="shared-page__comment-head">
                  <span className="shared-page__comment-author">
                    {c.author_id
                      ? c.author_name ?? 'Founder'
                      : c.author_name ?? 'Guest'}
                  </span>
                  <time className="shared-page__comment-when">
                    {new Date(c.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </header>
                {c.section_label && (
                  <span className="shared-page__comment-section">
                    re: {c.section_label}
                  </span>
                )}
                <p className="shared-page__comment-body">{c.body}</p>
              </li>
            ))}
          </ul>
        )}

        {share.comments_enabled ? (
          <div className="shared-page__composer">
            <input
              type="text"
              className="shared-page__composer-name"
              placeholder="Your name (optional)"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
            />
            <div className="shared-page__composer-field">
              <textarea
                className="shared-page__composer-input"
                placeholder="Leave a comment…"
                rows={3}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
              />
              <button
                type="button"
                className="shared-page__composer-send"
                disabled={!draft.trim() || posting}
                onClick={handlePost}
                aria-label="Post comment"
              >
                {posting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="shared-page__composer-hint">
              <CheckCircle2 className="h-3 w-3" />
              Your comment is visible to the founder and other viewers.
            </p>
          </div>
        ) : (
          <p className="shared-page__comments-empty">
            Comments are disabled on this share.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SharedOutputPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  /* Portal to document.body — escapes the shell's #root entirely.
     This is the definitive fix for the scroll lock: the guest page
     is no longer a descendant of any transformed / overflow-locked
     ancestor. */
  return createPortal(<SharedOutputContent />, document.body);
}
