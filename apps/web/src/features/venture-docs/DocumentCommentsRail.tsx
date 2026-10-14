import { useState } from 'react';
import {
  Send,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import {
  useComments,
  useCreateComment,
  useResolveComment,
} from '@/lib/hooks/useComments';

interface Props {
  outputId: string | null | undefined;
}

/**
 * DocumentCommentsRail — the right rail.
 *
 * Only renders when the doc has an output_id (i.e., it's been
 * validated). Draft runs don't get comments — the doc can still
 * change, and the comment table keys off output_id.
 */
export function DocumentCommentsRail({ outputId }: Props) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: comments, isLoading } = useComments(outputId);
  const createComment = useCreateComment(outputId);
  const resolveComment = useResolveComment(outputId);

  if (!outputId) {
    return (
      <aside className="doc-rail doc-rail--comments">
        <div className="doc-rail__head">
          <span className="doc-rail__label">Comments</span>
        </div>
        <p className="doc-rail__empty">
          Comments unlock after validation.
        </p>
      </aside>
    );
  }

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    setBody('');
    try {
      await createComment.mutateAsync({
        outputId: outputId ?? undefined,
        body: trimmed,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post.');
    }
  }

  const unresolved = (comments ?? []).filter((c) => !c.resolved).length;

  return (
    <aside className="doc-rail doc-rail--comments">
      <div className="doc-rail__head">
        <span className="doc-rail__label">Comments</span>
        {(comments?.length ?? 0) > 0 && (
          <span className="doc-rail__count">
            {unresolved > 0
              ? `${unresolved} open`
              : `${comments?.length ?? 0}`}
          </span>
        )}
      </div>

      {/* Composer */}
      <div className="doc-comment-composer">
        <textarea
          className="doc-comment-composer__input"
          placeholder="Add a comment…"
          rows={2}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button
          type="button"
          className="doc-comment-composer__send"
          disabled={!body.trim() || createComment.isPending}
          onClick={submit}
          aria-label="Send comment"
        >
          {createComment.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {error && (
        <p className="doc-comment-composer__error">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <p className="doc-rail__empty">Loading…</p>
      ) : (comments?.length ?? 0) === 0 ? (
        <p className="doc-rail__empty">No comments yet.</p>
      ) : (
        <ul className="doc-comment-list">
          {comments!.map((c) => (
            <li
              key={c.id}
              className={cn('doc-comment', c.resolved && 'is-resolved')}
            >
              <div className="doc-comment__head">
                <span className="doc-comment__author">
                  {c.author_name ?? 'Founder'}
                </span>
                <span className="doc-comment__time">
                  {new Date(c.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="doc-comment__body">{c.body}</p>
              <button
                type="button"
                className="doc-comment__resolve"
                onClick={() =>
                  resolveComment.mutate({
                    outputId: outputId ?? undefined,
                    id: c.id,
                    resolved: !c.resolved,
                  })
                }
              >
                <CheckCircle2 className="h-3 w-3" />
                {c.resolved ? 'Reopen' : 'Resolve'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
