import { GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useTraceStore, type TraceKind } from '@/lib/stores/traceStore';

interface TraceButtonProps {
  id: string;
  kind: TraceKind;
  /** Optional label. If omitted, only the icon renders. */
  label?: string;
  className?: string;
}

export function TraceButton({ id, kind, label, className }: TraceButtonProps) {
  const openTrace = useTraceStore((s) => s.openTrace);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openTrace(id, kind);
      }}
      aria-label={label ?? 'View lineage'}
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs',
        'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
        'hover:bg-[var(--surface-2)] transition-colors',
        className
      )}
    >
      <GitBranch className="h-3 w-3" />
      {label}
    </button>
  );
}
