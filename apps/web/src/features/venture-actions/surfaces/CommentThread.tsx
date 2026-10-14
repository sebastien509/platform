import { useState } from 'react';
import { Send } from 'lucide-react';
import { useShareStore } from '@/lib/share';
import type { ShareComment } from '@/lib/share';

interface CommentThreadProps {
  linkId: string;
  comments: ShareComment[];
  /** Section anchor for a specific comment, if any. */
  sectionId?: string;
}

/**
 * CommentThread — the audience's feedback loop.
 * Anyone with the link can post. Comments persist to the share store
 * and later flow back into the venture as Evidence.
 */
export function CommentThread({ linkId, comments, sectionId }: CommentThreadProps) {
  const addComment = useShareStore((s) => s.addComment);
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    addComment({
      linkId,
      sectionId,
      author: author.trim() || 'Anonymous',
      body: body.trim(),
    });
    setBody('');
  };

  return (
    <section className="comment-thread">
      <h2 className="comment-thread__title">
        Comments{comments.length > 0 ? ` · ${comments.length}` : ''}
      </h2>

      {comments.length > 0 && (
        <ul className="comment-thread__list">
          {comments.map((c) => (
            <li key={c.id} className="comment-thread__comment">
              <div className="comment-thread__head">
                <span className="comment-thread__author">{c.author}</span>
                <span className="comment-thread__when">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="comment-thread__body">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-thread__form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="comment-thread__author-input"
          placeholder="Your name (optional)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="comment-thread__body-input"
          placeholder="Leave a comment…"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />
        <div className="comment-thread__actions">
          <span className="comment-thread__hint">⌘ + Enter to send</span>
          <button
            type="submit"
            className="comment-thread__send"
            disabled={!body.trim()}
          >
            <Send className="h-3.5 w-3.5" />
            Post comment
          </button>
        </div>
      </form>
    </section>
  );
}
