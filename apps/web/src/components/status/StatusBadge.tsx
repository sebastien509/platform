import { cn } from '@/lib/utils/cn';
import {
  toneForStatus,
  labelForStatus,
  StatusTone,
} from '@/lib/status/statusTokens';

interface StatusBadgeProps {
  status: string;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const TONE_STYLES: Record<StatusTone, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)]',
    text: 'text-[var(--success)]',
    dot: 'bg-[var(--success)]',
  },
  warning: {
    bg: 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]',
    text: 'text-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
  },
  error: {
    bg: 'bg-[color-mix(in_srgb,var(--error)_12%,transparent)]',
    text: 'text-[var(--error)]',
    dot: 'bg-[var(--error)]',
  },
  info: {
    bg: 'bg-[color-mix(in_srgb,var(--info)_12%,transparent)]',
    text: 'text-[var(--info)]',
    dot: 'bg-[var(--info)]',
  },
  muted: {
    bg: 'bg-[var(--surface-2)]',
    text: 'text-[var(--text-muted)]',
    dot: 'bg-[var(--text-muted)]',
  },
  accent: {
    bg: 'bg-[var(--accent-muted)]',
    text: 'text-[var(--accent)]',
    dot: 'bg-[var(--accent)]',
  },
};

export function StatusBadge({
  status,
  tone,
  className,
  dot = false,
  size = 'sm',
}: StatusBadgeProps) {
  const resolvedTone = tone ?? toneForStatus(status);
  const style = TONE_STYLES[resolvedTone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs',
        style.bg,
        style.text,
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      )}
      {labelForStatus(status)}
    </span>
  );
}
