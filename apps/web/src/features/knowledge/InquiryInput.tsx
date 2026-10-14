import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface InquiryInputProps {
  onSubmit: (question: string) => void;
  /** True while the Knowledge Agent is synthesizing. */
  running?: boolean;
  className?: string;
  placeholder?: string;
}

export function InquiryInput({
  onSubmit,
  running = false,
  className,
  placeholder = 'Ask a research question across everything…',
}: InquiryInputProps) {
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length > 3 && !running;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(value.trim());
    setValue('');
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--agent-knowledge-muted)] shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-[var(--agent-knowledge)]" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          placeholder={placeholder}
          disabled={running}
          className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="gap-1 shrink-0"
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
          ) : (
            <ArrowRight className="h-3.5 w-3.5" />
          )}
          {running ? 'Synthesizing' : 'Ask'}
        </Button>
      </div>
      <p className="mt-2 text-2xs text-[var(--text-muted)] pl-8">
        The Knowledge Agent searches reports, interviews, and selections across all ventures.
        The answer becomes a new Knowledge entry with citations.
      </p>
    </div>
  );
}
