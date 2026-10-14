import { useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Sparkles, Loader2 } from 'lucide-react';
import { ModalShell } from '@/components/containers';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export type ResearchKind = 'market' | 'competitor' | 'customer';

interface ResearchMorePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the founder submits — kind + their question. */
  onSubmit: (input: { kind: ResearchKind; query: string }) => void | Promise<void>;
  /** Optional — hides the modal while a run is in flight. */
  busy?: boolean;
}

const KINDS: Array<{
  kind: ResearchKind;
  label: string;
  hint: string;
}> = [
  {
    kind: 'market',
    label: 'Market research',
    hint: 'Sizing, trends, buying signals',
  },
  {
    kind: 'competitor',
    label: 'Competitive landscape',
    hint: 'Who is winning — and how',
  },
  {
    kind: 'customer',
    label: 'Customer insight',
    hint: 'Who feels the pain — and why',
  },
];

export function ResearchMorePicker({
  open,
  onOpenChange,
  onSubmit,
  busy = false,
}: ResearchMorePickerProps) {
  const [kind, setKind] = useState<ResearchKind | null>(null);
  const [query, setQuery] = useState('');

  function reset() {
    setKind(null);
    setQuery('');
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit() {
    if (!kind || !query.trim()) return;
    await onSubmit({ kind, query: query.trim() });
    handleClose(false);
  }

  /* ── Step 2 — free-text input ── */
  if (kind) {
    const selected = KINDS.find((k) => k.kind === kind)!;
    return (
      <ModalShell
        open={open}
        onOpenChange={handleClose}
        title={selected.label}
        description="One targeted thread — the agent will focus on exactly this."
        size="md"
      >
        <div className="space-y-4 py-2">
          <button
            type="button"
            onClick={() => setKind(null)}
            className="inline-flex items-center gap-1.5 text-2xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Change type
          </button>

          <div>
            <label className="text-2xs font-medium uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
              What should the agent find out?
            </label>
            <textarea
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder={
                kind === 'market'
                  ? 'e.g. How fast is the mid-market biotech segment growing?'
                  : kind === 'competitor'
                    ? 'e.g. Which competitors are winning on data residency?'
                    : 'e.g. What pain drives compliance teams to buy?'
              }
              rows={4}
              className={cn(
                'w-full rounded-md border border-[var(--border)] bg-[var(--surface-1)]',
                'px-3 py-2 text-sm text-[var(--text-primary)] resize-none',
                'focus:outline-none focus:border-[var(--accent)]',
              )}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClose(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!query.trim() || busy}
              className="gap-1.5"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Run research
            </Button>
          </div>
        </div>
      </ModalShell>
    );
  }

  /* ── Step 1 — pick a type ── */
  return (
    <ModalShell
      open={open}
      onOpenChange={handleClose}
      title="What kind of research?"
      description="One focused pass. The agent builds on what's already there."
      size="md"
    >
      <div className="space-y-2 py-2">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            onClick={() => setKind(k.kind)}
            className={cn(
              'w-full text-left rounded-lg border border-[var(--border)] bg-[var(--surface-1)]',
              'p-4 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-muted)]/30',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--surface-2)] text-[var(--text-muted)]">
                <Search className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[var(--text-primary)]">
                  {k.label}
                </p>
                <p className="mt-0.5 text-2xs text-[var(--text-secondary)]">
                  {k.hint}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
