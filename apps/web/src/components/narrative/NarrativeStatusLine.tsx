import { NarrativeTrend, TrendDirection } from './NarrativeTrend';
import { cn } from '@/lib/utils/cn';

interface NarrativeStatusLineProps {
  sentence: string;
  trend: TrendDirection;
  onExpand: () => void;
  className?: string;
}

export function NarrativeStatusLine({
  sentence,
  trend,
  onExpand,
  className,
}: NarrativeStatusLineProps) {
  return (
    <button
      type="button"
      className={cn('narrative-line', className)}
      onClick={onExpand}
      aria-label={`View health details. ${sentence}`}
    >
      <NarrativeTrend direction={trend} />
      <span className="narrative-line__text">{sentence}</span>
    </button>
  );
}
