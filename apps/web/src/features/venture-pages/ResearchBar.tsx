import { useState } from 'react';
import { Search, ArrowUp, FileText, Globe } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { runResearch } from '@/features/venture-actions/research/runResearch';
import type { VentureSection } from './engine/types';

type Mode = 'venture' | 'external' | 'compare' | 'files';

const MODE_META: Record<Mode, { label: string; icon: typeof FileText }> = {
  venture: { label: 'Venture files', icon: FileText },
  external: { label: 'External research', icon: Globe },
  compare: { label: 'Compare', icon: Search },
  files: { label: 'Analyze files', icon: FileText },
};

/**
 * ResearchBar — the Knowledge page's hero input.
 *
 * Starts a Research OPS. Same flow as every other op:
 * drawer opens → questions → output → validate → saved to Knowledge.
 */
export function ResearchBar({
  section,
}: {
  section: Extract<VentureSection, { type: 'research-bar' }>;
}) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('venture');

  const modes = section.modes ?? ['venture', 'external', 'compare', 'files'];

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    runResearch(trimmed, mode);
    setQuery('');
  };

  return (
    <section className="research-bar">
      <header className="research-bar__header">
        <h2 className="research-bar__title">
          {section.label ?? 'Research'}
        </h2>
        {section.hint && (
          <p className="research-bar__hint">{section.hint}</p>
        )}
      </header>

      <div className="research-bar__field">
        <span className="research-bar__field-icon">
          <Search className="h-4 w-4" />
        </span>
        <textarea
          className="research-bar__input"
          placeholder={
            section.placeholder ??
            'Ask a question about your venture, uploaded files, or the external market…'
          }
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          type="button"
          className="research-bar__send"
          disabled={!query.trim()}
          onClick={handleSubmit}
          aria-label="Send research request"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      <div className="research-bar__modes">
        {modes.map((m) => {
          const meta = MODE_META[m];
          const Icon = meta.icon;
          return (
            <button
              key={m}
              type="button"
              className={cn(
                'research-bar__mode',
                m === mode && 'is-active'
              )}
              onClick={() => setMode(m)}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
