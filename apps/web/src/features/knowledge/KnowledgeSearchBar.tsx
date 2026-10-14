import { useState } from 'react';
import { Sparkles, Loader2, ArrowUp } from 'lucide-react';
import { useInquiry } from '@/lib/hooks/useInquiry';

interface Props {
  ventureId?: string;
  workspaceId?: string;
  entryCount: number;
}

export function KnowledgeSearchBar({ ventureId, workspaceId, entryCount }: Props) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inquiry = useInquiry();

  async function submit() {
    const q = query.trim();
    if (!q || inquiry.isPending) return;
    setError(null);
    try {
      await inquiry.mutateAsync({ query: q, ventureId, workspaceId });
      setQuery('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inquiry failed');
    }
  }

  return (
    <div className="kb-search">
      <div className="kb-search__field">
        <span className="kb-search__icon">
          {inquiry.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </span>
        <input
          type="text"
          className="kb-search__input"
          placeholder={
            entryCount === 0
              ? 'Ask a question once this venture has research…'
              : 'Ask anything about this venture…'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={inquiry.isPending || entryCount === 0}
        />
        <button
          type="button"
          className="kb-search__send"
          onClick={submit}
          disabled={!query.trim() || inquiry.isPending || entryCount === 0}
          aria-label="Ask"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="kb-search__error">{error}</p>}
      {inquiry.isPending && (
        <p className="kb-search__hint">Searching the venture's knowledge…</p>
      )}
    </div>
  );
}
