import { cn } from '@/lib/utils/cn';

export type ConfidenceLevel = 'solid' | 'hatched' | 'pausing';

export function confidenceLevel(pct: number): ConfidenceLevel {
  if (pct >= 80) return 'solid';
  if (pct >= 50) return 'hatched';
  return 'pausing';
}

interface ConfidenceSignalProps {
  pct: number;
  agentColor: string;
  className?: string;
  size?: number;
}

export function ConfidenceSignal({
  pct,
  agentColor,
  className,
  size = 10,
}: ConfidenceSignalProps) {
  const level = confidenceLevel(pct);

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
  };

  if (level === 'solid') {
    style.background = agentColor;
  } else if (level === 'hatched') {
    style.background = `repeating-linear-gradient(
      45deg,
      ${agentColor} 0 2px,
      transparent 2px 4px
    )`;
    style.border = `1px solid ${agentColor}`;
  } else {
    style.background = 'var(--warning)';
  }

  return (
    <span
      className={cn(
        'inline-block shrink-0',
        level === 'pausing' && 'animate-pulse motion-reduce:animate-none',
        className
      )}
      style={style}
      aria-label={`${pct}% confidence`}
      role="img"
    />
  );
}
